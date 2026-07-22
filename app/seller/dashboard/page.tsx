'use client'
import { useEffect, useState } from 'react'
import { supabase, fmt } from '@/lib/supabase'
import { Package, ShoppingBag, TrendingUp, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export default function SellerDashboard() {
  const [sellerId, setSellerId] = useState<string | null>(null)
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const { data: s } = await supabase.from('sellers').select('id').eq('user_id', data.session.user.id).single()
      if (!s) return
      setSellerId(s.id)

      // Products count
      const { count: pc } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('seller_id', s.id)

      // Orders: get products of this seller first
      const { data: myProds } = await supabase.from('products').select('id').eq('seller_id', s.id)
      const prodIds = (myProds ?? []).map((p: any) => p.id)

      if (prodIds.length === 0) {
        setStats({ products: pc ?? 0, orders: 0, revenue: 0 })
        return
      }

      // Orders that contain any of seller's products (stored in items JSONB)
      const { data: orders } = await supabase.from('orders').select('id,total_amount,status,created_at,items')
        .order('created_at', { ascending: false }).limit(10)

      // Filter orders that contain seller's products
      const myOrders = (orders ?? []).filter((o: any) => {
        const items = Array.isArray(o.items) ? o.items : []
        return items.some((it: any) => prodIds.includes(it.product_id))
      })

      const revenue = myOrders.filter((o: any) => o.status === 'delivered').reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0)
      setStats({ products: pc ?? 0, orders: myOrders.length, revenue })
      setRecentOrders(myOrders.slice(0, 5))
    })
  }, [])

  const STATUS_COLOR: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
    processing: 'bg-purple-100 text-purple-700', shipping: 'bg-orange-100 text-orange-700',
    delivered: 'bg-green-100 text-green-700', cancelled: 'bg-gray-100 text-gray-500',
  }
  const STATUS_LAO: Record<string, string> = {
    pending: 'ລໍຖ້າ', confirmed: 'ຢືນຢັນ', processing: 'ກຳລັງກຽມ',
    shipping: 'ກຳລັງສົ່ງ', delivered: 'ສຳເລັດ', cancelled: 'ຍົກເລີກ',
  }

  const cards = [
    { label: 'ສິນຄ້າຂອງຂ້ອຍ', value: stats.products, icon: Package,     color: 'bg-blue-500',  href: '/seller/products' },
    { label: 'ການສັ່ງຊື້',      value: stats.orders,   icon: ShoppingBag, color: 'bg-orange-500', href: '/seller/orders' },
    { label: 'ລາຍຮັບ (delivered)', value: fmt(stats.revenue), icon: TrendingUp, color: 'bg-green-500', href: '/seller/orders' },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
          <Link href="/seller/orders" className="text-[#1247D8] text-sm font-bold hover:underline">ດູທັງໝົດ →</Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <ShoppingBag size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">ຍັງບໍ່ມີການສັ່ງຊື້</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((o: any) => (
              <div key={o.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-800">#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('lo-LA')}</p>
                </div>
                <span className="font-black text-[#1247D8] text-sm">{fmt(o.total_amount ?? 0)}</span>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                  {STATUS_LAO[o.status] ?? o.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/seller/products"
          className="bg-blue-50 hover:bg-blue-100 text-[#1247D8] rounded-2xl p-5 flex items-center gap-3 transition-colors font-bold text-sm">
          <span className="text-2xl">📦</span>ເພີ່ມສິນຄ້າໃໝ່
        </Link>
        <Link href="/seller/orders"
          className="bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-2xl p-5 flex items-center gap-3 transition-colors font-bold text-sm">
          <span className="text-2xl">🛒</span>ຈັດການການສັ່ງຊື້
        </Link>
      </div>
    </div>
  )
}
