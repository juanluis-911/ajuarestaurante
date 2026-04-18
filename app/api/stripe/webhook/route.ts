import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  const WEBHOOK_SECRET = process.env.STRIPE_CONNECT_WEBHOOK_SECRET!
  const signature = request.headers.get('stripe-signature')
  const rawBody = await request.text()

  if (!signature) {
    return NextResponse.json({ error: 'Sin firma' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Firma inválida' }, { status: 400 })
  }

  const supabase = createServiceClient()

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const orderId = paymentIntent.metadata?.order_id

    if (orderId) {
      await supabase
        .from('orders')
        .update({ payment_status: 'paid', status: 'confirmed' })
        .eq('id', orderId)
        .eq('payment_intent_id', paymentIntent.id)
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent
    const orderId = paymentIntent.metadata?.order_id

    if (orderId) {
      await supabase
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', orderId)
        .eq('payment_intent_id', paymentIntent.id)
    }
  }

  return NextResponse.json({ received: true })
}
