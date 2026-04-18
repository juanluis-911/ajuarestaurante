import { getUserContext } from '@/lib/auth/get-user-context'
import { createClient } from '@/lib/supabase/server'
import { Building2, Users, ShoppingBag, MapPin, Phone, ChevronRight, Shield } from 'lucide-react'
import { CreateRestaurantModal } from '@/components/admin/create-restaurant-modal'
import Link from 'next/link'

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
    supabase.from('orders').select('*', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    supabase.from('organizations').select('id, name, slug, created_at, restaurants(id, name, slug, address, phone, is_active)').order('created_at', { ascending: false }),
  ])

  const stats = [
    { label: 'Organizaciones', value: orgCount ?? 0, icon: Building2, color: 'text-orange-500', bg: 'bg-orange-50' },
    { label: 'Usuarios', value: userCount ?? 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Órdenes hoy', value: ordersToday ?? 0, icon: ShoppingBag, color: 'text-green-500', bg: 'bg-green-50' },
  ]

  const orgsForModal = (organizations ?? []).map(o => ({ id: o.id, name: o.name, slug: o.slug }))

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Panel Super Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Vista global del sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/users"
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:border-orange-300 hover:text-orange-600 transition-colors"
          >
            <Shield className="h-4 w-4" />
            Gestionar usuarios
          </Link>
          <CreateRestaurantModal organizations={orgsForModal} />
        </div>
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

      <div className="space-y-4">
        {(organizations ?? []).map(org => {
          const restaurants = Array.isArray(org.restaurants) ? org.restaurants as {
            id: string; name: string; slug: string; address: string | null; phone: string | null; is_active: boolean
          }[] : []

          return (
            <div key={org.id} className="bg-white rounded-xl border border-gray-200">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{org.name}</h2>
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{org.slug}</p>
                </div>
                <span className="text-xs text-gray-500">{restaurants.length} sucursal{restaurants.length !== 1 ? 'es' : ''}</span>
              </div>

              {restaurants.length === 0 ? (
                <div className="px-5 py-8 text-center text-sm text-gray-400">
                  Sin sucursales — usa el botón "Nuevo Restaurante" para agregar una
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {restaurants.map(r => (
                    <div key={r.id} className="px-5 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{r.name}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${r.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {r.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          {r.address && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <MapPin className="h-3 w-3" />{r.address}
                            </span>
                          )}
                          {r.phone && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Phone className="h-3 w-3" />{r.phone}
                            </span>
                          )}
                          <span className="text-xs text-gray-400 font-mono">{r.slug}</span>
                        </div>
                      </div>
                      <Link
                        href={`/r/${org.slug}/${r.slug}/pos`}
                        className="flex items-center gap-1 text-xs text-orange-600 hover:text-orange-700 font-medium whitespace-nowrap"
                      >
                        Ir al POS <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
