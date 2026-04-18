import { redirect } from 'next/navigation'
import { getUserContext, canAccessOrgBySlug } from '@/lib/auth/get-user-context'
import { createClient } from '@/lib/supabase/server'
import { OrgStripeConnect } from '@/components/org/org-stripe-connect'

interface Props {
  params: Promise<{ orgSlug: string }>
  searchParams: Promise<{ stripe?: string }>
}

export default async function OrgSettingsPage({ params, searchParams }: Props) {
  const { orgSlug } = await params
  const { stripe } = await searchParams
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
    .select('stripe_account_id, stripe_onboarding_complete, stripe_enabled')
    .eq('org_id', organization.id)
    .maybeSingle()

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">{organization.name}</p>
      </div>

      {stripe === 'connected' && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-sm text-green-800 font-medium">
          ✓ Cuenta de Stripe conectada correctamente. Tus restaurantes ya pueden recibir pagos.
        </div>
      )}
      {stripe === 'incomplete' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 text-sm text-yellow-800">
          Falta completar la configuración en Stripe. Haz clic en "Continuar configuración" cuando estés listo.
        </div>
      )}
      {stripe === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-800">
          Ocurrió un error al conectar con Stripe. Inténtalo de nuevo.
        </div>
      )}

      <OrgStripeConnect
        orgId={organization.id}
        accountId={orgSettings?.stripe_account_id ?? null}
        onboardingComplete={orgSettings?.stripe_onboarding_complete ?? false}
        stripeEnabled={orgSettings?.stripe_enabled ?? false}
      />
    </div>
  )
}
