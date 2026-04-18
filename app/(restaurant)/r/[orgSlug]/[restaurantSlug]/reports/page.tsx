import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/auth/get-user-context'
import { notFound } from 'next/navigation'
import { ReportsCharts } from '@/components/reports/reports-charts'

export default async function ReportsPage({
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

  const canAccess =
    ctx.isSuperAdmin ||
    ctx.orgRoles.some(r => r.org_slug === orgSlug) ||
    ctx.restaurantRoles.some(
      r => r.restaurant_id === restaurant.id && ['gerente'].includes(r.role)
    )

  if (!canAccess) notFound()

  const restaurantId = restaurant.id
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: ordersRaw },
    { data: orderItemsRaw },
  ] = await Promise.all([
    supabase
      .from('orders')
      .select('created_at, total')
      .eq('restaurant_id', restaurantId)
      .neq('status', 'cancelled')
      .gte('created_at', since30),
    supabase
      .from('order_items')
      .select('quantity, unit_price, menu_items(name), orders!inner(restaurant_id, status, created_at)')
      .eq('orders.restaurant_id', restaurantId)
      .neq('orders.status', 'cancelled')
      .gte('orders.created_at', since30),
  ])

  // Aggregate daily revenue
  const dailyMap: Record<string, { date: string; count: number; revenue: number }> = {}
  for (const order of ordersRaw ?? []) {
    const date = (order.created_at as string).slice(0, 10)
    if (!dailyMap[date]) dailyMap[date] = { date, count: 0, revenue: 0 }
    dailyMap[date].count += 1
    dailyMap[date].revenue += order.total ?? 0
  }
  const revenueByDay = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))

  // Aggregate top items
  const itemMap: Record<string, { name: string; total_qty: number; revenue: number }> = {}
  for (const oi of orderItemsRaw ?? []) {
    const menuItem = oi.menu_items as unknown as { name: string } | null
    const name = menuItem?.name ?? 'Desconocido'
    if (!itemMap[name]) itemMap[name] = { name, total_qty: 0, revenue: 0 }
    itemMap[name].total_qty += oi.quantity ?? 0
    itemMap[name].revenue += (oi.quantity ?? 0) * (oi.unit_price ?? 0)
  }
  const topItems = Object.values(itemMap)
    .sort((a, b) => b.total_qty - a.total_qty)
    .slice(0, 10)

  // Stats
  const allOrders = ordersRaw ?? []
  const totalOrders = allOrders.length
  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total ?? 0), 0)
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Reportes</h1>
        <p className="text-sm text-gray-500 mt-0.5">{restaurant.name} — últimos 30 días</p>
      </div>
      <div className="p-6">
        <ReportsCharts
          revenueByDay={revenueByDay}
          topItems={topItems}
          stats={{ totalOrders, totalRevenue, avgTicket }}
        />
      </div>
    </div>
  )
}
