import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/types/database'

export interface UserContext {
  id: string
  email: string
  full_name: string | null
  isSuperAdmin: boolean
  orgRoles: { org_id: string; org_slug: string; role: string }[]
  restaurantRoles: { restaurant_id: string; restaurant_slug: string; org_slug: string; role: string }[]
}

export async function getUserContext(): Promise<UserContext> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: orgRolesRaw }, { data: restaurantRolesRaw }] = await Promise.all([
    supabase.from('user_profiles').select('*').eq('id', user.id).single(),
    supabase
      .from('user_organization_roles')
      .select('org_id, role, organizations(slug)')
      .eq('user_id', user.id),
    supabase
      .from('user_restaurant_roles')
      .select('restaurant_id, role, restaurants(slug, organizations(slug))')
      .eq('user_id', user.id),
  ])

  const isSuperAdmin = orgRolesRaw?.some(r => r.role === 'super_admin') ?? false

  const orgRoles = (orgRolesRaw ?? []).map(r => {
    const org = r.organizations as unknown as { slug: string } | null
    return {
      org_id: r.org_id,
      org_slug: org?.slug ?? '',
      role: r.role,
    }
  })

  const restaurantRoles = (restaurantRolesRaw ?? []).map(r => {
    const restaurant = r.restaurants as unknown as { slug: string; organizations: { slug: string } | null } | null
    return {
      restaurant_id: r.restaurant_id,
      restaurant_slug: restaurant?.slug ?? '',
      org_slug: restaurant?.organizations?.slug ?? '',
      role: r.role,
    }
  })

  return {
    id: user.id,
    email: user.email!,
    full_name: profile?.full_name ?? null,
    isSuperAdmin,
    orgRoles,
    restaurantRoles,
  }
}

export function canAccessOrg(ctx: UserContext, orgId: string): boolean {
  if (ctx.isSuperAdmin) return true
  return ctx.orgRoles.some(r => r.org_id === orgId)
}

export function canAccessOrgBySlug(ctx: UserContext, orgSlug: string): boolean {
  if (ctx.isSuperAdmin) return true
  return ctx.orgRoles.some(r => r.org_slug === orgSlug)
}

export function canManageOrg(ctx: UserContext, orgId: string): boolean {
  if (ctx.isSuperAdmin) return true
  return ctx.orgRoles.some(r => r.org_id === orgId && r.role === 'org_admin')
}

export function canAccessRestaurant(ctx: UserContext, restaurantId: string): boolean {
  if (ctx.isSuperAdmin) return true
  return ctx.restaurantRoles.some(r => r.restaurant_id === restaurantId)
}

export function hasRestaurantRole(
  ctx: UserContext,
  restaurantId: string,
  roles: UserRole[]
): boolean {
  if (ctx.isSuperAdmin) return true
  return ctx.restaurantRoles.some(
    r => r.restaurant_id === restaurantId && roles.includes(r.role as UserRole)
  )
}

export function getRedirectByRole(ctx: UserContext): string {
  if (ctx.isSuperAdmin) return '/admin/dashboard'
  if (ctx.orgRoles.length > 0) {
    const orgRole = ctx.orgRoles[0]
    return `/org/${orgRole.org_slug}/dashboard`
  }
  if (ctx.restaurantRoles.length > 0) {
    const rRole = ctx.restaurantRoles[0]
    const role = rRole.role as UserRole
    if (role === 'cocina') return `/r/${rRole.org_slug}/${rRole.restaurant_slug}/kitchen`
    if (role === 'cajera') return `/r/${rRole.org_slug}/${rRole.restaurant_slug}/pos`
    return `/r/${rRole.org_slug}/${rRole.restaurant_slug}/menu`
  }
  return '/sin-acceso'
}
