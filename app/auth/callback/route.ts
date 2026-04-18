import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const meta = data.user.user_metadata as Record<string, string> | null
  const pendingRestaurantId = meta?.pending_restaurant_id
  const pendingRole = meta?.pending_role

  // Assign pending role using service role (bypasses RLS)
  if (pendingRestaurantId && pendingRole) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    await admin.from('user_restaurant_roles').upsert(
      {
        user_id: data.user.id,
        restaurant_id: pendingRestaurantId,
        role: pendingRole,
      },
      { onConflict: 'user_id,restaurant_id' }
    )

    // Clear pending metadata
    await admin.auth.admin.updateUserById(data.user.id, {
      user_metadata: { pending_restaurant_id: null, pending_role: null },
    })

    // Redirect to set password for new invited users
    return NextResponse.redirect(`${origin}/set-password`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
