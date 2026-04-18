'use client'

import { useState } from 'react'
import { CreditCard, CheckCircle, ExternalLink, Loader2, AlertCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'

interface Props {
  orgId: string
  accountId: string | null
  onboardingComplete: boolean
  stripeEnabled: boolean
}

export function OrgStripeConnect({ orgId, accountId, onboardingComplete, stripeEnabled }: Props) {
  const [loading, setLoading] = useState(false)

  const isConnected = !!(accountId && onboardingComplete && stripeEnabled)
  const isPending = !!(accountId && !onboardingComplete)

  async function handleConnect() {
    setLoading(true)
    try {
      const res = await fetch(`/api/org/${orgId}/stripe/connect`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error al iniciar conexión')
        return
      }
      window.location.href = data.url
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="bg-orange-50 p-3 rounded-lg shrink-0">
          <CreditCard className="h-6 w-6 text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-lg font-semibold text-gray-900">Pagos con Stripe</h2>
            {isConnected && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                <CheckCircle className="h-3.5 w-3.5" />
                Conectado
              </span>
            )}
            {isPending && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                <AlertCircle className="h-3.5 w-3.5" />
                Configuración incompleta
              </span>
            )}
            {!accountId && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                <XCircle className="h-3.5 w-3.5" />
                No conectado
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {isConnected
              ? 'Tu cuenta de Stripe está conectada. Todos tus restaurantes pueden recibir pagos con tarjeta.'
              : 'Conecta tu cuenta de Stripe para que tus restaurantes puedan aceptar pagos con tarjeta. Stripe administrará tu dinero directamente.'}
          </p>
        </div>
      </div>

      {isConnected ? (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 space-y-1">
            <p className="text-sm text-gray-500">ID de cuenta Stripe</p>
            <p className="font-mono text-sm text-gray-900">{accountId}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-sm text-green-800">
            Todos tus restaurantes ya pueden aceptar pagos con tarjeta desde la app. No necesitas configurar nada más por sucursal.
          </div>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
            Gestionar cuenta en Stripe
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {isPending && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              Completaste el primer paso pero falta información en tu cuenta de Stripe. Haz clic en continuar para finalizar.
            </div>
          )}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm text-gray-600">
            <p className="font-medium text-gray-700">¿Cómo funciona?</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Serás redirigido a Stripe para conectar tu cuenta</li>
              <li>Ingresa con tu cuenta existente o crea una nueva</li>
              <li>El dinero llega directo a tu banco, sin intermediarios</li>
              <li>Tus datos y fondos son 100% tuyos</li>
            </ul>
          </div>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? 'Continuar configuración en Stripe' : 'Conectar cuenta de Stripe'}
          </button>
        </div>
      )}
    </div>
  )
}
