'use client'
import { useEffect, useState } from 'react'
import { supabase, fmt } from '@/lib/supabase'
import { Search, ChevronDown, ChevronUp } from 'lucide-react'

const STATUS_LAO: Record<string, string> = {
  pending: 'ລໍຖ້າ', confirmed: 'ຢືນຢັນ', processing: 'ກຳລັງກຽມ',
  shipping: 'ກຳລັງສົ່ງ', delivered: 'ສຳເລັດ', cancelled: 'ຍົກເລີກ',
}
const STATUS_COLOR: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700', shipping: 'bg-orange-100 text-orange-700',
  delivered: 'bg-green-100 text-green-700', cancelled: 'bg-gray-100 text-gray-500',
}

export default function SellerOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const { data: s } = await supabase.from('sellers').select('id').eq('user_id', data.session.user.id).single()
      if (!s) return

      // Get seller's product IDs
      const { data: myProds } = await supabase.from('products').select('id,name,image_url').eq('seller_id', s.id)
      const prodIds = new Set((myProds ?? []).map((p: any) => p.id))
      const prodMap = Object.fromEntries((myProds ?? []).map((p: any) => [p.id, p]))

      if (prodIds.size === 0) { setLoading(false); return }

      const { data: allOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false })

      // Filter orders containing seller's products
      const myOrders = (allOrders ?? []).filter((o: any) => {
        const items = Array.isArray(o.items) ? o.items : []
        return items.some((it: any) => prodIds.has(it.product_id))
      }).map((o: any) => {
        const items = (Array.isArray(o.items) ? o.items : []).filter((it: any) => prodIds.has(it.product_id))
        const myTotal = items.reduce((s: number, it: any) => s + (it.price ?? 0) * (it.qty ?? 1), 0)
        return { ...o, myItems: items, myTotal, prodMap }
      })

      setOrders(myOrders)
      setLoading(false)
    })
  }, [])

  const filtered = orders.filter(o => {
    const matchQ = !q || (o.id ?? '').toLowerCase().includes(q.toLowerCase()) || (o.customer_name ?? '').toLowerCase().includes(q.toLowerCase())
    const matchF = filter === 'all' || o.status === filter
    return matchQ && matchF
  })

  const toggle = (id: string) => setExpanded(e => e === id ? null : id)

  if (loading) return <div className="text-center py-20 text-gray-400">ກຳລັງໂຫຼດ...</div>

  return (
    <div className="space-y-4">
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1 min-w-48">
          <Search size={16} className="mx-3 text-gray-400 shrink-0" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="ຄົ້ນຫາ Order ID, ຊື່..."
            className="flex-1 py-2.5 text-sm outline-none" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 text-sm outline-none shadow-sm">
          <option value="all">ທັງໝົດ ({orders.length})</option>
          {Object.entries(STATUS_LAO).map(([k, v]) => (
            <option key={k} value={k}>{v} ({orders.filter(o => o.status === k).length})</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-500">{filtered.length} ລາຍການ</p>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          <div className="text-4xl mb-3">📋</div>
          <p>ຍັງບໍ່ມີການສັ່ງຊື້</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => {
            const isOpen = expanded === o.id
            const parts = (o.address ?? '').split(' · ')
            const custName = parts[0] || o.customer_name || ''
            const phone = parts[1] || o.customer_phone || ''
            return (
              <div key={o.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-gray-800">#{o.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleString('lo-LA')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#1247D8] text-lg">{fmt(o.myTotal)}</p>
                      <p className="text-xs text-gray-400">{o.myItems.length} ລາຍການ</p>
                    </div>
                  </div>

                  {(custName || phone) && (
                    <div className="mt-2 space-y-0.5">
                      {custName && <p className="text-sm font-bold text-gray-700">👤 {custName}</p>}
                      {phone && <p className="text-xs text-gray-500">📞 {phone}</p>}
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LAO[o.status] ?? o.status}
                    </span>
                    {o.tracking_number && (
                      <span className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                        🚚 {o.courier ? `${o.courier} · ` : ''}{o.tracking_number}
                      </span>
                    )}
                  </div>
                </div>

                <button onClick={() => toggle(o.id)}
                  className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100 text-sm text-gray-500 hover:bg-gray-100 transition-colors">
                  <span>ສິນຄ້າ {o.myItems.length} ລາຍການ</span>
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-2 border-t border-gray-100">
                    {o.myItems.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm text-gray-600 pt-2">
                        <span className="flex-1 mr-4">{item.name} × {item.qty}</span>
                        <span className="font-bold shrink-0">{fmt((item.price ?? 0) * (item.qty ?? 1))}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-black text-sm">
                      <span>ລວມ (ສ່ວນຂອງຮ້ານ)</span>
                      <span className="text-[#1247D8]">{fmt(o.myTotal)}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
