'use client'

import { useState } from 'react'
import { CreditCard, Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { OrganizationSettings } from '@/types/database'

interface Props {
  orgId: string
  settings: OrganizationSettings | null
}

interface StripeAccount {
  id: string
  email: string
  display_name: string | null
}

export function OrgStripeSettings({ orgId, settings }: Props) {
  const isConnected = !!(settings?.stripe_enabled && settings?.stripe_publishable_key)

  const [mode, setMode] = useState<'view' | 'edit'>(isConnected ? 'view' : 'edit')
  const [publishableKey, setPublishableKey] = useState('')
  const [secretKey, setSecretKey] = useState('')
  const [webhookSecret, setWebhookSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifiedAccount, setVerifiedAccount] = useState<StripeAccount | null>(null)
  const [connected, setConnected] = useState(isConnected)
  const [currentSettings, setCurrentSettings] = useState(settings)

  const maskedKey = currentSettings?.stripe_publishable_key
    ? `...${currentSettings.stripe_publishable_key.slice(-4)}`
    : null

  async function handleVerifyAndSave() {
    if (!publishableKey.trim() || !secretKey.trim()) {
      toast.error('La publishable key y secret key son requeridas')
      return
    }

    setLoading(true)
    try {
      // Step 1: Verify
      const verifyRes = await fetch('/api/stripe/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret_key: secretKey }),
      })
      const verifyData = await verifyRes.json()

      if (!verifyData.valid) {
        toast.error(`Clave inválida: ${verifyData.error}`)
        setLoading(false)
        return
      }

      setVerifiedAccount(verifyData.account)

      // Step 2: Save
      const saveRes = await fetch(`/api/org/${orgId}/stripe`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripe_publishable_key: publishableKey,
          stripe_secret_key: secretKey,
          stripe_webhook_secret: webhookSecret || null,
          stripe_enabled: true,
        }),
      })
      const saveData = await saveRes.json()

      if (!saveRes.ok) {
        toast.error(saveData.error ?? 'Error al guardar')
        setLoading(false)
        return
      }

      setCurrentSettings(saveData.settings)
      setConnected(true)
      setMode('view')
      setPublishableKey('')
      setSecretKey('')
      setWebhookSecret('')
      toast.success('Cuenta de Stripe conectada correctamente')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  async function handleDisconnect() {
    setLoading(true)
    try {
      const res = await fetch(`/api/org/${orgId}/stripe`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stripe_publishable_key: null,
          stripe_secret_key: null,
          stripe_webhook_secret: null,
          stripe_enabled: false,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Error al desconectar')
        return
      }

      setConnected(false)
      setCurrentSettings(null)
      setVerifiedAccount(null)
      setMode('edit')
      toast.success('Stripe desconectado')
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
            <h2 className="text-lg font-semibold text-gray-900">Stripe</h2>
            {connected && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                <CheckCircle className="h-3.5 w-3.5" />
                Conectado
              </span>
            )}
            {!connected && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                <XCircle className="h-3.5 w-3.5" />
                No conectado
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Conecta tu cuenta de Stripe para procesar pagos en todos tus restaurantes.
          </p>
        </div>
      </div>

      {connected && mode === 'view' ? (
        <div className="space-y-4">
          {(verifiedAccount ?? (currentSettings as unknown as { account?: StripeAccount })?.account) && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <p className="text-sm text-gray-500">Cuenta</p>
              <p className="font-medium text-gray-900">
                {verifiedAccount?.email ?? '—'}
              </p>
              {verifiedAccount?.display_name && (
                <p className="text-sm text-gray-600">{verifiedAccount.display_name}</p>
              )}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 space-y-1">
            <p className="text-sm text-gray-500">Publishable key</p>
            <p className="font-mono text-sm text-gray-900">
              {currentSettings?.stripe_publishable_key
                ? `pk_...${currentSettings.stripe_publishable_key.slice(-4)}`
                : maskedKey ?? '—'}
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setMode('edit')}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-orange-600 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors disabled:opacity-50"
            >
              Actualizar keys
            </button>
            <button
              onClick={handleDisconnect}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Desconectar
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Publishable Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Publishable Key
              <span className="ml-1 text-gray-400 font-normal">(pk_live_... o pk_test_...)</span>
            </label>
            <input
              type="text"
              value={publishableKey}
              onChange={e => setPublishableKey(e.target.value)}
              placeholder="pk_live_..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
            />
          </div>

          {/* Secret Key */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Secret Key
              <span className="ml-1 text-gray-400 font-normal">(sk_live_... o sk_test_...)</span>
            </label>
            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                value={secretKey}
                onChange={e => setSecretKey(e.target.value)}
                placeholder="sk_live_..."
                className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecret(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Webhook Secret */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Webhook Secret
              <span className="ml-1 text-gray-400 font-normal">(whsec_... — opcional)</span>
            </label>
            <input
              type="text"
              value={webhookSecret}
              onChange={e => setWebhookSecret(e.target.value)}
              placeholder="whsec_..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleVerifyAndSave}
              disabled={loading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Verificar y Guardar
            </button>
            {connected && (
              <button
                onClick={() => {
                  setMode('view')
                  setPublishableKey('')
                  setSecretKey('')
                  setWebhookSecret('')
                }}
                disabled={loading}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
