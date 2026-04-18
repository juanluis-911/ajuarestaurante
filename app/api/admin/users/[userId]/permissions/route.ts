import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getUserContext } from '@/lib/auth/get-user-context'

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const ctx = await getUserContext()
    if (!ctx.isSuperAdmin) return NextResponse.json({ error: 'Sin autorización' }, { status: 403 })

    const { userId } = await params
    const admin = adminClient()

    const [{ data: perms }, { data: restaurantRoles }, { data: restaurants }] = await Promise.all([
      admin.from('user_resource_permissions').select('*').eq('user_id', userId),
      admin.from('user_restaurant_roles').select('restaurant_id, role').eq('user_id', userId),
      admin.from('restaurants').select('id, name, slug'),
    ])

    return NextResponse.json({ permissions: perms ?? [], restaurantRoles: restaurantRoles ?? [], restaurants: restaurants ?? [] })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const ctx = await getUserContext()
    if (!ctx.isSuperAdmin) return NextResponse.json({ error: 'Sin autorización' }, { status: 403 })

    const { userId } = await params
    const body = await request.json() as {
      restaurant_id: string
      resource: string
      can_view: boolean
      can_edit: boolean
      can_delete: boolean
    }[]

    const admin = adminClient()

    for (const perm of body) {
      await admin.from('user_resource_permissions').upsert(
        { user_id: userId, ...perm, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,restaurant_id,resource' }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
