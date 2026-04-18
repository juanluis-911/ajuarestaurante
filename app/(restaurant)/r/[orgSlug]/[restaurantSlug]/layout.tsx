import { getUserContext } from '@/lib/auth/get-user-context'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { AppHeader } from '@/components/layout/app-header'
import { RestaurantNav } from '@/components/layout/restaurant-nav'

export default async function RestaurantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string; restaurantSlug: string }>
}) {
  const { orgSlug, restaurantSlug } = await params
  const [ctx, supabase] = await Promise.all([getUserContext(), createClient()])

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', orgSlug)
    .single()

  if (!org) notFound()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, org_id')
    .eq('slug', restaurantSlug)
    .eq('org_id', org.id)
    .single()

  if (!restaurant) notFound()

  const hasAccess =
    ctx.isSuperAdmin ||
    ctx.orgRoles.some(r => r.org_slug === orgSlug) ||
    ctx.restaurantRoles.some(r => r.restaurant_id === restaurant.id)

  if (!hasAccess) notFound()

  // Determinar el rol efectivo para la nav
  let role = 'gerente'
  if (ctx.isSuperAdmin) role = 'super_admin'
  else if (ctx.orgRoles.some(r => r.org_slug === orgSlug)) role = 'org_admin'
  else {
    const rRole = ctx.restaurantRoles.find(r => r.restaurant_id === restaurant.id)
    if (rRole) role = rRole.role
  }

  // Link de regreso según rol
  const dashboardHref = ctx.isSuperAdmin
    ? '/admin/dashboard'
    : ctx.orgRoles.some(r => r.org_slug === orgSlug)
      ? `/org/${orgSlug}/dashboard`
      : '/dashboard'

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader userName={ctx.full_name} restaurantName={restaurant.name} dashboardHref={dashboardHref} />
      <RestaurantNav orgSlug={orgSlug} restaurantSlug={restaurantSlug} role={role} />
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
    </div>
  )
}
