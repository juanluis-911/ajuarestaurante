'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Settings2 } from 'lucide-react'

interface OrgNavProps {
  orgSlug: string
}

const links = [
  { href: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: 'settings', label: 'Configuración', icon: Settings2 },
]

export function OrgNav({ orgSlug }: OrgNavProps) {
  const pathname = usePathname()
  const base = `/org/${orgSlug}`

  return (
    <nav className="bg-white border-b border-gray-200 px-3">
      <div className="flex overflow-x-auto gap-0.5">
        {links.map(link => {
          const href = `${base}/${link.href}`
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={href}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'border-orange-500 text-orange-600 bg-orange-50/60'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-orange-500' : 'text-gray-400'}`} />
              {link.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
