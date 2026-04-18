'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Correo o contraseña incorrectos')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">
      {/* Panel izquierdo — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-orange-500 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-orange-600/40" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-orange-600/30" />

        <div className="relative z-10 text-center">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/30">
            <span className="font-heading font-bold text-white text-4xl">A</span>
          </div>
          <h1 className="font-heading text-5xl font-bold text-white mb-2 tracking-tight">Ajúa</h1>
          <p className="text-orange-100 text-lg font-medium mb-2">Deliciosamente</p>
          <div className="w-12 h-0.5 bg-white/40 mx-auto mb-6" />
          <p className="text-orange-100/80 text-sm max-w-xs leading-relaxed">
            Sistema de gestión integral para tu restaurante
          </p>
        </div>
      </div>

      {/* Panel derecho — formulario */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
        <div className="w-full max-w-sm">
          {/* Logo móvil */}
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <span className="font-heading font-bold text-white text-2xl">A</span>
            </div>
            <h1 className="font-heading text-3xl font-bold text-gray-900">Ajúa</h1>
          </div>

          <div className="mb-8">
            <h2 className="font-heading text-2xl font-bold text-gray-900">Bienvenido</h2>
            <p className="text-gray-500 text-sm mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nombre@restaurante.com"
                required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all placeholder:text-gray-300"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition-all placeholder:text-gray-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <p className="text-sm text-orange-700 font-medium">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            Ajúa Restaurantes © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  )
}
