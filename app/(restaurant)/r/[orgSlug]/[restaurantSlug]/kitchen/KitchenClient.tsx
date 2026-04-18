'use client'

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { RefreshCw, UtensilsCrossed, Package, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { OrderWithDetails, OrderStatus } from '@/types/database'

type KitchenStatus = 'pending' | 'confirmed' | 'preparing' | 'ready'

const COLUMNS: { status: KitchenStatus; label: string; bg: string; border: string; badge: string }[] = [
  { status: 'pending', label: 'Nuevas', bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-200 text-yellow-900' },
  { status: 'confirmed', label: 'Confirmadas', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-200 text-blue-900' },
  { status: 'preparing', label: 'Preparando', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-200 text-orange-900' },
  { status: 'ready', label: 'Listas', bg: 'bg-green-50', border: 'border-green-200', badge: 'bg-green-200 text-green-900' },
]

const NEXT_STATUS: Record<KitchenStatus, OrderStatus> = {
  pending: 'confirmed',
  confirmed: 'preparing',
  preparing: 'ready',
  ready: 'delivered',
}

const NEXT_LABEL: Record<KitchenStatus, string> = {
  pending: 'Confirmar',
  confirmed: 'Preparando',
  preparing: 'Lista',
  ready: 'Entregar',
}

function elapsed(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Ahora'
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h ${mins % 60}m`
}

interface Props {
  restaurantId: string
  restaurantName: string
  initialOrders: OrderWithDetails[]
}

export default function KitchenClient({ restaurantId, restaurantName, initialOrders }: Props) {
  const [orders, setOrders] = useState<OrderWithDetails[]>(initialOrders)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [, setTick] = useState(0)

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setIsRefreshing(true)
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('orders')
        .select('*, items:order_items(*, menu_item:menu_items(*)), table:restaurant_tables(*)')
        .eq('restaurant_id', restaurantId)
        .in('status', ['pending', 'confirmed', 'preparing', 'ready'])
        .order('created_at', { ascending: true })
      if (data) setOrders(data as unknown as OrderWithDetails[])
    } catch {
      if (!silent) toast.error('Error al actualizar órdenes')
    } finally {
      if (!silent) setIsRefreshing(false)
    }
  }, [restaurantId])

  useEffect(() => {
    const interval = setInterval(() => fetchOrders(true), 10000)
    return () => clearInterval(interval)
  }, [fetchOrders])

  useEffect(() => {
    const tick = setInterval(() => setTick(t => t + 1), 30000)
    return () => clearInterval(tick)
  }, [])

  async function handleAdvance(order: OrderWithDetails) {
    const nextStatus = NEXT_STATUS[order.status as KitchenStatus]
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      if (!res.ok) throw new Error()
      if (nextStatus === 'delivered') {
        setOrders(prev => prev.filter(o => o.id !== order.id))
      } else {
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: nextStatus } : o))
      }
      toast.success(`Orden #${order.order_number} → ${nextStatus}`)
    } catch {
      toast.error('Error al actualizar la orden')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <UtensilsCrossed className="text-orange-400" size={22} />
          <h1 className="font-bold text-lg">{restaurantName} — Cocina</h1>
        </div>
        <button
          onClick={() => fetchOrders(false)}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </header>

      <div className="grid grid-cols-4 gap-4 p-4 h-[calc(100vh-57px)]">
        {COLUMNS.map(col => {
          const colOrders = orders.filter(o => o.status === col.status)
          return (
            <div key={col.status} className={`${col.bg} ${col.border} border rounded-xl flex flex-col overflow-hidden`}>
              <div className={`px-4 py-3 border-b ${col.border} flex items-center justify-between`}>
                <h2 className="font-bold text-gray-800">{col.label}</h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${col.badge}`}>
                  {colOrders.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {colOrders.length === 0 && (
                  <p className="text-center text-gray-400 text-sm py-8">Sin órdenes</p>
                )}
                {colOrders.map(order => (
                  <div key={order.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-gray-900 text-xl">#{order.order_number}</span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={11} />
                        {elapsed(order.created_at)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mb-3">
                      {order.type === 'dine_in' ? (
                        <>
                          <UtensilsCrossed size={13} className="text-gray-500" />
                          <span className="text-sm text-gray-600">Mesa {order.table?.number ?? '—'}</span>
                        </>
                      ) : (
                        <>
                          <Package size={13} className="text-gray-500" />
                          <span className="text-sm text-gray-600">{order.customer_name ?? 'Para llevar'}</span>
                        </>
                      )}
                    </div>

                    <div className="space-y-1 mb-3">
                      {order.items?.map(item => (
                        <div key={item.id} className="flex gap-2 text-sm">
                          <span className="font-bold text-gray-800 shrink-0">{item.quantity}x</span>
                          <span className="text-gray-700">{item.menu_item?.name}</span>
                        </div>
                      ))}
                      {order.notes && (
                        <p className="text-xs text-orange-600 mt-1 italic">Nota: {order.notes}</p>
                      )}
                    </div>

                    <button
                      onClick={() => handleAdvance(order)}
                      className="w-full py-2 rounded-lg bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors"
                    >
                      {NEXT_LABEL[order.status as KitchenStatus]}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
