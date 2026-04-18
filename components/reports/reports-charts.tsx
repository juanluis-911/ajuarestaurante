'use client'

import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { TrendingUp, ShoppingBag, Receipt } from 'lucide-react'

interface DayRevenue {
  date: string
  count: number
  revenue: number
}

interface TopItem {
  name: string
  total_qty: number
  revenue: number
}

interface Stats {
  totalOrders: number
  totalRevenue: number
  avgTicket: number
}

interface ReportsChartsProps {
  revenueByDay: DayRevenue[]
  topItems: TopItem[]
  stats: Stats
}

function fmt$(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)
}

function fmtDate(dateStr: string) {
  try {
    return format(parseISO(dateStr), 'd MMM', { locale: es })
  } catch {
    return dateStr
  }
}

export function ReportsCharts({ revenueByDay, topItems, stats }: ReportsChartsProps) {
  const chartData = revenueByDay.map(d => ({
    ...d,
    label: fmtDate(d.date),
  }))

  const topItemsChart = [...topItems].reverse()

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<ShoppingBag size={20} className="text-orange-500" />}
          label="Órdenes totales"
          value={stats.totalOrders.toLocaleString('es-MX')}
        />
        <StatCard
          icon={<TrendingUp size={20} className="text-orange-500" />}
          label="Revenue total"
          value={fmt$(stats.totalRevenue)}
        />
        <StatCard
          icon={<Receipt size={20} className="text-orange-500" />}
          label="Ticket promedio"
          value={fmt$(stats.avgTicket)}
        />
      </div>

      {/* Revenue by day */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Revenue por día (últimos 30 días)</h3>
        {chartData.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value) => [fmt$(Number(value ?? 0)), 'Revenue']}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#f97316"
                strokeWidth={2.5}
                dot={{ r: 3, fill: '#f97316' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top items */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-800 mb-4">Top 10 productos más pedidos</h3>
        {topItemsChart.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(240, topItemsChart.length * 32)}>
            <BarChart
              data={topItemsChart}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#374151' }}
                tickLine={false}
                axisLine={false}
                width={140}
              />
              <Tooltip
                formatter={(value, name) => [
                  name === 'total_qty' ? `${value} uds.` : fmt$(Number(value ?? 0)),
                  name === 'total_qty' ? 'Cantidad' : 'Revenue',
                ]}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Bar dataKey="total_qty" fill="#f97316" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className="p-2.5 bg-orange-50 rounded-lg">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
      Sin datos disponibles aún
    </div>
  )
}
