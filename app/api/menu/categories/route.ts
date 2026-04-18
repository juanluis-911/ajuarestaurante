import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const restaurant_id = searchParams.get('restaurant_id')

  if (!restaurant_id) {
    return NextResponse.json({ error: 'restaurant_id requerido' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurant_id)
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { restaurant_id, name, description } = body

  if (!restaurant_id || !name) {
    return NextResponse.json({ error: 'restaurant_id y name son requeridos' }, { status: 400 })
  }

  const supabase = await createClient()

  // Get max sort_order
  const { data: existing } = await supabase
    .from('categories')
    .select('sort_order')
    .eq('restaurant_id', restaurant_id)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1

  const { data, error } = await supabase
    .from('categories')
    .insert({ restaurant_id, name, description: description ?? null, sort_order: nextOrder, is_active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
