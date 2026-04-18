import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canAccessRestaurant } from '@/lib/auth/get-user-context'
import crypto from 'crypto'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params
    const ctx = await getUserContext()

    if (!canAccessRestaurant(ctx, restaurantId)) {
      return NextResponse.json({ error: 'Sin autorización' }, { status: 403 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ webhooks: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params
    const ctx = await getUserContext()

    if (!canAccessRestaurant(ctx, restaurantId)) {
      return NextResponse.json({ error: 'Sin autorización' }, { status: 403 })
    }

    const body = await request.json()
    const { url, events } = body as { url: string; events: string[] }

    if (!url || !events || events.length === 0) {
      return NextResponse.json({ error: 'url y events son requeridos' }, { status: 400 })
    }

    const secret = crypto.randomBytes(32).toString('hex')

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .insert({
        restaurant_id: restaurantId,
        url,
        events,
        is_active: true,
        secret,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Return secret only on creation — never exposed again
    return NextResponse.json({ webhook: data, secret })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
