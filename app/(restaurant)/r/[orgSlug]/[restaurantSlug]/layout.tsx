import { getUserContext } from '@/lib/auth/get-user-context'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function RestaurantLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ orgSlug: string; restaurantSlug: string }>
}) {
  const { orgSlug, restaurantSlug } = await params
  const [ctx, supabase] = await Promise.all([getUserContext(), createClient()])

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, org_id, organizations!inner(slug)')
    .eq('slug', restaurantSlug)
    .eq('organizations.slug', orgSlug)
    .single()

  if (!restaurant) notFound()

  const hasAccess =
    ctx.isSuperAdmin ||
    ctx.orgRoles.some(r => r.org_slug === orgSlug) ||
    ctx.restaurantRoles.some(r => r.restaurant_id === restaurant.id)

  if (!hasAccess) notFound()

  return <>{children}</>
}
