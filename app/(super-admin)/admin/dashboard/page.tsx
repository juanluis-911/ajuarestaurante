import { getUserContext } from '@/lib/auth/get-user-context'
import { createClient } from '@/lib/supabase/server'
import { Building2, Users, ShoppingBag } from 'lucide-react'

export default async function SuperAdminDashboard() {
  await getUserContext()

  const supabase = await createClient()

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const [
    { count: orgCount },
    { count: userCount },
    { count: ordersToday },
    { data: organizations },
  ] = await Promise.all([
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString()),
    supabase
      .from('organizations')
      .select('id, name, slug, created_at, restaurants(count)')
      .order('created_at', { ascending: false }),
  ])

  const stats = [
    { label: 'Organizaciones', value: orgCount ?? 0, icon: Building2, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Usuarios', value: userCount ?? 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Órdenes hoy', value: ordersToday ?? 0, icon: ShoppingBag, color: 'text-green-500', bg: 'bg-green-50' },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel Super Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Vista global del sistema</p>
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

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Organizaciones</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Nombre</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Sucursales</th>
                <th className="px-5 py-3 font-medium">Creada</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(organizations ?? []).map(org => {
                const restaurantCount = Array.isArray(org.restaurants)
                  ? (org.restaurants[0] as { count: number } | undefined)?.count ?? 0
                  : 0
                return (
                  <tr key={org.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{org.name}</td>
                    <td className="px-5 py-3 text-gray-500 font-mono">{org.slug}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700">
                        {restaurantCount}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-500">
                      {new Date(org.created_at).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                )
              })}
              {(organizations ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-gray-400">
                    No hay organizaciones registradas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
