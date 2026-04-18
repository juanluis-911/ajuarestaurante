import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getUserContext } from '@/lib/auth/get-user-context'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Users, Shield, Store, ChevronRight, Crown, Building2 } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  org_admin: 'Admin Org',
  gerente: 'Gerente',
  cajera: 'Cajera',
  cocina: 'Cocina',
}

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
  org_admin:   'bg-blue-100 text-blue-700 border-blue-200',
  gerente:     'bg-orange-100 text-orange-700 border-orange-200',
  cajera:      'bg-green-100 text-green-700 border-green-200',
  cocina:      'bg-yellow-100 text-yellow-700 border-yellow-200',
}

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(' ')
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

export default async function AdminUsersPage() {
  const ctx = await getUserContext()
  if (!ctx.isSuperAdmin) redirect('/dashboard')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const [
    { data: profiles },
    { data: orgRoles },
    { data: restaurantRoles },
    { data: restaurants },
    { data: orgs },
  ] = await Promise.all([
    admin.from('user_profiles').select('id, email, full_name, created_at').order('created_at', { ascending: false }),
    admin.from('user_organization_roles').select('user_id, org_id, role'),
    admin.from('user_restaurant_roles').select('user_id, restaurant_id, role'),
    admin.from('restaurants').select('id, name, slug'),
    admin.from('organizations').select('id, name, slug'),
  ])

  const users = (profiles ?? []).map(p => ({
    ...p,
    org_roles: (orgRoles ?? []).filter(r => r.user_id === p.id).map(r => ({
      ...r,
      org: orgs?.find(o => o.id === r.org_id),
    })),
    restaurant_roles: (restaurantRoles ?? []).filter(r => r.user_id === p.id).map(r => ({
      ...r,
      restaurant: restaurants?.find(res => res.id === r.restaurant_id),
    })),
  }))

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm">
          <Users className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios del sistema</h1>
          <p className="text-sm text-gray-500">{users.length} usuarios registrados</p>
        </div>
      </div>

      <div className="space-y-3">
        {users.map(user => {
          const initials = getInitials(user.full_name, user.email)
          const allRoles = [
            ...user.org_roles.map(r => r.role),
            ...user.restaurant_roles.map(r => r.role),
          ]
          const topRole = allRoles.find(r => r === 'super_admin')
            ?? allRoles.find(r => r === 'org_admin')
            ?? allRoles[0]

          return (
            <Link
              key={user.id}
              href={`/admin/users/${user.id}`}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-5 py-4 hover:border-orange-300 hover:shadow-sm transition-all group"
            >
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-orange-600">{initials}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {user.full_name ?? user.email}
                </p>
                {user.full_name && (
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                )}
              </div>

              {/* Roles */}
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                {topRole && (
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${ROLE_COLORS[topRole] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                    {topRole === 'super_admin' && <Crown className="h-3 w-3 inline mr-1" />}
                    {ROLE_LABELS[topRole] ?? topRole}
                  </span>
                )}
                {user.restaurant_roles.length > 0 && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Store className="h-3 w-3" />
                    {user.restaurant_roles.length} restaurante{user.restaurant_roles.length !== 1 ? 's' : ''}
                  </span>
                )}
                {user.org_roles.length > 0 && topRole !== 'super_admin' && (
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {user.org_roles.map(r => r.org?.name ?? '').join(', ')}
                  </span>
                )}
              </div>

              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-orange-400 transition-colors shrink-0" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
