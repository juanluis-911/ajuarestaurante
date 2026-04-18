'use client'

import { useRouter } from 'next/navigation'
import { ChefHat, LogOut } from 'lucide-react'
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
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <ChefHat className="h-6 w-6 text-orange-500" />
        <span className="font-bold text-gray-900">Ajúa</span>
        {restaurantName && (
          <>
            <span className="text-gray-300 mx-1">/</span>
            <span className="text-sm text-gray-600">{restaurantName}</span>
          </>
        )}
      </div>
      <div className="flex items-center gap-3">
        {userName && (
          <span className="text-sm text-gray-600">{userName}</span>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Salir</span>
        </button>
      </div>
    </header>
  )
}
