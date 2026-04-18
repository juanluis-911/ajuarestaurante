import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canAccessRestaurant } from '@/lib/auth/get-user-context'

const DEFAULT_SETTINGS = {
  ticket_header: null,
  ticket_footer: null,
  ticket_show_logo: true,
  ticket_show_address: true,
  ticket_show_phone: true,
}

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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

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
    const {
      ticket_header,
      ticket_footer,
      ticket_show_logo,
      ticket_show_address,
      ticket_show_phone,
    } = body

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('restaurant_settings')
      .upsert(
        {
          restaurant_id: restaurantId,
          ticket_header: ticket_header ?? null,
          ticket_footer: ticket_footer ?? null,
          ticket_show_logo: ticket_show_logo ?? true,
          ticket_show_address: ticket_show_address ?? true,
          ticket_show_phone: ticket_show_phone ?? true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'restaurant_id' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ settings: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
