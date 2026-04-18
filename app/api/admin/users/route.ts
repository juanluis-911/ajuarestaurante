import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getUserContext } from '@/lib/auth/get-user-context'

export async function GET() {
  try {
    const ctx = await getUserContext()
    if (!ctx.isSuperAdmin) return NextResponse.json({ error: 'Sin autorización' }, { status: 403 })

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
      admin.from('restaurants').select('id, name, slug, org_id'),
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

    return NextResponse.json({ users })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
