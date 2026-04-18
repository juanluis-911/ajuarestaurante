import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/auth/get-user-context'
import { notFound } from 'next/navigation'
import KitchenClient from './KitchenClient'
import type { OrderWithDetails } from '@/types/database'

export default async function KitchenPage({
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
        ['cocina', 'gerente'].includes(r.role)
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

  const { data: ordersRaw } = await supabase
    .from('orders')
    .select('*, items:order_items(*, menu_item:menu_items(*)), table:restaurant_tables(*)')
    .eq('restaurant_id', restaurant.id)
    .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
    .order('created_at', { ascending: true })

  return (
    <KitchenClient
      restaurantId={restaurant.id}
      restaurantName={restaurant.name}
      initialOrders={(ordersRaw ?? []) as unknown as OrderWithDetails[]}
    />
  )
}
