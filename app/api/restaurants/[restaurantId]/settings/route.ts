import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canAccessRestaurant } from '@/lib/auth/get-user-context'

const DEFAULT_SETTINGS = {
  ticket_header: null,
  ticket_footer: null,
  ticket_show_logo: true,
  ticket_show_address: true,
  ticket_show_phone: true,
  business_hours: null,
  accepts_cash: true,
  accepts_card: true,
  stripe_account_id: null,
}

const ALLOWED_FIELDS = [
  'ticket_header',
  'ticket_footer',
  'ticket_show_logo',
  'ticket_show_address',
  'ticket_show_phone',
  'business_hours',
  'accepts_cash',
  'accepts_card',
  'stripe_account_id',
] as const

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
      .from('restaurant_settings')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ settings: data ?? { restaurant_id: restaurantId, ...DEFAULT_SETTINGS } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
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
    const supabase = await createClient()

    // Build partial update from allowed fields only
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    for (const field of ALLOWED_FIELDS) {
      if (field in body) updates[field] = body[field]
    }

    // Check if record exists to decide insert vs update
    const { data: existing } = await supabase
      .from('restaurant_settings')
      .select('id')
      .eq('restaurant_id', restaurantId)
      .maybeSingle()

    let data, error

    if (existing) {
      ;({ data, error } = await supabase
        .from('restaurant_settings')
        .update(updates)
        .eq('restaurant_id', restaurantId)
        .select()
        .single())
    } else {
      ;({ data, error } = await supabase
        .from('restaurant_settings')
        .insert({ restaurant_id: restaurantId, ...DEFAULT_SETTINGS, ...updates })
        .select()
        .single())
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ settings: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
