import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restaurant_id, table_id, type, customer_name, customer_phone, notes, items } = body

    if (!restaurant_id || !type || !items?.length) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: orderNumberData, error: rpcError } = await supabase.rpc('generate_order_number', {
      p_restaurant_id: restaurant_id,
    })

    if (rpcError) {
      return Response.json({ error: rpcError.message }, { status: 500 })
    }

    const total = items.reduce(
      (sum: number, item: { quantity: number; unit_price: number }) =>
        sum + item.quantity * item.unit_price,
      0
    )

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id,
        table_id: table_id ?? null,
        order_number: orderNumberData,
        type,
        status: 'pending',
        customer_name: customer_name ?? null,
        customer_phone: customer_phone ?? null,
        notes: notes ?? null,
        total,
      })
      .select()
      .single()

    if (orderError) {
      return Response.json({ error: orderError.message }, { status: 500 })
    }

    const orderItems = items.map((item: { menu_item_id: string; quantity: number; unit_price: number; notes?: string }) => ({
      order_id: order.id,
      menu_item_id: item.menu_item_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      notes: item.notes ?? null,
    }))

    const { data: createdItems, error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)
      .select('*, menu_item:menu_items(*)')

    if (itemsError) {
      return Response.json({ error: itemsError.message }, { status: 500 })
    }

    return Response.json({ ...order, items: createdItems }, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
