import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { getUserContext, canAccessRestaurant } from '@/lib/auth/get-user-context'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params
    const ctx = await getUserContext()

    if (!canAccessRestaurant(ctx, restaurantId)) {
      return NextResponse.json({ error: 'Sin autorización' }, { status: 403 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('user_restaurant_roles')
      .select('id, role, user_profiles(id, email, full_name)')
      .eq('restaurant_id', restaurantId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ team: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params
    const ctx = await getUserContext()

    if (!canAccessRestaurant(ctx, restaurantId)) {
      return NextResponse.json({ error: 'Sin autorización' }, { status: 403 })
    }

    const body = await request.json()
    const { email, role } = body as {
      email: string
      role: 'gerente' | 'cajera' | 'cocina'
    }

    if (!email || !role) {
      return NextResponse.json({ error: 'email y role son requeridos' }, { status: 400 })
    }

    if (!['gerente', 'cajera', 'cocina'].includes(role)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if user already exists
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingProfile) {
      // User exists — assign role directly
      const { error: roleError } = await supabase
        .from('user_restaurant_roles')
        .upsert(
          {
            user_id: existingProfile.id,
            restaurant_id: restaurantId,
            role,
          },
          { onConflict: 'user_id,restaurant_id' }
        )

      if (roleError) {
        return NextResponse.json({ error: roleError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, invited: false })
    } else {
      // User doesn't exist — send invite via admin client
      const adminClient = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      )

      const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
        data: {
          pending_restaurant_id: restaurantId,
          pending_role: role,
        },
      })

      if (inviteError) {
        return NextResponse.json({ error: inviteError.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, invited: true })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ restaurantId: string }> }
) {
  try {
    const { restaurantId } = await params
    const ctx = await getUserContext()

    if (!canAccessRestaurant(ctx, restaurantId)) {
      return NextResponse.json({ error: 'Sin autorización' }, { status: 403 })
    }

    const body = await request.json()
    const { roleId } = body as { roleId: string }

    if (!roleId) {
      return NextResponse.json({ error: 'roleId requerido' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('user_restaurant_roles')
      .delete()
      .eq('id', roleId)
      .eq('restaurant_id', restaurantId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
