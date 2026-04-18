import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUserContext, canAccessOrgBySlug } from '@/lib/auth/get-user-context'
import { createClient } from '@/lib/supabase/server'
import { Store, ShoppingBag, DollarSign, MapPin } from 'lucide-react'

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default async function OrgDashboard({ params }: Props) {
  const { orgSlug } = await params
  const ctx = await getUserContext()

  if (!canAccessOrgBySlug(ctx, orgSlug)) redirect('/login')

  const supabase = await createClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', orgSlug)
    .single()

  if (!organization) redirect('/login')

  const { data: restaurants } = await supabase
    .from('restaurants')
    .select('id, name, slug, address, is_active')
    .eq('org_id', organization.id)
    .order('name')

  const restaurantIds = (restaurants ?? []).map(r => r.id)

  const [{ data: todayOrders }, { data: activeOrdersPerRestaurant }] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total, status')
      .in('restaurant_id', restaurantIds.length > 0 ? restaurantIds : ['none'])
      .gte('created_at', todayStart.toISOString()),
    supabase
      .from('orders')
      .select('restaurant_id, id')
      .in('restaurant_id', restaurantIds.length > 0 ? restaurantIds : ['none'])
      .in('status', ['pending', 'confirmed', 'preparing', 'ready']),
  ])

  const completedOrders = (todayOrders ?? []).filter(o => o.status !== 'cancelled')
  const revenueToday = completedOrders.reduce((sum, o) => sum + (o.total ?? 0), 0)
  const ordersTodayCount = (todayOrders ?? []).length

  const activeCountByRestaurant: Record<string, number> = {}
  for (const order of activeOrdersPerRestaurant ?? []) {
    activeCountByRestaurant[order.restaurant_id] = (activeCountByRestaurant[order.restaurant_id] ?? 0) + 1
  }

  const activeRestaurants = (restaurants ?? []).filter(r => r.is_active).length

  const stats = [
    { label: 'Sucursales activas', value: activeRestaurants, icon: Store, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Órdenes hoy', value: ordersTodayCount, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
    {
      label: 'Revenue hoy',
      value: `$${revenueToday.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      icon: DollarSign,
      color: 'text-green-500',
      bg: 'bg-green-50',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
        <p className="text-sm text-gray-500 mt-1">Panel de organización</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Sucursales</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(restaurants ?? []).map(restaurant => {
            const activeOrders = activeCountByRestaurant[restaurant.id] ?? 0
            return (
              <Link
                key={restaurant.id}
                href={`/r/${orgSlug}/${restaurant.slug}/pos`}
                className="bg-white rounded-xl border border-gray-200 p-5 hover:border-orange-300 hover:shadow-sm transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                    {restaurant.name}
                  </h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      restaurant.is_active
                        ? 'bg-green-50 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {restaurant.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {restaurant.address && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{restaurant.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm">
                  <ShoppingBag className="h-3.5 w-3.5 text-orange-400" />
                  <span className="text-gray-600">
                    <span className="font-medium text-gray-900">{activeOrders}</span> órdenes activas
                  </span>
                </div>
              </Link>
            )
          })}
          {(restaurants ?? []).length === 0 && (
            <p className="col-span-3 text-sm text-gray-400 py-8 text-center">
              No hay sucursales registradas
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
