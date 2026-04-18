import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const { origin: APP_URL } = new URL(request.url)
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('org_id')
  const orgSlug = searchParams.get('org_slug')

  if (!orgId || !orgSlug) {
    return NextResponse.redirect(`${APP_URL}/login`)
  }

  const supabase = createServiceClient()

  const { data: settings } = await supabase
    .from('organization_settings')
    .select('stripe_account_id')
    .eq('org_id', orgId)
    .single()

  if (!settings?.stripe_account_id) {
    return NextResponse.redirect(`${APP_URL}/org/${orgSlug}/settings?stripe=error`)
  }

  // Verify the account completed onboarding
  const account = await stripe.accounts.retrieve(settings.stripe_account_id)
  const complete = account.details_submitted

  await supabase
    .from('organization_settings')
    .update({
      stripe_onboarding_complete: complete,
      stripe_enabled: complete,
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', orgId)

  const status = complete ? 'connected' : 'incomplete'
  return NextResponse.redirect(`${APP_URL}/org/${orgSlug}/settings?stripe=${status}`)
}
