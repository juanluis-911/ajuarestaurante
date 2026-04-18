import { redirect } from 'next/navigation'
import { getUserContext, canAccessOrgBySlug } from '@/lib/auth/get-user-context'
import { createClient } from '@/lib/supabase/server'
import { OrgStripeSettings } from '@/components/org/org-stripe-settings'
import type { OrganizationSettings } from '@/types/database'

interface Props {
  params: Promise<{ orgSlug: string }>
}

export default async function OrgSettingsPage({ params }: Props) {
  const { orgSlug } = await params
  const ctx = await getUserContext()

  if (!canAccessOrgBySlug(ctx, orgSlug)) redirect('/login')

  const supabase = await createClient()

  const { data: organization } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('slug', orgSlug)
    .single()

  if (!organization) redirect('/login')

  const { data: orgSettings } = await supabase
    .from('organization_settings')
    .select('*')
    .eq('org_id', organization.id)
    .maybeSingle()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">{organization.name}</p>
      </div>

      <OrgStripeSettings
        orgId={organization.id}
        settings={orgSettings as OrganizationSettings | null}
      />
    </div>
  )
}
