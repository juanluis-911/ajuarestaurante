'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Loader2, Eye, EyeOff, Star } from 'lucide-react'

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
        {/* Círculos decorativos fondo */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-orange-600/40" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-orange-600/30" />
        {/* Sello circular externo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-80 h-80 rounded-full border-4 border-white/15 border-dashed" />
        </div>

        <div className="relative z-10 text-center">
          {/* Logo sello */}
          <div className="flex items-center justify-center gap-3 mb-3">
            <Star className="h-5 w-5 fill-brand-green-500 text-brand-green-500" />
            <div className="w-28 h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border-2 border-white/40">
              <span className="text-5xl select-none">🍔</span>
            </div>
            <Star className="h-5 w-5 fill-brand-green-500 text-brand-green-500" />
          </div>

          <h1 className="font-heading text-5xl font-bold text-white mb-1 tracking-tight">Ajúa</h1>
          <p className="text-orange-100 text-base italic font-medium mb-1">Deliciosamente</p>
          <p className="text-orange-200/70 text-xs tracking-widest uppercase mb-6">Desde 2013</p>
          <div className="w-16 h-0.5 bg-white/30 mx-auto mb-5" />
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
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Contraseña</label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-orange-600 hover:text-orange-700 font-medium transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
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
