import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getUserContext, canManageOrg } from '@/lib/auth/get-user-context'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params
    const ctx = await getUserContext()

    if (!canManageOrg(ctx, orgId)) {
      return NextResponse.json({ error: 'Sin autorización' }, { status: 403 })
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    const { origin } = new URL(request.url)
    const APP_URL = origin
    const supabase = await createClient()

    // Get org slug for return URL
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', orgId)
      .single()

    if (!org) {
      return NextResponse.json({ error: 'Organización no encontrada' }, { status: 404 })
    }

    // Check if already has a Stripe account in progress
    const serviceSupabase = createServiceClient()
    const { data: existing } = await serviceSupabase
      .from('organization_settings')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('org_id', orgId)
      .maybeSingle()

    let accountId = existing?.stripe_account_id

    if (!accountId) {
      // Create a new Standard connected account
      const account = await stripe.accounts.create({ type: 'standard' })
      accountId = account.id

      // Save account ID (onboarding not complete yet)
      await serviceSupabase
        .from('organization_settings')
        .upsert({
          org_id: orgId,
          stripe_account_id: accountId,
          stripe_onboarding_complete: false,
          stripe_enabled: false,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'org_id' })
    }

    // Create account link for onboarding (or re-onboarding)
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${APP_URL}/api/org/${orgId}/stripe/connect/refresh`,
      return_url: `${APP_URL}/api/auth/stripe/callback?org_id=${orgId}&org_slug=${org.slug}`,
      type: 'account_onboarding',
    })

    return NextResponse.json({ url: accountLink.url })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
