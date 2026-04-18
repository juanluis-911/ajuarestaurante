import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { order_id } = body as { order_id?: string }

    if (!order_id) {
      return NextResponse.json({ error: 'order_id requerido' }, { status: 400 })
    }

    const supabase = createServiceClient()

    const { data: order } = await supabase
      .from('orders')
      .select('id, total, restaurant_id, payment_intent_id, payment_status, order_number')
      .eq('id', order_id)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ error: 'Esta orden ya fue pagada' }, { status: 400 })
    }

    // Get restaurant → org → connected Stripe account
    const { data: restaurant } = await supabase
      .from('restaurants')
      .select('org_id')
      .eq('id', order.restaurant_id)
      .single()

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurante no encontrado' }, { status: 404 })
    }

    const { data: orgSettings } = await supabase
      .from('organization_settings')
      .select('stripe_account_id, stripe_onboarding_complete, stripe_enabled')
      .eq('org_id', restaurant.org_id)
      .single()

    if (!orgSettings?.stripe_enabled || !orgSettings.stripe_onboarding_complete || !orgSettings.stripe_account_id) {
      return NextResponse.json({ error: 'Pagos con tarjeta no disponibles' }, { status: 400 })
    }

    const connectedAccountId = orgSettings.stripe_account_id

    // Reuse existing PaymentIntent if still valid
    if (order.payment_intent_id) {
      try {
        const existing = await stripe.paymentIntents.retrieve(
          order.payment_intent_id,
          undefined,
          { stripeAccount: connectedAccountId }
        )
        if (existing.status === 'requires_payment_method' || existing.status === 'requires_confirmation') {
          return NextResponse.json({ client_secret: existing.client_secret })
        }
      } catch {
        // PaymentIntent inválido — crear uno nuevo
      }
    }

    // Create PaymentIntent on the connected account (money goes directly to them)
    const amount = Math.round(Number(order.total) * 100)
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount,
        currency: 'mxn',
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
          restaurant_id: order.restaurant_id,
        },
      },
      { stripeAccount: connectedAccountId }
    )

    await supabase
      .from('orders')
      .update({ payment_intent_id: paymentIntent.id, payment_status: 'pending' })
      .eq('id', order_id)

    return NextResponse.json({ client_secret: paymentIntent.client_secret })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
