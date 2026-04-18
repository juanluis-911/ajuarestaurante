import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/auth/get-user-context'
import { notFound } from 'next/navigation'
import { TablesManager } from '@/components/tables/tables-manager'
import type { RestaurantTable } from '@/types/database'

export default async function TablesPage({
  params,
}: {
  params: Promise<{ orgSlug: string; restaurantSlug: string }>
}) {
  const { orgSlug, restaurantSlug } = await params
  const [ctx, supabase] = await Promise.all([getUserContext(), createClient()])

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, org_id, organizations!inner(slug)')
    .eq('slug', restaurantSlug)
    .eq('organizations.slug', orgSlug)
    .single()

  if (!restaurant) notFound()

  const canManage =
    ctx.isSuperAdmin ||
    ctx.orgRoles.some(r => r.org_slug === orgSlug) ||
    ctx.restaurantRoles.some(
      r => r.restaurant_id === restaurant.id && r.role === 'gerente'
    )

  if (!canManage) notFound()

  const { data: tables } = await supabase
    .from('restaurant_tables')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .order('number', { ascending: true })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Gestión de Mesas</h1>
        <p className="text-sm text-gray-500 mt-0.5">{restaurant.name}</p>
      </div>
      <TablesManager
        restaurantId={restaurant.id}
        orgSlug={orgSlug}
        restaurantSlug={restaurantSlug}
        initialTables={(tables ?? []) as RestaurantTable[]}
      />
    </div>
  )
}
