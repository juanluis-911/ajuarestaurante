'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Store } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AppHeaderProps {
  userName: string | null
  restaurantName?: string
  dashboardHref?: string
}

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  return parts.length >= 2
    ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    : parts[0].slice(0, 2).toUpperCase()
}

export function AppHeader({ userName, restaurantName, dashboardHref = '/dashboard' }: AppHeaderProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 shrink-0">
      {/* Left: brand */}
      <div className="flex items-center gap-3">
        {/* Logo — clickeable para volver al dashboard */}
        <Link href={dashboardHref} className="flex items-center gap-2.5 group">
          <div className="relative w-9 h-9 shrink-0">
            <div className="w-full h-full rounded-full bg-orange-500 flex items-center justify-center ring-2 ring-orange-200 shadow-sm group-hover:ring-orange-400 transition-all">
              <span className="text-white font-heading font-black text-base leading-none select-none">A</span>
            </div>
            <span className="absolute -top-0.5 -right-0.5 text-[8px] leading-none">⭐</span>
          </div>

          <div className="flex flex-col leading-none">
            <span className="font-heading font-bold text-gray-900 text-lg tracking-tight leading-tight group-hover:text-orange-600 transition-colors">
              Ajúa
            </span>
            <span className="text-[10px] font-medium text-gray-400 leading-none mt-0.5">
              {restaurantName ? 'Ir al inicio' : 'Restaurantes'}
            </span>
          </div>
        </Link>

        {restaurantName && (
          <>
            <span className="text-gray-200 text-lg hidden sm:block">/</span>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
              <Store className="h-3 w-3" />
              <span className="text-xs font-medium">{restaurantName}</span>
            </div>
          </>
        )}
      </div>

      {/* Right: user + logout */}
      <div className="flex items-center gap-3">
        {userName && (
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-orange-100 border border-orange-200 flex items-center justify-center shrink-0">
              <span className="text-[11px] font-bold text-orange-600">
                {getInitials(userName)}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-700 max-w-[140px] truncate">
              {userName}
            </span>
          </div>
        )}

        <button
          onClick={handleSignOut}
          title="Cerrar sesión"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:block">Salir</span>
        </button>
      </div>
    </header>
  )
}
