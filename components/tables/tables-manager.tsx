'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Plus, QrCode, Trash2, X } from 'lucide-react'
import type { RestaurantTable, TableStatus } from '@/types/database'

interface TablesManagerProps {
  restaurantId: string
  orgSlug: string
  restaurantSlug: string
  initialTables: RestaurantTable[]
}

interface NewTableModal {
  open: boolean
  number: string
  capacity: string
}

interface QrModal {
  open: boolean
  table: RestaurantTable | null
}

const STATUS_CONFIG: Record<TableStatus, { label: string; color: string; next: TableStatus; nextLabel: string }> = {
  available: { label: 'Disponible', color: 'bg-green-100 text-green-700 border-green-200', next: 'occupied', nextLabel: 'Marcar ocupada' },
  occupied: { label: 'Ocupada', color: 'bg-red-100 text-red-700 border-red-200', next: 'available', nextLabel: 'Liberar mesa' },
  reserved: { label: 'Reservada', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', next: 'available', nextLabel: 'Liberar mesa' },
}

export function TablesManager({ restaurantId, orgSlug, restaurantSlug, initialTables }: TablesManagerProps) {
  const [tables, setTables] = useState<RestaurantTable[]>(initialTables)
  const [newModal, setNewModal] = useState<NewTableModal>({ open: false, number: '', capacity: '' })
  const [qrModal, setQrModal] = useState<QrModal>({ open: false, table: null })
  const [loading, setLoading] = useState<string | null>(null)

  const supabase = createClient()

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  function getMenuLink(table: RestaurantTable) {
    return `${appUrl}/menu/${orgSlug}/${restaurantSlug}?table=${table.number}`
  }

  async function createTable() {
    if (!newModal.number.trim()) { toast.error('El número de mesa es requerido'); return }
    const capacity = parseInt(newModal.capacity)
    if (isNaN(capacity) || capacity < 1) { toast.error('Capacidad inválida'); return }

    const { data, error } = await supabase
      .from('restaurant_tables')
      .insert({ restaurant_id: restaurantId, number: newModal.number.trim(), capacity, status: 'available' })
      .select()
      .single()

    if (error) { toast.error('Error al crear mesa'); return }
    setTables(prev => [...prev, data as RestaurantTable])
    setNewModal({ open: false, number: '', capacity: '' })
    toast.success(`Mesa ${data.number} creada`)
  }

  async function changeStatus(table: RestaurantTable) {
    const { next } = STATUS_CONFIG[table.status]
    setLoading(table.id)
    const { data, error } = await supabase
      .from('restaurant_tables')
      .update({ status: next })
      .eq('id', table.id)
      .select()
      .single()
    setLoading(null)
    if (error) { toast.error('Error al cambiar estado'); return }
    setTables(prev => prev.map(t => t.id === table.id ? (data as RestaurantTable) : t))
    toast.success(`Mesa ${table.number}: ${STATUS_CONFIG[next].label}`)
  }

  async function deleteTable(table: RestaurantTable) {
    if (!confirm(`¿Eliminar mesa ${table.number}?`)) return
    const { error } = await supabase.from('restaurant_tables').delete().eq('id', table.id)
    if (error) {
      if (error.message?.includes('foreign key') || error.message?.includes('violates')) {
        toast.error('No se puede eliminar: tiene órdenes asociadas')
      } else {
        toast.error('Error al eliminar mesa')
      }
      return
    }
    setTables(prev => prev.filter(t => t.id !== table.id))
    toast.success(`Mesa ${table.number} eliminada`)
  }

  return (
    <div className="p-6">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{tables.length} mesa{tables.length !== 1 ? 's' : ''} registrada{tables.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setNewModal({ open: true, number: '', capacity: '' })}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Nueva Mesa
        </button>
      </div>

      {/* Grid */}
      {tables.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">🪑</p>
          <p className="text-lg font-medium text-gray-500">Sin mesas registradas</p>
          <p className="text-sm mt-1">Crea tu primera mesa para empezar</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {tables.map(table => {
            const cfg = STATUS_CONFIG[table.status]
            return (
              <div
                key={table.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col items-center gap-3"
              >
                <div className="text-4xl font-bold text-gray-800">{table.number}</div>
                <div className="text-xs text-gray-400">{table.capacity} personas</div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                  {cfg.label}
                </span>
                <button
                  onClick={() => changeStatus(table)}
                  disabled={loading === table.id}
                  className="w-full text-xs py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-50"
                >
                  {loading === table.id ? '...' : cfg.nextLabel}
                </button>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => setQrModal({ open: true, table })}
                    className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 border border-orange-200 rounded-lg text-orange-600 hover:bg-orange-50 transition-colors"
                  >
                    <QrCode size={12} /> QR
                  </button>
                  <button
                    onClick={() => deleteTable(table)}
                    className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 border border-red-100 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} /> Elim.
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* New Table Modal */}
      {newModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Nueva Mesa</h3>
              <button onClick={() => setNewModal(m => ({ ...m, open: false }))} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de mesa *</label>
                <input
                  autoFocus
                  type="text"
                  value={newModal.number}
                  onChange={e => setNewModal(m => ({ ...m, number: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="1, 2, A1, Terraza..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad *</label>
                <input
                  type="number"
                  min="1"
                  value={newModal.capacity}
                  onChange={e => setNewModal(m => ({ ...m, capacity: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="4"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
              <button
                onClick={() => setNewModal(m => ({ ...m, open: false }))}
                className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:text-gray-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createTable}
                className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                Crear Mesa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal.open && qrModal.table && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Link QR — Mesa {qrModal.table.number}</h3>
              <button onClick={() => setQrModal({ open: false, table: null })} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-500">
                Comparte este enlace con los clientes para que vean el menú en su teléfono:
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-xs font-mono text-gray-700 break-all">{getMenuLink(qrModal.table)}</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getMenuLink(qrModal.table!))
                  toast.success('Link copiado al portapapeles')
                }}
                className="w-full py-2 text-sm bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                Copiar Link
              </button>
              <a
                href={getMenuLink(qrModal.table)}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2 text-sm text-center border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Abrir menú
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
