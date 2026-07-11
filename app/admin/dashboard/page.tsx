'use client'
import { useEffect, useState } from 'react'
import { supabase, seedProducts, fmt } from '@/lib/supabase'
import { Package, ShoppingBag, Users, TrendingUp, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

type Stats = { products: number; orders: number; customers: number; revenue: number }

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ products: 0, orders: 0, customers: 0, revenue: 0 })
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      const [{ count: pc }, { count: oc }, { count: uc }, { data: od }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('id,total_amount,status,created_at').order('created_at', { ascending: false }).limit(5),
      ])
      const rev = od?.reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0) ?? 0
      setStats({ products: pc ?? seedProducts.length, orders: oc ?? 0, customers: uc ?? 0, revenue: rev })
      setOrders(od ?? [])
    }
    load()
  }, [])

  const cards = [
    { label: 'ສິນຄ້າທັງໝົດ', value: stats.products, icon: Package,      color: 'bg-blue-500',   href: '/admin/products'  },
    { label: 'ການສັ່ງຊື້',    value: stats.orders,   icon: ShoppingBag,  color: 'bg-orange-500', href: '/admin/orders'    },
    { label: 'ລູກຄ້າ',        value: stats.customers, icon: Users,        color: 'bg-purple-500', href: '/admin/customers' },
    { label: 'ລາຍຮັບ (5 ສຸດ)', value: fmt(stats.revenue), icon: TrendingUp, color: 'bg-green-500', href: '/admin/orders'  },
  ]

  const statusColor: Record<string, string> = {
    pending:    'bg-yellow-100 text-yellow-700',
    confirmed:  'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700',
    shipping:   'bg-orange-100 text-orange-700',
    delivered:  'bg-green-100 text-green-700',
    cancelled:  'bg-gray-100 text-gray-500',
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <Link key={c.label} href={c.href}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between">
              <div className={`${c.color} w-11 h-11 rounded-xl flex items-center justify-center shadow-sm`}>
                <c.icon size={20} className="text-white" />
              </div>
              <ArrowUpRight size={16} className="text-gray-400 group-hover:text-[#1247D8] transition-colors" />
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-gray-800">{c.value}</div>
              <div className="text-xs text-gray-500 mt-0.5 font-medium">{c.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-black text-gray-800">ການສັ່ງຊື້ລ່າສຸດ</h2>
          <Link href="/admin/orders" className="text-[#1247D8] text-sm font-bold hover:underline">ດູທັງໝົດ →</Link>
        </div>
        {orders.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <ShoppingBag size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">ຍັງບໍ່ມີການສັ່ງຊື້</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {orders.map((o: any) => (
              <div key={o.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('lo-LA')}</p>
                </div>
                <span className="font-black text-[#1247D8] text-sm">{fmt(o.total_amount ?? 0)}</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColor[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {o.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { href: '/admin/products', label: 'ເພີ່ມສິນຄ້າໃໝ່', icon: '📦', color: 'bg-blue-50 hover:bg-blue-100 text-[#1247D8]' },
          { href: '/admin/orders',   label: 'ຈັດການການສັ່ງຊື້', icon: '🛒', color: 'bg-orange-50 hover:bg-orange-100 text-orange-600' },
          { href: '/',               label: 'ເບິ່ງໜ້າເວັບ',      icon: '🌐', color: 'bg-green-50 hover:bg-green-100 text-green-600' },
        ].map(q => (
          <Link key={q.href} href={q.href}
            className={`${q.color} rounded-2xl p-5 flex items-center gap-3 transition-colors font-bold text-sm`}>
            <span className="text-2xl">{q.icon}</span>{q.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
