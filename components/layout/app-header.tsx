'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface AppHeaderProps {
  userName: string | null
  restaurantName?: string
}

export function AppHeader({ userName, restaurantName }: AppHeaderProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 shrink-0">
      <div className="flex items-center gap-3">
        {/* Logo marca */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
            <span className="text-white font-heading font-bold text-sm leading-none">A</span>
          </div>
          <span className="font-heading font-bold text-gray-900 text-lg tracking-tight">Ajúa</span>
        </div>
        {restaurantName && (
          <>
            <span className="text-gray-300 text-lg">/</span>
            <span className="text-sm font-medium text-gray-500">{restaurantName}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-4">
        {userName && (
          <span className="text-sm font-medium text-gray-700 hidden sm:block">{userName}</span>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-orange-500 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:block">Salir</span>
        </button>
      </div>
    </header>
  )
}
