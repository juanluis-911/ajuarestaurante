import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/auth/get-user-context'
import { notFound } from 'next/navigation'
import POSClient from './POSClient'
import type { Category, MenuItem, RestaurantTable, OrderWithDetails } from '@/types/database'

export default async function POSPage({
  params,
}: {
  params: Promise<{ orgSlug: string; restaurantSlug: string }>
}) {
  const { orgSlug, restaurantSlug } = await params
  const [ctx, supabase] = await Promise.all([getUserContext(), createClient()])

  const hasRole =
    ctx.isSuperAdmin ||
    ctx.orgRoles.some(r => r.org_slug === orgSlug) ||
    ctx.restaurantRoles.some(
      r =>
        r.org_slug === orgSlug &&
        r.restaurant_slug === restaurantSlug &&
        ['cajera', 'gerente'].includes(r.role)
    )

  if (!hasRole) notFound()

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) notFound()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name')
    .eq('slug', restaurantSlug)
    .eq('org_id', org.id)
    .single()

  if (!restaurant) notFound()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [{ data: categoriesRaw }, { data: tables }, { data: ordersRaw }] = await Promise.all([
    supabase
      .from('categories')
      .select('*, items:menu_items(*)')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('restaurant_tables')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('number'),
    supabase
      .from('orders')
      .select('*, items:order_items(*, menu_item:menu_items(*)), table:restaurant_tables(*)')
      .eq('restaurant_id', restaurant.id)
      .gte('created_at', today.toISOString())
      .not('status', 'in', '(cancelled,delivered)')
      .order('created_at', { ascending: false }),
  ])

  const categories = (categoriesRaw ?? []) as (Category & { items: MenuItem[] })[]
  const sortedCategories = categories.map(cat => ({
    ...cat,
    items: (cat.items ?? []).sort((a, b) => a.sort_order - b.sort_order),
  }))

  return (
    <POSClient
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      categories={sortedCategories}
      tables={(tables ?? []) as RestaurantTable[]}
      initialOrders={(ordersRaw ?? []) as unknown as OrderWithDetails[]}
    />
  )
}
