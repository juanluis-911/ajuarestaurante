'use client'

import Link from 'next/link'

interface RestaurantNavProps {
  orgSlug: string
  restaurantSlug: string
  currentPath: string
  role: string
}

const baseLinks = [
  { href: 'pos', label: 'POS', roles: ['gerente', 'org_admin', 'cajera'] },
  { href: 'kitchen', label: 'Cocina', roles: ['gerente', 'org_admin', 'cajera', 'cocina'] },
  { href: 'menu', label: 'Menú', roles: ['gerente', 'org_admin'] },
  { href: 'tables', label: 'Mesas', roles: ['gerente', 'org_admin'] },
  { href: 'reports', label: 'Reportes', roles: ['gerente', 'org_admin'] },
]

export function RestaurantNav({ orgSlug, restaurantSlug, currentPath, role }: RestaurantNavProps) {
  const base = `/r/${orgSlug}/${restaurantSlug}`
  const links = baseLinks.filter(l => l.roles.includes(role))

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="flex overflow-x-auto">
        {links.map(link => {
          const href = `${base}/${link.href}`
          const isActive = currentPath === href || currentPath.startsWith(`${href}/`)
          return (
            <Link
              key={link.href}
              href={href}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                isActive
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
