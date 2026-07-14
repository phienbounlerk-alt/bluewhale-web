'use client'
import { useEffect, useState } from 'react'
import { supabase, fmt } from '@/lib/supabase'
import { Search, ChevronDown, ChevronUp, Phone, MapPin } from 'lucide-react'

const STATUS = ['pending','confirmed','processing','shipping','delivered','cancelled']
const STATUS_LAO: Record<string, string> = {
  pending: 'ລໍຖ້າ', confirmed: 'ຢືນຢັນ', processing: 'ກຳລັງກຽມ',
  shipping: 'ກຳລັງສົ່ງ', delivered: 'ສຳເລັດ', cancelled: 'ຍົກເລີກ'
}
const STATUS_COLOR: Record<string, string> = {
  pending:    'bg-yellow-100 text-yellow-700',
  confirmed:  'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipping:   'bg-orange-100 text-orange-700',
  delivered:  'bg-green-100 text-green-700',
  cancelled:  'bg-gray-100 text-gray-500',
}
const METHOD_LAO: Record<string, string> = { cod: '💵 COD', qr: '📷 QR ໂອນ' }

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('orders').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data ?? []))
  }, [])

  const filtered = orders.filter(o => {
    const matchQ = !q
      || (o.id ?? '').toLowerCase().includes(q.toLowerCase())
      || (o.customer_name ?? '').toLowerCase().includes(q.toLowerCase())
      || (o.customer_phone ?? '').includes(q)
    const matchF = filter === 'all' || o.status === filter
    return matchQ && matchF
  })

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id)
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders(os => os.map(o => o.id === id ? { ...o, status } : o))
    setUpdating(null)
  }

  const toggle = (id: string) => setExpanded(e => e === id ? null : id)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1 min-w-48">
          <Search size={16} className="mx-3 text-gray-400 shrink-0" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="ຄົ້ນຫາຊື່, ເບີໂທ, Order ID..."
            className="flex-1 py-2.5 text-sm outline-none" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 text-sm outline-none shadow-sm">
          <option value="all">ທັງໝົດ ({orders.length})</option>
          {STATUS.map(s => (
            <option key={s} value={s}>{STATUS_LAO[s]} ({orders.filter(o => o.status === s).length})</option>
          ))}
        </select>
      </div>

      <p className="text-sm text-gray-500">{filtered.length} ລາຍການ</p>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          <div className="text-4xl mb-3">📋</div>
          <p>ບໍ່ມີການສັ່ງຊື້</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(o => {
            const isOpen = expanded === o.id
            const items = Array.isArray(o.items) ? o.items : []
            const total = o.total ?? o.total_amount ?? 0

            return (
              <div key={o.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <p className="font-black text-gray-800">#{o.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(o.created_at).toLocaleString('lo-LA')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#1247D8] text-lg">{fmt(total)}</p>
                      <p className="text-xs text-gray-400">{METHOD_LAO[o.payment_method] ?? o.payment_method ?? 'COD'}</p>
                    </div>
                  </div>

                  {/* Customer info */}
                  <div className="mt-3 space-y-1">
                    {o.customer_name && (
                      <p className="text-sm font-bold text-gray-700">👤 {o.customer_name}</p>
                    )}
                    {o.customer_phone && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Phone size={12} /> {o.customer_phone}
                      </p>
                    )}
                    {o.address && (
                      <p className="text-sm text-gray-500 flex items-start gap-1">
                        <MapPin size={12} className="mt-0.5 shrink-0" /> {o.address}
                      </p>
                    )}
                  </div>

                  {/* Status + actions */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_LAO[o.status] ?? o.status}
                    </span>

                    <div className="flex gap-1 flex-wrap ml-auto">
                      {STATUS.filter(s => s !== o.status).map(s => (
                        <button key={s} onClick={() => updateStatus(o.id, s)}
                          disabled={updating === o.id}
                          className="text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium">
                          → {STATUS_LAO[s]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Expand items */}
                {items.length > 0 && (
                  <>
                    <button onClick={() => toggle(o.id)}
                      className="w-full flex items-center justify-between px-4 py-2 bg-gray-50 border-t border-gray-100 text-sm text-gray-500 hover:bg-gray-100 transition-colors">
                      <span>ສິນຄ້າ {items.length} ລາຍການ</span>
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 space-y-2 border-t border-gray-100">
                        {items.map((item: any, i: number) => (
                          <div key={i} className="flex justify-between text-sm text-gray-600 pt-2">
                            <span className="flex-1 mr-4">{item.name} × {item.qty}</span>
                            <span className="font-bold shrink-0">{fmt(item.price * item.qty)}</span>
                          </div>
                        ))}
                        <div className="border-t pt-2 flex justify-between font-black text-sm">
                          <span>ລວມ</span>
                          <span className="text-[#1247D8]">{fmt(total)}</span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
