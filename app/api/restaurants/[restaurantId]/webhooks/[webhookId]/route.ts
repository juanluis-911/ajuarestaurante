import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canAccessRestaurant } from '@/lib/auth/get-user-context'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string; webhookId: string }> }
) {
  try {
    const { restaurantId, webhookId } = await params
    const ctx = await getUserContext()

    if (!canAccessRestaurant(ctx, restaurantId)) {
      return NextResponse.json({ error: 'Sin autorización' }, { status: 403 })
    }

    const body = await request.json()
    const { is_active } = body as { is_active: boolean }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('webhook_endpoints')
      .update({ is_active })
      .eq('id', webhookId)
      .eq('restaurant_id', restaurantId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ webhook: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string; webhookId: string }> }
) {
  try {
    const { restaurantId, webhookId } = await params
    const ctx = await getUserContext()

    if (!canAccessRestaurant(ctx, restaurantId)) {
      return NextResponse.json({ error: 'Sin autorización' }, { status: 403 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('webhook_endpoints')
      .delete()
      .eq('id', webhookId)
      .eq('restaurant_id', restaurantId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
