import { createClient } from '@/lib/supabase/server'
import { getUserContext } from '@/lib/auth/get-user-context'
import { notFound } from 'next/navigation'
import { MenuManager } from '@/components/menu/menu-manager'
import type { Category, MenuItem } from '@/types/database'

export default async function MenuPage({
  params,
}: {
  params: Promise<{ orgSlug: string; restaurantSlug: string }>
}) {
  const { orgSlug, restaurantSlug } = await params
  const [ctx, supabase] = await Promise.all([getUserContext(), createClient()])

  const { data: org } = await supabase.from('organizations').select('id').eq('slug', orgSlug).single()
  if (!org) notFound()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, org_id')
    .eq('slug', restaurantSlug)
    .eq('org_id', org.id)
    .single()

  if (!restaurant) notFound()

  const canManage =
    ctx.isSuperAdmin ||
    ctx.orgRoles.some(r => r.org_slug === orgSlug) ||
    ctx.restaurantRoles.some(
      r => r.restaurant_id === restaurant.id && ['gerente'].includes(r.role)
    )

  if (!canManage) notFound()

  const { data: categoriesRaw } = await supabase
    .from('categories')
    .select(`
      id, restaurant_id, name, description, sort_order, is_active, created_at,
      menu_items(id, restaurant_id, category_id, name, description, price, image_url, is_active, sort_order, created_at, updated_at)
    `)
    .eq('restaurant_id', restaurant.id)
    .order('sort_order', { ascending: true })

  const categories: (Category & { menu_items: MenuItem[] })[] = (categoriesRaw ?? []).map(c => ({
    id: c.id,
    restaurant_id: c.restaurant_id,
    name: c.name,
    description: c.description,
    sort_order: c.sort_order,
    is_active: c.is_active,
    created_at: c.created_at,
    menu_items: (c.menu_items ?? []) as MenuItem[],
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Gestión de Menú</h1>
        <p className="text-sm text-gray-500 mt-0.5">{restaurant.name}</p>
      </div>
      <MenuManager
        restaurantId={restaurant.id}
        initialCategories={categories}
      />
    </div>
  )
}
