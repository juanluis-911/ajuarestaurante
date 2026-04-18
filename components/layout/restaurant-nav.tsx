'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface RestaurantNavProps {
  orgSlug: string
  restaurantSlug: string
  role: string
}

const allLinks = [
  { href: 'pos',     label: 'POS',      roles: ['super_admin', 'gerente', 'org_admin', 'cajera'] },
  { href: 'kitchen', label: 'Cocina',   roles: ['super_admin', 'gerente', 'org_admin', 'cajera', 'cocina'] },
  { href: 'menu',    label: 'Menú',     roles: ['super_admin', 'gerente', 'org_admin'] },
  { href: 'tables',  label: 'Mesas',    roles: ['super_admin', 'gerente', 'org_admin'] },
  { href: 'reports',   label: 'Reportes',      roles: ['super_admin', 'gerente', 'org_admin'] },
  { href: 'settings',  label: 'Configuración', roles: ['super_admin', 'gerente', 'org_admin'] },
]

export function RestaurantNav({ orgSlug, restaurantSlug, role }: RestaurantNavProps) {
  const pathname = usePathname()
  const base = `/r/${orgSlug}/${restaurantSlug}`
  const links = allLinks.filter(l => l.roles.includes(role))

  return (
    <nav className="bg-white border-b border-gray-200 px-4">
      <div className="flex overflow-x-auto gap-1">
        {links.map(link => {
          const href = `${base}/${link.href}`
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
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
