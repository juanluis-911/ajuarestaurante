import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getUserContext } from '@/lib/auth/get-user-context'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { UserPermissionsEditor } from '@/components/admin/user-permissions-editor'
import type { UserResourcePermission } from '@/types/database'

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>
}) {
  const ctx = await getUserContext()
  if (!ctx.isSuperAdmin) redirect('/dashboard')

  const { userId } = await params

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const [
    { data: profile },
    { data: orgRolesRaw },
    { data: restaurantRolesRaw },
    { data: restaurants },
    { data: orgs },
    { data: permissions },
  ] = await Promise.all([
    admin.from('user_profiles').select('id, email, full_name').eq('id', userId).single(),
    admin.from('user_organization_roles').select('org_id, role').eq('user_id', userId),
    admin.from('user_restaurant_roles').select('restaurant_id, role').eq('user_id', userId),
    admin.from('restaurants').select('id, name, slug, org_id'),
    admin.from('organizations').select('id, name, slug'),
    admin.from('user_resource_permissions').select('*').eq('user_id', userId),
  ])

  if (!profile) notFound()

  const restaurantRoles = (restaurantRolesRaw ?? []).map(r => ({
    ...r,
    restaurant: restaurants?.find(res => res.id === r.restaurant_id) ?? null,
  }))

  const orgRoles = (orgRolesRaw ?? []).map(r => ({
    ...r,
    org: orgs?.find(o => o.id === r.org_id) ?? null,
  }))

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Todos los usuarios
      </Link>

      <UserPermissionsEditor
        userId={userId}
        profile={profile}
        orgRoles={orgRoles as { org_id: string; role: string; org: { id: string; name: string; slug: string } | null }[]}
        restaurantRoles={restaurantRoles as { restaurant_id: string; role: string; restaurant: { id: string; name: string; slug: string; org_id: string } | null }[]}
        initialPermissions={(permissions ?? []) as UserResourcePermission[]}
        allRestaurants={(restaurants ?? []) as { id: string; name: string; slug: string; org_id: string }[]}
      />
    </div>
  )
}
