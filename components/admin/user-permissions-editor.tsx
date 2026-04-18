'use client'

import { useState } from 'react'
import {
  ShoppingCart, ChefHat, BookOpen, LayoutGrid,
  BarChart2, Settings2, Users, Eye, Pencil, Trash2,
  Loader2, Check, Crown, Building2, Store, Shield,
} from 'lucide-react'
import { toast } from 'sonner'
import type { UserResourcePermission } from '@/types/database'

const RESOURCES = [
  { key: 'pos',        label: 'POS / Órdenes',    icon: ShoppingCart, defaultEdit: true,  defaultDelete: false },
  { key: 'kitchen',    label: 'Cocina',            icon: ChefHat,      defaultEdit: true,  defaultDelete: false },
  { key: 'menu',       label: 'Menú',              icon: BookOpen,     defaultEdit: false, defaultDelete: false },
  { key: 'tables',     label: 'Mesas',             icon: LayoutGrid,   defaultEdit: false, defaultDelete: false },
  { key: 'reports',    label: 'Reportes',          icon: BarChart2,    defaultEdit: false, defaultDelete: false },
  { key: 'settings',   label: 'Configuración',     icon: Settings2,    defaultEdit: false, defaultDelete: false },
  { key: 'team',       label: 'Equipo',            icon: Users,        defaultEdit: false, defaultDelete: false },
]

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin', org_admin: 'Admin Org',
  gerente: 'Gerente', cajera: 'Cajera', cocina: 'Cocina',
}
const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-700 border-purple-200',
  org_admin:   'bg-blue-100 text-blue-700 border-blue-200',
  gerente:     'bg-orange-100 text-orange-700 border-orange-200',
  cajera:      'bg-green-100 text-green-700 border-green-200',
  cocina:      'bg-yellow-100 text-yellow-700 border-yellow-200',
}

type PermKey = `${string}::${string}`
type PermMap = Record<PermKey, { can_view: boolean; can_edit: boolean; can_delete: boolean }>

function buildPermKey(restaurantId: string, resource: string): PermKey {
  return `${restaurantId}::${resource}` as PermKey
}

function buildInitialMap(
  perms: UserResourcePermission[],
  restaurantRoles: { restaurant_id: string; role: string }[]
): PermMap {
  const map: PermMap = {}

  // Default values based on role
  for (const rr of restaurantRoles) {
    for (const res of RESOURCES) {
      const key = buildPermKey(rr.restaurant_id, res.key)
      map[key] = {
        can_view:   true,
        can_edit:   res.defaultEdit,
        can_delete: res.defaultDelete,
      }
    }
  }

  // Override with saved permissions
  for (const p of perms) {
    const key = buildPermKey(p.restaurant_id, p.resource)
    map[key] = { can_view: p.can_view, can_edit: p.can_edit, can_delete: p.can_delete }
  }

  return map
}

function getInitials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(' ')
    return parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() : parts[0].slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

interface Props {
  userId: string
  profile: { id: string; email: string; full_name: string | null }
  orgRoles: { org_id: string; role: string; org: { id: string; name: string; slug: string } | null }[]
  restaurantRoles: { restaurant_id: string; role: string; restaurant: { id: string; name: string; slug: string; org_id: string } | null }[]
  initialPermissions: UserResourcePermission[]
  allRestaurants: { id: string; name: string; slug: string; org_id: string }[]
}

function PermToggle({
  active,
  onChange,
  icon: Icon,
  label,
  color,
}: {
  active: boolean
  onChange: (v: boolean) => void
  icon: React.ElementType
  label: string
  color: string
}) {
  return (
    <button
      onClick={() => onChange(!active)}
      title={label}
      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
        active
          ? `${color} shadow-sm`
          : 'bg-gray-50 text-gray-300 border-gray-200 hover:border-gray-300'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  )
}

export function UserPermissionsEditor({
  userId,
  profile,
  orgRoles,
  restaurantRoles,
  initialPermissions,
  allRestaurants,
}: Props) {
  const [perms, setPerms] = useState<PermMap>(() =>
    buildInitialMap(initialPermissions, restaurantRoles)
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const initials = getInitials(profile.full_name, profile.email)
  const isSuperAdmin = orgRoles.some(r => r.role === 'super_admin')

  function toggle(restaurantId: string, resource: string, field: 'can_view' | 'can_edit' | 'can_delete') {
    const key = buildPermKey(restaurantId, resource)
    setPerms(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: !prev[key]?.[field] },
    }))
    setSaved(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const body = Object.entries(perms).map(([key, vals]) => {
        const [restaurant_id, resource] = key.split('::')
        return { restaurant_id, resource, ...vals }
      })

      const res = await fetch(`/api/admin/users/${userId}/permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? 'Error al guardar')
        return
      }

      setSaved(true)
      toast.success('Permisos guardados')
    } catch {
      toast.error('Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* User card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center shrink-0">
          <span className="text-lg font-bold text-orange-600">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-gray-900">{profile.full_name ?? profile.email}</h2>
          {profile.full_name && <p className="text-sm text-gray-500">{profile.email}</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            {orgRoles.map(r => (
              <span key={r.org_id} className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${ROLE_COLORS[r.role] ?? ''}`}>
                {r.role === 'super_admin' ? <Crown className="h-3 w-3" /> : <Building2 className="h-3 w-3" />}
                {ROLE_LABELS[r.role]} {r.org?.name ? `· ${r.org.name}` : ''}
              </span>
            ))}
            {restaurantRoles.map(r => (
              <span key={r.restaurant_id} className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${ROLE_COLORS[r.role] ?? ''}`}>
                <Store className="h-3 w-3" />
                {ROLE_LABELS[r.role]} · {r.restaurant?.name ?? '—'}
              </span>
            ))}
          </div>
        </div>
      </div>

      {isSuperAdmin && (
        <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl px-5 py-4">
          <Crown className="h-5 w-5 text-purple-600 shrink-0" />
          <p className="text-sm text-purple-800 font-medium">
            Super Admin — acceso total al sistema. Los permisos granulares no aplican.
          </p>
        </div>
      )}

      {!isSuperAdmin && restaurantRoles.length === 0 && (
        <div className="flex items-center gap-3 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4">
          <Shield className="h-5 w-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">
            Usuario sin acceso a ningún restaurante. Asígnalo desde la configuración del restaurante.
          </p>
        </div>
      )}

      {/* Permissions per restaurant */}
      {!isSuperAdmin && restaurantRoles.map(rr => {
        const restaurantName = rr.restaurant?.name ?? rr.restaurant_id

        return (
          <div key={rr.restaurant_id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
              <Store className="h-4 w-4 text-orange-500" />
              <div>
                <h3 className="text-sm font-bold text-gray-900">{restaurantName}</h3>
                <p className="text-xs text-gray-400">Rol base: <span className="font-medium">{ROLE_LABELS[rr.role] ?? rr.role}</span></p>
              </div>
            </div>

            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-5 py-2 bg-gray-50 border-b border-gray-100">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sección</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-16 text-center">Ver</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-16 text-center">Editar</span>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide w-16 text-center">Eliminar</span>
            </div>

            <div className="divide-y divide-gray-50">
              {RESOURCES.map(res => {
                const key = buildPermKey(rr.restaurant_id, res.key)
                const p = perms[key] ?? { can_view: true, can_edit: false, can_delete: false }
                const Icon = res.icon

                return (
                  <div key={res.key} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 items-center px-5 py-3 hover:bg-gray-50/50">
                    <div className="flex items-center gap-2.5">
                      <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-700">{res.label}</span>
                    </div>

                    <div className="w-16 flex justify-center">
                      <PermToggle
                        active={p.can_view}
                        onChange={v => toggle(rr.restaurant_id, res.key, 'can_view')}
                        icon={Eye}
                        label="Ver"
                        color="bg-blue-100 text-blue-700 border-blue-200"
                      />
                    </div>
                    <div className="w-16 flex justify-center">
                      <PermToggle
                        active={p.can_edit}
                        onChange={v => toggle(rr.restaurant_id, res.key, 'can_edit')}
                        icon={Pencil}
                        label="Editar"
                        color="bg-green-100 text-green-700 border-green-200"
                      />
                    </div>
                    <div className="w-16 flex justify-center">
                      <PermToggle
                        active={p.can_delete}
                        onChange={v => toggle(rr.restaurant_id, res.key, 'can_delete')}
                        icon={Trash2}
                        label="Eliminar"
                        color="bg-red-100 text-red-700 border-red-200"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {!isSuperAdmin && restaurantRoles.length > 0 && (
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-orange-500 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 shadow-sm"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saved ? 'Guardado' : 'Guardar permisos'}
          </button>
          <p className="text-xs text-gray-400">Los cambios aplican en el próximo inicio de sesión del usuario</p>
        </div>
      )}
    </div>
  )
}
