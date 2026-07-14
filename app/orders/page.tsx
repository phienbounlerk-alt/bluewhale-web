'use client'
import { useEffect, useState } from 'react'
import { supabase, fmt } from '@/lib/supabase'
import Link from 'next/link'
import { ClipboardList, ChevronDown, ChevronUp, MapPin, Copy, Check } from 'lucide-react'

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
const STATUS_ICON: Record<string, string> = {
  pending: '🕐', confirmed: '✅', processing: '📦', shipping: '🚚', delivered: '🎉', cancelled: '❌'
}
const METHOD_LAO: Record<string, string> = { cod: '💵 COD', qr: '📷 QR ໂອນ' }
const TABS = ['ທັງໝົດ', 'ລໍຖ້າ', 'ຢືນຢັນ', 'ກຳລັງກຽມ', 'ກຳລັງສົ່ງ', 'ສຳເລັດ', 'ຍົກເລີກ']
const TAB_STATUS = ['all', 'pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled']

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (!data.user) { setLoading(false); return }
      supabase.from('orders')
        .select('*')
        .eq('user_id', data.user.id)
        .order('created_at', { ascending: false })
        .then(({ data: rows }) => { setOrders(rows ?? []); setLoading(false) })
    })
  }, [])

  const filtered = tab === 0 ? orders : orders.filter(o => o.status === TAB_STATUS[tab])
  const toggle = (id: string) => setExpanded(e => e === id ? null : id)

  const copyTracking = (num: string, id: string) => {
    navigator.clipboard.writeText(num)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400">ກຳລັງໂຫຼດ...</div>

  if (!user) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <p className="text-gray-500 mb-4">ກະລຸນາເຂົ້າສູ່ລະບົບເພື່ອເບິ່ງການສັ່ງຊື້</p>
      <Link href="/login" className="bg-[#1247D8] text-white px-6 py-2.5 rounded-xl font-bold">ເຂົ້າສູ່ລະບົບ</Link>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-black text-gray-800 mb-6">📦 ການສັ່ງຊື້ຂອງຂ້ອຍ</h1>

      <div className="flex gap-1 overflow-x-auto pb-2 mb-6">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${tab === i ? 'bg-[#1247D8] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
            <ClipboardList size={36} className="text-[#1247D8]" />
          </div>
          <p className="text-gray-500 font-medium">ຍັງບໍ່ມີການສັ່ງຊື້</p>
          <Link href="/products" className="mt-2 bg-[#1247D8] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#0d35b0] transition-colors">
            ເລືອກຊື້ສິນຄ້າ
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(o => {
            const isOpen = expanded === o.id
            const items = Array.isArray(o.items) ? o.items : []
            const logs: any[] = Array.isArray(o.tracking_logs) ? o.tracking_logs : []
            const total = o.total ?? o.total_amount ?? 0

            return (
              <div key={o.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-black text-sm text-gray-800">#{o.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('lo-LA')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#1247D8]">{fmt(total)}</p>
                      <p className="text-xs text-gray-400">{METHOD_LAO[o.payment_method] ?? o.payment_method}</p>
                    </div>
                  </div>

                  <div className="mt-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {STATUS_ICON[o.status]} {STATUS_LAO[o.status] ?? o.status}
                    </span>
                  </div>

                  {o.address && (
                    <p className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                      <MapPin size={10} /> {o.address}
                    </p>
                  )}

                  {/* Tracking info */}
                  {(o.courier || o.tracking_number) && (
                    <div className="mt-3 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5">
                      <p className="text-xs font-bold text-orange-700 mb-1">🚚 ຂໍ້ມູນການສົ່ງ</p>
                      {o.courier && <p className="text-xs text-gray-700">ບໍລິສັດ: <span className="font-bold">{o.courier}</span></p>}
                      {o.tracking_number && (
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-700">ເລກຕິດຕາມ: <span className="font-bold font-mono">{o.tracking_number}</span></p>
                          <button onClick={() => copyTracking(o.tracking_number, o.id)}
                            className="text-orange-500 hover:text-orange-700 transition-colors">
                            {copied === o.id ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timeline */}
                  {logs.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-bold text-gray-500 mb-3">📋 ສະຖານະການສົ່ງ</p>
                      <div className="relative pl-4">
                        <div className="absolute left-1.5 top-2 bottom-2 w-px bg-gray-200" />
                        <div className="space-y-3">
                          {[...logs].reverse().map((log, i) => (
                            <div key={i} className="flex gap-3 items-start relative">
                              <div className={`absolute -left-2.5 mt-1 w-2.5 h-2.5 rounded-full border-2 border-white ${i === 0 ? 'bg-[#1247D8]' : 'bg-gray-300'}`} />
                              <div className="flex-1 pl-2">
                                <p className={`text-xs font-medium ${i === 0 ? 'text-gray-800' : 'text-gray-500'}`}>{log.note}</p>
                                <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString('lo-LA')}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Slips */}
                  {(o.receipt_url || o.shipping_slip_url) && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {o.receipt_url && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">📎 ສະລິບຂອງຂ້ອຍ</p>
                          <a href={o.receipt_url} target="_blank" rel="noreferrer">
                            <img src={o.receipt_url} alt="Receipt" className="w-full h-20 object-cover rounded-xl border border-gray-200" />
                          </a>
                        </div>
                      )}
                      {o.shipping_slip_url && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">🚚 ໃບຝາກເຄື່ອງ</p>
                          <a href={o.shipping_slip_url} target="_blank" rel="noreferrer">
                            <img src={o.shipping_slip_url} alt="Shipping" className="w-full h-20 object-cover rounded-xl border border-green-200" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Items expand */}
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
