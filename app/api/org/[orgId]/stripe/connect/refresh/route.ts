import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

// Stripe redirects here when the account link expires — we generate a new one
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const { origin: APP_URL } = new URL(_request.url)
  const { orgId } = await params
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('organization_settings')
    .select('stripe_account_id, org_id')
    .eq('org_id', orgId)
    .single()

  if (!data?.stripe_account_id) {
    return NextResponse.redirect(`${APP_URL}/org/${orgId}/settings?stripe=error`)
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('slug')
    .eq('id', orgId)
    .single()

  const accountLink = await stripe.accountLinks.create({
    account: data.stripe_account_id,
    refresh_url: `${APP_URL}/api/org/${orgId}/stripe/connect/refresh`,
    return_url: `${APP_URL}/api/auth/stripe/callback?org_id=${orgId}&org_slug=${org?.slug ?? ''}`,
    type: 'account_onboarding',
  })

  return NextResponse.redirect(accountLink.url)
}
