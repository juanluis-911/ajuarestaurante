import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import type { Category, MenuItem } from '@/types/database'

export default async function PublicMenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string; restaurantSlug: string }>
  searchParams: Promise<{ table?: string }>
}) {
  const { orgSlug, restaurantSlug } = await params
  const { table: tableNumber } = await searchParams

  const supabase = await createClient()

  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('id, name, slug, logo_url, cover_url, org_id, is_active, organizations!inner(slug)')
    .eq('slug', restaurantSlug)
    .eq('organizations.slug', orgSlug)
    .eq('is_active', true)
    .single()

  if (!restaurant) notFound()

  const { data: categoriesRaw } = await supabase
    .from('categories')
    .select(`
      id, name, description, sort_order, is_active,
      menu_items(id, name, description, price, image_url, is_active, sort_order, category_id, restaurant_id, created_at, updated_at)
    `)
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  const categories: (Category & { menu_items: MenuItem[] })[] = (categoriesRaw ?? []).map(c => ({
    id: c.id,
    restaurant_id: restaurant.id,
    name: c.name,
    description: c.description,
    sort_order: c.sort_order,
    is_active: c.is_active,
    created_at: '',
    menu_items: ((c.menu_items ?? []) as MenuItem[])
      .filter(item => item.is_active)
      .sort((a, b) => a.sort_order - b.sort_order),
  }))

  const activeCategories = categories.filter(c => c.menu_items.length > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="relative">
        {restaurant.cover_url ? (
          <img
            src={restaurant.cover_url}
            alt={restaurant.name}
            className="w-full h-48 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-orange-500" />
        )}
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <div className="flex items-end gap-3">
            {restaurant.logo_url && (
              <img
                src={restaurant.logo_url}
                alt="Logo"
                className="w-14 h-14 rounded-full border-2 border-white object-cover flex-shrink-0"
              />
            )}
            <div>
              <h1 className="text-white text-xl font-bold leading-tight">{restaurant.name}</h1>
              {tableNumber && (
                <span className="inline-block mt-1 bg-orange-500 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  Mesa {tableNumber}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category sticky nav */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="flex overflow-x-auto gap-1 px-4 py-2 no-scrollbar">
          {activeCategories.map(cat => (
            <a
              key={cat.id}
              href={`#cat-${cat.id}`}
              className="flex-shrink-0 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-orange-600 hover:bg-orange-50 rounded-full transition-colors whitespace-nowrap"
            >
              {cat.name}
            </a>
          ))}
        </div>
      </div>

      {/* Menu sections */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {activeCategories.map(cat => (
          <section key={cat.id} id={`cat-${cat.id}`}>
            <h2 className="text-lg font-bold text-gray-900 mb-1">{cat.name}</h2>
            {cat.description && (
              <p className="text-sm text-gray-500 mb-3">{cat.description}</p>
            )}
            <div className="space-y-3">
              {cat.menu_items.map(item => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm flex gap-3 p-3"
                >
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-orange-300 text-2xl">🍽️</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm leading-snug">{item.name}</p>
                    {item.description && (
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                    )}
                    <p className="mt-1.5 text-orange-600 font-bold text-sm">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {activeCategories.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-lg font-medium">Menú no disponible</p>
            <p className="text-sm mt-1">Por favor consulta al personal.</p>
          </div>
        )}
      </div>
    </div>
  )
}
