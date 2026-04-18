'use client'

import { useState } from 'react'
import {
  Settings,
  Users,
  Printer,
  Webhook,
  Trash2,
  UserPlus,
  Plus,
  Loader2,
  Copy,
  Check,
  X,
  Clock,
  CreditCard,
  AlertCircle,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { RestaurantSettings, WebhookEndpoint, BusinessHour } from '@/types/database'

interface TeamMember {
  id: string
  role: string
  user_profiles: { id: string; email: string; full_name: string | null } | null
}

interface RestaurantInfo {
  id: string
  name: string
  slug: string
  address: string | null
  phone: string | null
}

interface Props {
  restaurant: RestaurantInfo
  orgSlug: string
  settings: RestaurantSettings
  team: TeamMember[]
  webhooks: WebhookEndpoint[]
}

type Tab = 'general' | 'equipo' | 'ticket' | 'webhooks' | 'horarios' | 'pagos'

const DEFAULT_BUSINESS_HOURS: BusinessHour[] = [
  { day: 'Domingo',    enabled: true, open: '08:00', close: '22:00' },
  { day: 'Lunes',      enabled: true, open: '09:00', close: '22:00' },
  { day: 'Martes',     enabled: true, open: '09:00', close: '22:00' },
  { day: 'Miércoles',  enabled: true, open: '09:00', close: '22:00' },
  { day: 'Jueves',     enabled: true, open: '09:00', close: '22:00' },
  { day: 'Viernes',    enabled: true, open: '09:00', close: '22:00' },
  { day: 'Sábado',     enabled: true, open: '09:00', close: '22:00' },
]

const WEBHOOK_EVENTS = [
  'order.created',
  'order.confirmed',
  'order.preparing',
  'order.ready',
  'order.delivered',
  'order.cancelled',
]

const ROLE_LABELS: Record<string, string> = {
  gerente: 'Gerente',
  cajera: 'Cajera',
  cocina: 'Cocina',
}

const ROLE_COLORS: Record<string, string> = {
  gerente: 'bg-purple-100 text-purple-700',
  cajera: 'bg-blue-100 text-blue-700',
  cocina: 'bg-orange-100 text-orange-700',
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(' ')
    return parts.length >= 2
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

// ─── Tab: General ────────────────────────────────────────────────────────────

function GeneralTab({ restaurant }: { restaurant: RestaurantInfo }) {
  const [name, setName] = useState(restaurant.name)
  const [address, setAddress] = useState(restaurant.address ?? '')
  const [phone, setPhone] = useState(restaurant.phone ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('restaurants')
        .update({ name, address: address || null, phone: phone || null })
        .eq('id', restaurant.id)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Cambios guardados')
      }
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Dirección</label>
        <input
          type="text"
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Av. Insurgentes Sur 123, CDMX"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
        <input
          type="text"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="55 1234 5678"
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Guardar cambios
      </button>
    </div>
  )
}

// ─── Tab: Equipo ─────────────────────────────────────────────────────────────

function EquipoTab({
  restaurantId,
  initialTeam,
}: {
  restaurantId: string
  initialTeam: TeamMember[]
}) {
  const [team, setTeam] = useState<TeamMember[]>(initialTeam)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'gerente' | 'cajera' | 'cocina'>('cajera')
  const [inviting, setInviting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  async function handleInvite() {
    if (!email.trim()) {
      toast.error('Ingresa un email')
      return
    }
    setInviting(true)
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), role }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error al invitar')
        return
      }
      if (data.invited) {
        toast.success(`Invitación enviada a ${email}. El usuario recibirá un correo para activar su cuenta.`)
      } else {
        toast.success('Usuario agregado al equipo')
      }
      setEmail('')
      // Refresh team
      const listRes = await fetch(`/api/restaurants/${restaurantId}/team`)
      const listData = await listRes.json()
      if (listData.team) setTeam(listData.team)
    } catch {
      toast.error('Error de conexión')
    } finally {
      setInviting(false)
    }
  }

  async function handleRemove(roleId: string) {
    setRemovingId(roleId)
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/team`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Error al eliminar')
        return
      }
      setTeam(prev => prev.filter(m => m.id !== roleId))
      toast.success('Acceso revocado')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Invite form */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Invitar usuario
        </h3>
        <div className="flex gap-3 flex-wrap">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleInvite()}
            placeholder="correo@ejemplo.com"
            className="flex-1 min-w-0 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <select
            value={role}
            onChange={e => setRole(e.target.value as 'gerente' | 'cajera' | 'cocina')}
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            <option value="gerente">Gerente</option>
            <option value="cajera">Cajera</option>
            <option value="cocina">Cocina</option>
          </select>
          <button
            onClick={handleInvite}
            disabled={inviting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 shrink-0"
          >
            {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Invitar
          </button>
        </div>
      </div>

      {/* Team list */}
      <div className="space-y-2">
        {team.length === 0 && (
          <p className="text-sm text-gray-400 py-8 text-center">No hay usuarios en el equipo</p>
        )}
        {team.map(member => {
          const profile = member.user_profiles
          const initials = getInitials(profile?.full_name ?? null, profile?.email ?? '?')
          return (
            <div
              key={member.id}
              className="flex items-center gap-4 bg-white border border-gray-200 rounded-xl px-4 py-3"
            >
              <div className="h-9 w-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-semibold shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {profile?.full_name ?? profile?.email ?? '—'}
                </p>
                {profile?.full_name && (
                  <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                )}
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                  ROLE_COLORS[member.role] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {ROLE_LABELS[member.role] ?? member.role}
              </span>
              <button
                onClick={() => handleRemove(member.id)}
                disabled={removingId === member.id}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 shrink-0"
              >
                {removingId === member.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab: Ticket ─────────────────────────────────────────────────────────────

function TicketTab({
  restaurantId,
  restaurantName,
  restaurantAddress,
  restaurantPhone,
  initialSettings,
}: {
  restaurantId: string
  restaurantName: string
  restaurantAddress: string | null
  restaurantPhone: string | null
  initialSettings: RestaurantSettings
}) {
  const [showLogo, setShowLogo] = useState(initialSettings.ticket_show_logo)
  const [showAddress, setShowAddress] = useState(initialSettings.ticket_show_address)
  const [showPhone, setShowPhone] = useState(initialSettings.ticket_show_phone)
  const [header, setHeader] = useState(initialSettings.ticket_header ?? '')
  const [footer, setFooter] = useState(initialSettings.ticket_footer ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket_show_logo: showLogo,
          ticket_show_address: showAddress,
          ticket_show_phone: showPhone,
          ticket_header: header || null,
          ticket_footer: footer || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Error al guardar')
      } else {
        toast.success('Configuración de ticket guardada')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Form */}
      <div className="space-y-5">
        {/* Toggles */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Mostrar en ticket</h3>
          {[
            { label: 'Logo del restaurante', value: showLogo, set: setShowLogo },
            { label: 'Dirección', value: showAddress, set: setShowAddress },
            { label: 'Teléfono', value: showPhone, set: setShowPhone },
          ].map(({ label, value, set }) => (
            <label key={label} className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-700">{label}</span>
              <Toggle value={value} onChange={set} />
            </label>
          ))}
        </div>

        {/* Header */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Texto del encabezado
          </label>
          <textarea
            value={header}
            onChange={e => setHeader(e.target.value)}
            rows={2}
            placeholder="¡Bienvenido a Ajúa!"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Footer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Texto del pie
          </label>
          <textarea
            value={footer}
            onChange={e => setFooter(e.target.value)}
            rows={2}
            placeholder="IVA incluido"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar
        </button>
      </div>

      {/* Preview */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Vista previa</h3>
        <div className="inline-block bg-white border border-gray-300 rounded-lg p-4 font-mono text-xs shadow-sm min-w-[220px]">
          <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-gray-300">
            {showLogo && <p className="font-bold text-sm">🍽️</p>}
            <p className="font-bold uppercase tracking-wide">{restaurantName}</p>
            {showAddress && restaurantAddress && (
              <p className="text-gray-600 text-[11px]">{restaurantAddress}</p>
            )}
            {showPhone && restaurantPhone && (
              <p className="text-gray-600 text-[11px]">{restaurantPhone}</p>
            )}
            {header && (
              <p className="text-gray-700 italic text-[11px] pt-1">{header}</p>
            )}
          </div>
          <div className="py-2 border-b border-dashed border-gray-300 space-y-0.5">
            <p className="text-gray-500">#2026-0001</p>
            <p className="text-gray-500">Mesa: 5</p>
          </div>
          <div className="py-2 border-b border-dashed border-gray-300 space-y-0.5">
            <div className="flex justify-between gap-4">
              <span>2x Taco pastor</span>
              <span>$180</span>
            </div>
            <div className="flex justify-between gap-4">
              <span>1x Agua mineral</span>
              <span>$35</span>
            </div>
          </div>
          <div className="py-2 border-b border-dashed border-gray-300">
            <div className="flex justify-between gap-4 font-bold">
              <span>TOTAL:</span>
              <span>$215.00</span>
            </div>
          </div>
          {footer && (
            <div className="pt-2 text-center">
              <p className="text-gray-600 italic text-[11px]">{footer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Horarios ────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 ${
        value ? 'bg-orange-500' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  )
}

function HorariosTab({
  restaurantId,
  initialHours,
}: {
  restaurantId: string
  initialHours: BusinessHour[] | null
}) {
  const [hours, setHours] = useState<BusinessHour[]>(
    initialHours ?? DEFAULT_BUSINESS_HOURS
  )
  const [saving, setSaving] = useState(false)

  function update(index: number, patch: Partial<BusinessHour>) {
    setHours(prev => prev.map((h, i) => (i === index ? { ...h, ...patch } : h)))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_hours: hours }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Error al guardar')
      } else {
        toast.success('Horarios guardados')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Horarios de atención</h3>
        <button
          onClick={() => setHours(DEFAULT_BUSINESS_HOURS)}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Restaurar predeterminados
        </button>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
        {hours.map((h, i) => (
          <div key={h.day} className="flex items-center gap-3 px-4 py-3 bg-white">
            <Toggle value={h.enabled} onChange={v => update(i, { enabled: v })} />
            <span className={`w-24 text-sm font-medium shrink-0 ${h.enabled ? 'text-gray-900' : 'text-gray-400'}`}>
              {h.day}
            </span>
            <div className={`flex items-center gap-2 flex-1 transition-opacity ${h.enabled ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
              <input
                type="time"
                value={h.open}
                onChange={e => update(i, { open: e.target.value })}
                className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-400">a</span>
              <input
                type="time"
                value={h.close}
                onChange={e => update(i, { close: e.target.value })}
                className="px-2.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Guardar horarios
      </button>
    </div>
  )
}

// ─── Tab: Pagos ───────────────────────────────────────────────────────────────

function PagosTab({
  restaurantId,
  initialAcceptsCash,
  initialAcceptsCard,
  initialStripeAccountId,
}: {
  restaurantId: string
  initialAcceptsCash: boolean
  initialAcceptsCard: boolean
  initialStripeAccountId: string | null
}) {
  const [acceptsCash, setAcceptsCash] = useState(initialAcceptsCash)
  const [acceptsCard, setAcceptsCard] = useState(initialAcceptsCard)
  const [stripeAccountId, setStripeAccountId] = useState(initialStripeAccountId ?? '')
  const [showStripeInput, setShowStripeInput] = useState(false)
  const [savingMethods, setSavingMethods] = useState(false)
  const [savingStripe, setSavingStripe] = useState(false)

  const isStripeConnected = Boolean(initialStripeAccountId)

  async function handleSaveMethods() {
    setSavingMethods(true)
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepts_cash: acceptsCash, accepts_card: acceptsCard }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Error al guardar')
      } else {
        toast.success('Métodos de pago actualizados')
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSavingMethods(false)
    }
  }

  async function handleSaveStripe() {
    if (!stripeAccountId.trim()) {
      toast.error('Ingresa un ID de cuenta Stripe')
      return
    }
    setSavingStripe(true)
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/settings`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stripe_account_id: stripeAccountId.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Error al guardar')
      } else {
        toast.success('Cuenta Stripe guardada')
        setShowStripeInput(false)
      }
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSavingStripe(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      {/* Stripe section */}
      <div className="border border-gray-200 rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">Pagos con Stripe</h3>
        </div>
        <p className="text-sm text-gray-500">
          Conecta tu cuenta Stripe para recibir pagos de tus clientes directamente.
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          {isStripeConnected ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700 border border-green-200">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              Conectado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
              <AlertCircle className="h-3.5 w-3.5" />
              No conectado
            </span>
          )}
          {initialStripeAccountId && (
            <span className="text-sm text-gray-500 font-mono">{initialStripeAccountId}</span>
          )}
        </div>

        {showStripeInput ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                ID de cuenta Stripe (acct_...)
              </label>
              <input
                type="text"
                value={stripeAccountId}
                onChange={e => setStripeAccountId(e.target.value)}
                placeholder="acct_1TKTswCNAB1puyN4"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-mono"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveStripe}
                disabled={savingStripe}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {savingStripe && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
              <button
                onClick={() => { setShowStripeInput(false); setStripeAccountId(initialStripeAccountId ?? '') }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowStripeInput(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            {isStripeConnected ? 'Cambiar cuenta Stripe' : 'Conectar cuenta Stripe'}
          </button>
        )}
      </div>

      {/* Payment methods */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-900">Métodos de pago aceptados</h3>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Pagar al recibir (efectivo)</p>
              <p className="text-xs text-gray-500 mt-0.5">El cliente paga en efectivo al momento de recibir su pedido</p>
            </div>
            <Toggle value={acceptsCash} onChange={setAcceptsCash} />
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Pagar con tarjeta (Stripe)</p>
              <p className="text-xs text-gray-500 mt-0.5">Requiere cuenta Stripe conectada</p>
            </div>
            <Toggle value={acceptsCard} onChange={setAcceptsCard} />
          </div>
        </div>
      </div>

      <button
        onClick={handleSaveMethods}
        disabled={savingMethods}
        className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
      >
        {savingMethods && <Loader2 className="h-4 w-4 animate-spin" />}
        Guardar métodos de pago
      </button>
    </div>
  )
}

// ─── Modal: show secret ───────────────────────────────────────────────────────

function SecretModal({ secret, onClose }: { secret: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(secret)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Secret del webhook</h3>
            <p className="text-sm text-red-600 mt-1 font-medium">
              Guarda este secret — no se mostrará de nuevo.
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="bg-gray-50 rounded-lg px-4 py-3 font-mono text-sm break-all text-gray-800 border border-gray-200">
          {secret}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 w-full justify-center px-4 py-2.5 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copiar secret
            </>
          )}
        </button>
        <button
          onClick={onClose}
          className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Ya lo guardé, cerrar
        </button>
      </div>
    </div>
  )
}

// ─── Tab: Webhooks ────────────────────────────────────────────────────────────

function WebhooksTab({
  restaurantId,
  initialWebhooks,
}: {
  restaurantId: string
  initialWebhooks: WebhookEndpoint[]
}) {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>(initialWebhooks)
  const [url, setUrl] = useState('')
  const [events, setEvents] = useState<string[]>([])
  const [adding, setAdding] = useState(false)
  const [newSecret, setNewSecret] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function toggleEvent(event: string) {
    setEvents(prev =>
      prev.includes(event) ? prev.filter(e => e !== event) : [...prev, event]
    )
  }

  async function handleAdd() {
    if (!url.trim()) {
      toast.error('Ingresa una URL')
      return
    }
    if (events.length === 0) {
      toast.error('Selecciona al menos un evento')
      return
    }
    setAdding(true)
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), events }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error al crear webhook')
        return
      }
      setWebhooks(prev => [data.webhook, ...prev])
      setNewSecret(data.secret)
      setUrl('')
      setEvents([])
    } catch {
      toast.error('Error de conexión')
    } finally {
      setAdding(false)
    }
  }

  async function handleToggle(webhook: WebhookEndpoint) {
    setTogglingId(webhook.id)
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/webhooks/${webhook.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !webhook.is_active }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Error')
        return
      }
      setWebhooks(prev => prev.map(w => (w.id === webhook.id ? data.webhook : w)))
    } catch {
      toast.error('Error de conexión')
    } finally {
      setTogglingId(null)
    }
  }

  async function handleDelete(webhookId: string) {
    setDeletingId(webhookId)
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/webhooks/${webhookId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Error al eliminar')
        return
      }
      setWebhooks(prev => prev.filter(w => w.id !== webhookId))
      toast.success('Webhook eliminado')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {newSecret && (
        <SecretModal secret={newSecret} onClose={() => setNewSecret(null)} />
      )}

      {/* Add webhook form */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Agregar webhook
        </h3>

        <div>
          <label className="block text-sm text-gray-700 mb-1.5">URL del endpoint</label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://mi-sistema.com/webhook"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-700 mb-2">Eventos</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {WEBHOOK_EVENTS.map(event => (
              <label key={event} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={events.includes(event)}
                  onChange={() => toggleEvent(event)}
                  className="h-4 w-4 accent-orange-500"
                />
                <span className="text-xs text-gray-700 font-mono">{event}</span>
              </label>
            ))}
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={adding}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
        >
          {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Agregar
        </button>
      </div>

      {/* Webhook list */}
      <div className="space-y-3">
        {webhooks.length === 0 && (
          <p className="text-sm text-gray-400 py-8 text-center">
            No hay webhooks configurados
          </p>
        )}
        {webhooks.map(wh => (
          <div key={wh.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <p className="font-mono text-sm text-gray-800 break-all">{wh.url}</p>
              <div className="flex items-center gap-2 shrink-0">
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(wh)}
                  disabled={togglingId === wh.id}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                    wh.is_active ? 'bg-orange-500' : 'bg-gray-200'
                  } disabled:opacity-50`}
                >
                  {togglingId === wh.id ? (
                    <Loader2 className="h-3 w-3 animate-spin mx-auto text-white" />
                  ) : (
                    <span
                      className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                        wh.is_active ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  )}
                </button>
                {/* Delete */}
                <button
                  onClick={() => handleDelete(wh.id)}
                  disabled={deletingId === wh.id}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  {deletingId === wh.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {wh.events.map(ev => (
                <span
                  key={ev}
                  className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200"
                >
                  {ev}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  wh.is_active ? 'bg-green-500' : 'bg-gray-300'
                }`}
              />
              <span className="text-xs text-gray-500">
                {wh.is_active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function RestaurantSettingsClient({
  restaurant,
  settings,
  team,
  webhooks,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('general')

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'general',   label: 'General',            icon: Settings    },
    { id: 'equipo',    label: 'Equipo',              icon: Users       },
    { id: 'horarios',  label: 'Horarios',            icon: Clock       },
    { id: 'pagos',     label: 'Pagos',               icon: CreditCard  },
    { id: 'ticket',    label: 'Impresión de Ticket', icon: Printer     },
    { id: 'webhooks',  label: 'Webhooks',            icon: Webhook     },
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Tab bar */}
      <div className="border-b border-gray-200 px-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-6">
        {activeTab === 'general' && (
          <GeneralTab restaurant={restaurant} />
        )}
        {activeTab === 'equipo' && (
          <EquipoTab restaurantId={restaurant.id} initialTeam={team} />
        )}
        {activeTab === 'ticket' && (
          <TicketTab
            restaurantId={restaurant.id}
            restaurantName={restaurant.name}
            restaurantAddress={restaurant.address}
            restaurantPhone={restaurant.phone}
            initialSettings={settings}
          />
        )}
        {activeTab === 'horarios' && (
          <HorariosTab
            restaurantId={restaurant.id}
            initialHours={settings.business_hours}
          />
        )}
        {activeTab === 'pagos' && (
          <PagosTab
            restaurantId={restaurant.id}
            initialAcceptsCash={settings.accepts_cash}
            initialAcceptsCard={settings.accepts_card}
            initialStripeAccountId={settings.stripe_account_id}
          />
        )}
        {activeTab === 'webhooks' && (
          <WebhooksTab restaurantId={restaurant.id} initialWebhooks={webhooks} />
        )}
      </div>
    </div>
  )
}
