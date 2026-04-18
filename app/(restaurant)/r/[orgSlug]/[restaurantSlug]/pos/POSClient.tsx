'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Plus, Minus, ShoppingCart, UtensilsCrossed, Package, Search } from 'lucide-react'
import type { Category, MenuItem, RestaurantTable, OrderWithDetails, OrderStatus } from '@/types/database'

interface CartItem {
  menu_item_id: string
  name: string
  unit_price: number
  quantity: number
  notes?: string
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  preparing: 'Preparando',
  ready: 'Lista',
  delivered: 'Entregada',
  cancelled: 'Cancelada',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  preparing: 'bg-orange-100 text-orange-800',
  ready: 'bg-green-100 text-green-800',
  delivered: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
}

interface Props {
  restaurantId: string
  restaurantName: string
  categories: (Category & { items: MenuItem[] })[]
  tables: RestaurantTable[]
  initialOrders: OrderWithDetails[]
}

export default function POSClient({ restaurantId, restaurantName, categories, tables, initialOrders }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.id ?? '')
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderType, setOrderType] = useState<'dine_in' | 'pickup'>('dine_in')
  const [selectedTable, setSelectedTable] = useState<string>('')
  const [customerName, setCustomerName] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [orders, setOrders] = useState<OrderWithDetails[]>(initialOrders)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const allItems = categories.flatMap(c => c.items.filter(i => i.is_active))
  const filteredItems = search
    ? allItems.filter(i => i.name.toLowerCase().includes(search.toLowerCase()))
    : (categories.find(c => c.id === activeCategory)?.items.filter(i => i.is_active) ?? [])

  function addToCart(item: MenuItem) {
    setCart(prev => {
      const existing = prev.find(c => c.menu_item_id === item.id)
      if (existing) {
        return prev.map(c => c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { menu_item_id: item.id, name: item.name, unit_price: item.price, quantity: 1 }]
    })
  }

  function updateQuantity(menu_item_id: string, delta: number) {
    setCart(prev => {
      const updated = prev.map(c => c.menu_item_id === menu_item_id ? { ...c, quantity: c.quantity + delta } : c)
      return updated.filter(c => c.quantity > 0)
    })
  }

  const cartTotal = cart.reduce((sum, c) => sum + c.quantity * c.unit_price, 0)

  async function handleCreateOrder() {
    if (cart.length === 0) {
      toast.error('El carrito está vacío')
      return
    }
    if (orderType === 'dine_in' && !selectedTable) {
      toast.error('Selecciona una mesa')
      return
    }
    if (orderType === 'pickup' && !customerName.trim()) {
      toast.error('Ingresa el nombre del cliente')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          table_id: orderType === 'dine_in' ? selectedTable : undefined,
          type: orderType,
          customer_name: orderType === 'pickup' ? customerName : undefined,
          notes: orderNotes || undefined,
          items: cart.map(c => ({
            menu_item_id: c.menu_item_id,
            quantity: c.quantity,
            unit_price: c.unit_price,
          })),
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Error al crear orden')
      }

      const newOrder = await res.json()
      setOrders(prev => [newOrder, ...prev])
      setCart([])
      setCustomerName('')
      setOrderNotes('')
      setSelectedTable('')
      toast.success(`Orden #${newOrder.order_number} creada`)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error al crear orden')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeliver(orderId: string) {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
      })
      if (!res.ok) throw new Error()
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivered' } : o))
      toast.success('Orden marcada como entregada')
    } catch {
      toast.error('Error al actualizar la orden')
    }
  }

  const activeOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'delivered')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-3 flex items-center gap-3">
        <UtensilsCrossed className="text-orange-500" size={22} />
        <h1 className="font-bold text-lg text-gray-800">{restaurantName} — POS</h1>
      </header>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Left: Menu */}
        <div className="flex-1 flex flex-col overflow-hidden border-r bg-white" style={{ flex: '0 0 60%' }}>
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar producto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>

          {/* Category tabs */}
          {!search && (
            <div className="flex gap-1 px-4 py-2 overflow-x-auto border-b">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Items grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {filteredItems.map(item => {
                const inCart = cart.find(c => c.menu_item_id === item.id)
                return (
                  <div
                    key={item.id}
                    className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {item.image_url && (
                      <img src={item.image_url} alt={item.name} className="w-full h-28 object-cover" />
                    )}
                    <div className="p-3">
                      <p className="font-medium text-gray-800 text-sm leading-tight">{item.name}</p>
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-orange-500">${item.price.toFixed(2)}</span>
                        {inCart ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center hover:bg-orange-200"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="text-sm font-bold w-5 text-center">{inCart.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {filteredItems.length === 0 && (
                <div className="col-span-3 text-center py-12 text-gray-400">Sin productos</div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className="flex flex-col bg-white overflow-hidden" style={{ flex: '0 0 40%' }}>
          <div className="flex items-center gap-2 p-4 border-b">
            <ShoppingCart size={18} className="text-orange-500" />
            <h2 className="font-semibold text-gray-800">Nueva Orden</h2>
          </div>

          {/* Order type toggle */}
          <div className="flex gap-2 p-4 border-b">
            <button
              onClick={() => setOrderType('dine_in')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                orderType === 'dine_in' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <UtensilsCrossed size={14} /> Mesa
            </button>
            <button
              onClick={() => setOrderType('pickup')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                orderType === 'pickup' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Package size={14} /> Para llevar
            </button>
          </div>

          {/* Table or customer name */}
          <div className="px-4 py-3 border-b">
            {orderType === 'dine_in' ? (
              <select
                value={selectedTable}
                onChange={e => setSelectedTable(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <option value="">Seleccionar mesa</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>
                    Mesa {t.number} (cap. {t.capacity})
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Nombre del cliente"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
            {cart.length === 0 ? (
              <p className="text-center text-gray-400 text-sm py-8">Agrega productos al carrito</p>
            ) : (
              cart.map(item => (
                <div key={item.menu_item_id} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">${item.unit_price.toFixed(2)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.menu_item_id, -1)}
                      className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-gray-200"
                    >
                      <Minus size={11} />
                    </button>
                    <span className="text-sm font-bold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.menu_item_id, 1)}
                      className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600"
                    >
                      <Plus size={11} />
                    </button>
                  </div>
                  <span className="text-sm font-semibold text-gray-800 w-16 text-right shrink-0">
                    ${(item.quantity * item.unit_price).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Notes */}
          <div className="px-4 pb-2">
            <textarea
              placeholder="Notas de la orden (opcional)"
              value={orderNotes}
              onChange={e => setOrderNotes(e.target.value)}
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
            />
          </div>

          {/* Total + submit */}
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between mb-3">
              <span className="font-semibold text-gray-700">Total</span>
              <span className="font-bold text-xl text-orange-500">${cartTotal.toFixed(2)}</span>
            </div>
            <button
              onClick={handleCreateOrder}
              disabled={isSubmitting || cart.length === 0}
              className="w-full py-3 rounded-xl bg-orange-500 text-white font-bold text-base hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creando...' : 'Crear Orden'}
            </button>
          </div>
        </div>
      </div>

      {/* Active orders */}
      <div className="p-6 bg-gray-50 border-t">
        <h2 className="font-bold text-gray-800 mb-4 text-lg">Órdenes Activas ({activeOrders.length})</h2>
        {activeOrders.length === 0 ? (
          <p className="text-gray-400 text-sm">No hay órdenes activas</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeOrders.map(order => (
              <div key={order.id} className="bg-white rounded-xl border shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <span className="font-bold text-gray-800 text-base">#{order.order_number}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {order.type === 'dine_in' ? `Mesa ${order.table?.number ?? '—'}` : order.customer_name ?? 'Para llevar'}
                    </span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className="text-sm text-gray-600 space-y-0.5 mb-3">
                  {order.items?.map(item => (
                    <div key={item.id}>
                      {item.quantity}x {item.menu_item?.name}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-orange-500">${order.total.toFixed(2)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(order.created_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {order.status !== 'delivered' && (
                      <button
                        onClick={() => handleDeliver(order.id)}
                        className="text-xs px-2 py-1 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        Entregar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
