import { notFound, redirect } from 'next/navigation'
import { getUserContext, canAccessOrgBySlug } from '@/lib/auth/get-user-context'
import { createClient } from '@/lib/supabase/server'
import { RestaurantSettingsClient } from '@/components/restaurant/restaurant-settings-client'
import type { RestaurantSettings, WebhookEndpoint } from '@/types/database'

interface Props {
  params: Promise<{ orgSlug: string; restaurantSlug: string }>
}

export default async function RestaurantSettingsPage({ params }: Props) {
  const { orgSlug, restaurantSlug } = await params
  const ctx = await getUserContext()

  const supabase = await createClient()

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) notFound()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, address, phone, logo_url, org_id')
    .eq('slug', restaurantSlug)
    .eq('org_id', org.id)
    .single()

  if (!restaurant) notFound()

  const hasAccess =
    ctx.isSuperAdmin ||
    ctx.orgRoles.some(r => r.org_slug === orgSlug) ||
    ctx.restaurantRoles.some(r => r.restaurant_id === restaurant.id)

  if (!hasAccess) redirect('/login')

  const [
    { data: restaurantSettings },
    { data: teamRaw },
    { data: webhooks },
  ] = await Promise.all([
    supabase
      .from('restaurant_settings')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .maybeSingle(),
    supabase
      .from('user_restaurant_roles')
      .select('id, role, user_profiles(id, email, full_name)')
      .eq('restaurant_id', restaurant.id),
    supabase
      .from('webhook_endpoints')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .order('created_at', { ascending: false }),
  ])

  const defaultSettings: RestaurantSettings = {
    id: '',
    restaurant_id: restaurant.id,
    ticket_header: null,
    ticket_footer: null,
    ticket_show_logo: true,
    ticket_show_address: true,
    ticket_show_phone: true,
    business_hours: null,
    accepts_cash: true,
    accepts_card: true,
    stripe_account_id: null,
    created_at: '',
    updated_at: '',
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="text-sm text-gray-500 mt-1">{restaurant.name}</p>
      </div>

      <RestaurantSettingsClient
        restaurant={{
          id: restaurant.id,
          name: restaurant.name,
          slug: restaurant.slug,
          address: restaurant.address,
          phone: restaurant.phone,
        }}
        orgSlug={orgSlug}
        settings={(restaurantSettings as RestaurantSettings) ?? defaultSettings}
        team={(teamRaw ?? []) as unknown as Array<{
          id: string
          role: string
          user_profiles: { id: string; email: string; full_name: string | null } | null
        }>}
        webhooks={(webhooks ?? []) as WebhookEndpoint[]}
      />
    </div>
  )
}
