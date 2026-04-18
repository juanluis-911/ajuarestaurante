import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserContext, canManageOrg } from '@/lib/auth/get-user-context'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ orgId: string }> }
) {
  try {
    const { orgId } = await params
    const ctx = await getUserContext()

    if (!canManageOrg(ctx, orgId)) {
      return NextResponse.json({ error: 'Sin autorización' }, { status: 403 })
    }

    const body = await request.json()
    const {
      stripe_publishable_key,
      stripe_secret_key,
      stripe_webhook_secret,
      stripe_enabled,
    } = body as {
      stripe_publishable_key?: string | null
      stripe_secret_key?: string | null
      stripe_webhook_secret?: string | null
      stripe_enabled?: boolean
    }

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('organization_settings')
      .upsert(
        {
          org_id: orgId,
          stripe_publishable_key: stripe_publishable_key ?? null,
          stripe_secret_key: stripe_secret_key ?? null,
          stripe_webhook_secret: stripe_webhook_secret ?? null,
          stripe_enabled: stripe_enabled ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'org_id' }
      )
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ settings: data })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
