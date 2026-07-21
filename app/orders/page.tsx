'use client'
import { useEffect, useState } from 'react'
import { supabase, fmt } from '@/lib/supabase'
import Link from 'next/link'
import {
  ClipboardList, ChevronDown, ChevronUp, MapPin, Copy, Check,
  Phone, MessageCircle, Store, Truck, Clock, Package, CheckCircle2,
  CircleDot, Navigation, AlertCircle
} from 'lucide-react'

// ── Status maps ───────────────────────────────────────────────────────────────
const STATUS_LAO: Record<string, string> = {
  pending: 'ລໍຖ້າຢືນຢັນ', confirmed: 'ຢືນຢັນແລ້ວ', processing: 'ກຳລັງກຽມ',
  shipping: 'ກຳລັງສົ່ງ', delivered: 'ສຳເລັດ', cancelled: 'ຍົກເລີກ'
}
const STATUS_COLOR: Record<string, string> = {
  pending:    'bg-amber-100 text-amber-700 border-amber-200',
  confirmed:  'bg-blue-100 text-blue-700 border-blue-200',
  processing: 'bg-violet-100 text-violet-700 border-violet-200',
  shipping:   'bg-orange-100 text-orange-700 border-orange-200',
  delivered:  'bg-green-100 text-green-700 border-green-200',
  cancelled:  'bg-gray-100 text-gray-500 border-gray-200',
}
const METHOD_LAO: Record<string, string> = { cod: '💵 COD', qr: '📱 ໂອນ QR' }
const TABS = ['ທັງໝົດ', 'ລໍຖ້າ', 'ຢືນຢັນ', 'ກຳລັງກຽມ', 'ກຳລັງສົ່ງ', 'ສຳເລັດ', 'ຍົກເລີກ']
const TAB_STATUS = ['all', 'pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled']

// ── Timeline steps ────────────────────────────────────────────────────────────
const STEPS = [
  { key: 'pending',    icon: Clock,         label: 'ລໍຖ້າ',       note: 'ຮັບຄຳສັ່ງຊື້ສຳເລັດ' },
  { key: 'confirmed',  icon: CheckCircle2,  label: 'ຢືນຢັນ',      note: 'ທີມງານຢືນຢັນຄຳສັ່ງ' },
  { key: 'processing', icon: Package,       label: 'ກຽມສິນຄ້າ',   note: 'ກຳລັງຫຸ້ມຫໍ່ສິນຄ້າ' },
  { key: 'shipping',   icon: Truck,         label: 'ກຳລັງສົ່ງ',   note: 'ສິນຄ້າຢູ່ໃນທາງ' },
  { key: 'delivered',  icon: Navigation,    label: 'ຮອດແລ້ວ',     note: 'ສຳເລັດ ✓' },
]

const PROGRESS_PCT: Record<string, number> = {
  pending: 5, confirmed: 28, processing: 55, shipping: 80, delivered: 100, cancelled: 0
}

// ── Courier info ──────────────────────────────────────────────────────────────
const COURIER_INFO: Record<string, { phone: string; logo: string; color: string }> = {
  'ອານຸສິດ':  { phone: '021 253 888', logo: '/anousith.jpeg',   color: 'from-blue-500 to-blue-700' },
  'ຮຸ່ງອາລຸນ': { phone: '021 214 500', logo: '/houngaloun.jpeg', color: 'from-red-500 to-red-700' },
  'ມີໄຊ':     { phone: '021 282 822', logo: '/mixay.jpeg',       color: 'from-green-500 to-green-700' },
}

// ── Arrival estimate ──────────────────────────────────────────────────────────
function estimateArrival(createdAt: string, status: string): string {
  const d = new Date(createdAt)
  const daysMap: Record<string, number> = { pending: 5, confirmed: 4, processing: 3, shipping: 1, delivered: 0 }
  const days = daysMap[status] ?? 5
  d.setDate(d.getDate() + days)
  if (status === 'delivered') return 'ຮອດແລ້ວ ✓'
  if (status === 'cancelled') return 'ຍົກເລີກ'
  return d.toLocaleDateString('lo-LA', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ── Map placeholder ───────────────────────────────────────────────────────────
function MapPlaceholder({ status, courier }: { status: string; courier?: string }) {
  const pct = PROGRESS_PCT[status] ?? 0
  const markerPos = Math.max(8, Math.min(88, pct))
  return (
    <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-green-50 rounded-2xl overflow-hidden border border-blue-100" style={{ height: 160 }}>
      {/* Grid pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M 24 0 L 0 0 0 24" fill="none" stroke="#1247D8" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)"/>
      </svg>

      {/* Route road */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 160" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        {/* Road shadow */}
        <path d="M 30 130 Q 120 80 200 90 Q 280 100 370 40" fill="none" stroke="#E5E7EB" strokeWidth="12" strokeLinecap="round"/>
        {/* Road */}
        <path d="M 30 130 Q 120 80 200 90 Q 280 100 370 40" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round"/>
        {/* Completed portion */}
        <path d="M 30 130 Q 120 80 200 90 Q 280 100 370 40" fill="none" stroke="#1247D8" strokeWidth="4"
          strokeLinecap="round" strokeDasharray="500" strokeDashoffset={500 - (500 * pct / 100)}
          style={{ transition: 'stroke-dashoffset 1s ease' }}/>
        {/* Dashed center line */}
        <path d="M 30 130 Q 120 80 200 90 Q 280 100 370 40" fill="none" stroke="rgba(255,255,255,0.7)"
          strokeWidth="1.5" strokeDasharray="8 6" strokeLinecap="round"/>
      </svg>

      {/* Store icon (origin) */}
      <div className="absolute bottom-5 left-5 flex flex-col items-center">
        <div className="w-9 h-9 bg-[#1247D8] rounded-xl flex items-center justify-center shadow-lg shadow-blue-300">
          <Store size={18} className="text-white" />
        </div>
        <span className="text-[9px] font-bold text-[#1247D8] mt-1 bg-white px-1.5 py-0.5 rounded-full shadow-sm">ຄ້ານ</span>
      </div>

      {/* Destination */}
      <div className="absolute top-4 right-5 flex flex-col items-center">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-lg ${status === 'delivered' ? 'bg-green-500 shadow-green-300' : 'bg-gray-300'}`}>
          <MapPin size={18} className="text-white" />
        </div>
        <span className={`text-[9px] font-bold mt-1 bg-white px-1.5 py-0.5 rounded-full shadow-sm ${status === 'delivered' ? 'text-green-600' : 'text-gray-500'}`}>ທ່ານ</span>
      </div>

      {/* Moving truck marker */}
      {status !== 'delivered' && status !== 'cancelled' && (
        <div className="absolute" style={{ left: `${markerPos}%`, top: '50%', transform: 'translate(-50%, -50%)' }}>
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-xl shadow-orange-300 animate-bounce">
            <Truck size={18} className="text-white" />
          </div>
        </div>
      )}

      {/* Progress label */}
      <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-2.5 py-1.5 shadow-sm border border-gray-100">
        <p className="text-[10px] font-black text-[#1247D8]">{pct}% ເສັ້ນທາງ</p>
        {courier && <p className="text-[9px] text-gray-400">{courier}</p>}
      </div>
    </div>
  )
}

// ── Live Timeline ─────────────────────────────────────────────────────────────
function LiveTimeline({ status, logs, createdAt }: { status: string; logs: any[]; createdAt: string }) {
  const curIdx = STEPS.findIndex(s => s.key === status)
  const isCancelled = status === 'cancelled'

  return (
    <div className="space-y-0">
      {STEPS.map((step, i) => {
        const done    = !isCancelled && i < curIdx
        const active  = !isCancelled && i === curIdx
        const future  = isCancelled || i > curIdx
        const Icon    = step.icon

        // Find matching log entry
        const log = logs.find(l => l.status === step.key || l.note?.toLowerCase().includes(step.label.toLowerCase()))
        const time = log
          ? new Date(log.created_at).toLocaleString('lo-LA', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
          : active
          ? new Date(createdAt).toLocaleString('lo-LA', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })
          : null

        return (
          <div key={step.key} className="flex gap-3">
            {/* Line + dot column */}
            <div className="flex flex-col items-center">
              {/* Top connector */}
              <div className={`w-0.5 h-3 ${i === 0 ? 'bg-transparent' : done || active ? 'bg-[#1247D8]' : 'bg-gray-200'}`} />
              {/* Icon dot */}
              <div className={`relative flex items-center justify-center rounded-full shrink-0 transition-all duration-500
                ${done    ? 'w-8 h-8 bg-[#1247D8] shadow-md shadow-blue-200'
                  : active  ? 'w-9 h-9 bg-[#1247D8] shadow-lg shadow-blue-300 ring-4 ring-blue-100'
                  : 'w-8 h-8 bg-gray-100'}`}>
                {done ? (
                  <Check size={14} className="text-white" />
                ) : (
                  <Icon size={active ? 16 : 14} className={active ? 'text-white' : 'text-gray-400'} />
                )}
                {active && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-orange-400 rounded-full border-2 border-white animate-ping" />
                )}
              </div>
              {/* Bottom connector */}
              {i < STEPS.length - 1 && (
                <div className={`w-0.5 flex-1 min-h-6 ${done ? 'bg-[#1247D8]' : 'bg-gray-200'}`} />
              )}
            </div>

            {/* Content */}
            <div className={`flex-1 pb-4 pt-1 ${i === 0 ? 'pt-3' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-sm font-black leading-tight ${done || active ? 'text-gray-800' : 'text-gray-400'}`}>
                    {step.label}
                    {active && (
                      <span className="ml-2 text-[10px] bg-orange-100 text-orange-600 font-bold px-2 py-0.5 rounded-full animate-pulse">
                        ດຳເນີນການ
                      </span>
                    )}
                  </p>
                  <p className={`text-xs mt-0.5 ${done || active ? 'text-gray-500' : 'text-gray-300'}`}>
                    {step.note}
                  </p>
                </div>
                {time && (
                  <span className="text-[10px] text-gray-400 shrink-0 mt-0.5 text-right">{time}</span>
                )}
              </div>

              {/* Extra log details */}
              {logs.filter(l => l.note && !l.status).slice(0, i === curIdx ? 2 : 0).map((l, li) => (
                <div key={li} className="mt-1.5 bg-blue-50 rounded-xl px-3 py-2 text-xs text-blue-700">
                  {l.note}
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Cancelled state */}
      {isCancelled && (
        <div className="flex gap-3 items-center bg-red-50 rounded-xl p-3 mt-2">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-600">ຍົກເລີກ</p>
            <p className="text-xs text-red-400">ຄຳສັ່ງຊື້ຖືກຍົກເລີກ</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Driver / Courier card ─────────────────────────────────────────────────────
function DriverCard({ courier, trackingNumber, copied, onCopy }: {
  courier: string; trackingNumber?: string; copied: boolean; onCopy: () => void
}) {
  const info = COURIER_INFO[courier]
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        {info?.logo ? (
          <img src={info.logo} alt={courier} className="w-12 h-12 object-contain rounded-xl border border-gray-100 shrink-0" />
        ) : (
          <div className={`w-12 h-12 bg-gradient-to-br ${info?.color ?? 'from-gray-400 to-gray-600'} rounded-xl flex items-center justify-center shrink-0`}>
            <Truck size={22} className="text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="font-black text-sm text-gray-800">{courier}</p>
          <p className="text-xs text-gray-500">ບໍລິສັດຂົນສົ່ງ</p>
          {info?.phone && (
            <p className="text-xs text-[#1247D8] font-bold mt-0.5">{info.phone}</p>
          )}
        </div>
        {info?.phone && (
          <a href={`tel:${info.phone.replace(/\s/g, '')}`}
            className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-md shadow-green-200 hover:bg-green-600 transition-colors shrink-0">
            <Phone size={16} className="text-white" />
          </a>
        )}
      </div>
      {trackingNumber && (
        <div className="border-t border-gray-100 px-4 py-3 flex items-center gap-2 bg-gray-50">
          <Package size={13} className="text-gray-400 shrink-0" />
          <span className="text-xs text-gray-500 flex-1">ເລກຕິດຕາມ:</span>
          <span className="font-mono text-xs font-black text-gray-800">{trackingNumber}</span>
          <button onClick={onCopy}
            className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${copied ? 'bg-green-100 text-green-600' : 'bg-white text-gray-400 hover:bg-gray-100 border border-gray-200'}`}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Contact Seller card ───────────────────────────────────────────────────────
function ContactSeller({ orderId }: { orderId: string }) {
  const shortId = orderId.slice(0, 8).toUpperCase()
  const waMsg = encodeURIComponent(`ສະບາຍດີ BlueWhale 🐋 ຂ້ອຍຢາກຖາມກ່ຽວກັບຄຳສັ່ງຊື້ #${shortId}`)
  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Store size={15} className="text-[#1247D8]" />
        <p className="font-black text-sm text-gray-800">BlueWhale Official</p>
        <span className="text-[10px] bg-[#1247D8] text-white px-1.5 py-0.5 rounded-full font-bold">✓ ຮ້ານ</span>
      </div>
      <div className="flex gap-2">
        <a href={`https://wa.me/8562099999999?text=${waMsg}`} target="_blank" rel="noreferrer"
          className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white font-bold py-2.5 rounded-xl text-xs hover:bg-[#1da851] transition-colors">
          <MessageCircle size={14} /> WhatsApp
        </a>
        <a href="tel:+85620000000"
          className="flex-1 flex items-center justify-center gap-2 bg-[#1247D8] text-white font-bold py-2.5 rounded-xl text-xs hover:bg-[#0d35b0] transition-colors">
          <Phone size={14} /> ໂທ
        </a>
      </div>
      <p className="text-[10px] text-gray-400 text-center mt-2">ອ້າງອີງ: #{shortId}</p>
    </div>
  )
}

// ── Parse address ─────────────────────────────────────────────────────────────
function parseAddress(addr: string) {
  const parts = addr.split(' · ')
  return {
    name:     parts[0] ?? '',
    phone:    parts[1] ?? '',
    branch:   parts[2] ?? '',
    city:     parts[3] ?? '',
    province: parts[4] ?? '',
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const [orders, setOrders]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState(0)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied]   = useState<string | null>(null)
  const [user, setUser]       = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user)
      if (!data.user) { setLoading(false); return }

      const uid   = data.user.id
      const email = data.user.email ?? ''

      const { data: byId } = await supabase.from('orders')
        .select('*').eq('user_id', uid).order('created_at', { ascending: false })

      const { data: byEmail } = email
        ? await supabase.from('orders').select('*')
            .is('user_id', null).eq('customer_email', email)
            .order('created_at', { ascending: false })
        : { data: [] }

      const all    = [...(byId ?? []), ...(byEmail ?? [])]
      const unique = all.filter((o, i, arr) => arr.findIndex(x => x.id === o.id) === i)
      unique.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      const orphans = (byEmail ?? []).map(o => o.id)
      if (orphans.length) await supabase.from('orders').update({ user_id: uid }).in('id', orphans)

      setOrders(unique)
      setLoading(false)
    })
  }, [])

  const filtered = tab === 0 ? orders : orders.filter(o => o.status === TAB_STATUS[tab])
  const toggle   = (id: string) => setExpanded(e => e === id ? null : id)

  const copyTracking = (num: string, id: string) => {
    navigator.clipboard.writeText(num)
    setCopied(id)
    setTimeout(() => setCopied(null), 2500)
  }

  // ── Loading ──
  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
      <div className="w-8 h-8 border-2 border-[#1247D8] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm">ກຳລັງໂຫຼດ...</p>
    </div>
  )

  // ── Not logged in ──
  if (!user) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">📦</div>
      <p className="text-gray-600 font-bold mb-2">ກະລຸນາເຂົ້າສູ່ລະບົບ</p>
      <p className="text-gray-400 text-sm mb-6">ເພື່ອເບິ່ງປະຫວັດການສັ່ງຊື້ຂອງທ່ານ</p>
      <Link href="/login" className="bg-[#1247D8] text-white px-8 py-3 rounded-2xl font-bold hover:bg-[#0d35b0] transition-colors">
        ເຂົ້າສູ່ລະບົບ
      </Link>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <h1 className="text-xl font-black text-gray-800 flex items-center gap-2">
          <ClipboardList size={22} className="text-[#1247D8]" />
          ການສັ່ງຊື້ຂອງຂ້ອຍ
        </h1>
        {orders.length > 0 && (
          <span className="bg-[#1247D8] text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
            {orders.length}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 mb-5 scrollbar-hide">
        {TABS.map((t, i) => {
          const count = i === 0 ? orders.length : orders.filter(o => o.status === TAB_STATUS[i]).length
          return (
            <button key={t} onClick={() => setTab(i)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${tab === i ? 'bg-[#1247D8] text-white shadow-md shadow-blue-200' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}>
              {t}
              {count > 0 && (
                <span className={`text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center ${tab === i ? 'bg-white/30 text-white' : 'bg-gray-100 text-gray-500'}`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
            <ClipboardList size={36} className="text-[#1247D8]" />
          </div>
          <p className="text-gray-500 font-bold">ຍັງບໍ່ມີການສັ່ງຊື້</p>
          <Link href="/products"
            className="bg-[#1247D8] text-white px-6 py-2.5 rounded-2xl font-bold hover:bg-[#0d35b0] transition-colors">
            ເລືອກຊື້ສິນຄ້າ
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(o => {
            const isOpen  = expanded === o.id
            const items   = Array.isArray(o.items) ? o.items : []
            const logs    = Array.isArray(o.tracking_logs) ? o.tracking_logs : []
            const total   = o.total ?? o.total_amount ?? 0
            const pct     = PROGRESS_PCT[o.status] ?? 0
            const addr    = o.address ? parseAddress(o.address) : null
            const isCancelled = o.status === 'cancelled'
            const isActive = ['confirmed', 'processing', 'shipping'].includes(o.status)

            return (
              <div key={o.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                {/* ── Card header ── */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-black text-sm text-gray-800">#{o.id.slice(0, 8).toUpperCase()}</p>
                        {isActive && (
                          <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping inline-block" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(o.created_at).toLocaleDateString('lo-LA', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[#1247D8] text-base">{fmt(total)}</p>
                      <p className="text-xs text-gray-400">{METHOD_LAO[o.payment_method] ?? o.payment_method}</p>
                    </div>
                  </div>

                  {/* Status badge + estimated arrival */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS_COLOR[o.status] ?? 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                      <CircleDot size={10} />
                      {STATUS_LAO[o.status] ?? o.status}
                    </span>
                    {!isCancelled && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Clock size={11} className="text-[#1247D8]" />
                        <span className="font-bold">{estimateArrival(o.created_at, o.status)}</span>
                      </div>
                    )}
                  </div>

                  {/* ── Delivery Progress Bar ── */}
                  {!isCancelled && (
                    <div className="mb-4">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1.5 font-medium">
                        <span>ຄ້ານ</span>
                        <span className="font-bold text-[#1247D8]">{pct}%</span>
                        <span>ທ່ານ</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden shadow-inner relative">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 relative ${o.status === 'delivered' ? 'bg-gradient-to-r from-green-400 to-green-500' : 'bg-gradient-to-r from-[#1247D8] to-blue-400'}`}
                          style={{ width: `${pct}%` }}>
                          {pct > 0 && pct < 100 && (
                            <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/40 rounded-full animate-pulse" />
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between mt-1.5">
                        {STEPS.map((s, i) => {
                          const stepPct = (i / (STEPS.length - 1)) * 100
                          const active  = Math.abs(stepPct - pct) < 15
                          const done    = stepPct <= pct
                          return (
                            <div key={s.key} className={`text-[9px] font-bold transition-colors ${done ? active ? 'text-[#1247D8]' : 'text-[#1247D8]/60' : 'text-gray-300'}`}>
                              {i === 0 ? '🏪' : i === 4 ? '🏠' : done ? '✓' : '○'}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* ── Map placeholder (shipping/delivered only) ── */}
                  {(o.status === 'shipping' || o.status === 'delivered') && (
                    <div className="mb-4">
                      <MapPlaceholder status={o.status} courier={o.courier} />
                    </div>
                  )}

                  {/* ── Driver / Courier card ── */}
                  {o.courier && (
                    <div className="mb-4">
                      <DriverCard
                        courier={o.courier}
                        trackingNumber={o.tracking_number}
                        copied={copied === o.id}
                        onCopy={() => copyTracking(o.tracking_number, o.id)}
                      />
                    </div>
                  )}

                  {/* ── Estimated arrival card (detailed) ── */}
                  {!isCancelled && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-blue-50 rounded-xl p-2.5 text-center col-span-1">
                        <Clock size={14} className="text-[#1247D8] mx-auto mb-1" />
                        <p className="text-[9px] text-gray-400 font-bold">ສັ່ງວັນທີ</p>
                        <p className="text-[10px] font-black text-gray-700">
                          {new Date(o.created_at).toLocaleDateString('lo-LA', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="bg-orange-50 rounded-xl p-2.5 text-center col-span-1">
                        <Truck size={14} className="text-orange-500 mx-auto mb-1" />
                        <p className="text-[9px] text-gray-400 font-bold">ສະຖານະ</p>
                        <p className="text-[10px] font-black text-orange-600">
                          {STATUS_LAO[o.status]?.replace('ກຳລັງ', '') ?? '-'}
                        </p>
                      </div>
                      <div className={`rounded-xl p-2.5 text-center col-span-1 ${o.status === 'delivered' ? 'bg-green-50' : 'bg-amber-50'}`}>
                        <Navigation size={14} className={`mx-auto mb-1 ${o.status === 'delivered' ? 'text-green-500' : 'text-amber-500'}`} />
                        <p className="text-[9px] text-gray-400 font-bold">ຄາດຮອດ</p>
                        <p className={`text-[10px] font-black ${o.status === 'delivered' ? 'text-green-600' : 'text-amber-600'}`}>
                          {o.status === 'delivered' ? 'ຮອດແລ້ວ ✓' : estimateArrival(o.created_at, o.status)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Address ── */}
                  {addr && (
                    <div className="bg-gray-50 rounded-xl px-3 py-2.5 mb-4">
                      <div className="flex items-start gap-2">
                        <MapPin size={13} className="text-[#1247D8] shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-700">{addr.name} · {addr.phone}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {[addr.branch, addr.city, addr.province].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Live Timeline ── */}
                  <div className="mb-4">
                    <p className="text-xs font-black text-gray-500 mb-3 flex items-center gap-1.5">
                      <span className="w-1 h-3 bg-[#1247D8] rounded-full inline-block" />
                      ສະຖານະການຈັດສົ່ງ
                    </p>
                    <LiveTimeline status={o.status} logs={logs} createdAt={o.created_at} />
                  </div>

                  {/* ── Custom tracking logs ── */}
                  {logs.filter(l => l.note).length > 0 && (
                    <div className="mb-4 bg-blue-50 rounded-xl p-3 space-y-2">
                      <p className="text-[10px] font-black text-blue-600 mb-2">📋 ອັບເດດຈາກຮ້ານ</p>
                      {[...logs].reverse().filter(l => l.note).map((log, i) => (
                        <div key={i} className="flex gap-2.5 items-start">
                          <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${i === 0 ? 'bg-[#1247D8]' : 'bg-blue-200'}`} />
                          <div>
                            <p className={`text-xs ${i === 0 ? 'text-gray-800 font-bold' : 'text-gray-500'}`}>{log.note}</p>
                            <p className="text-[10px] text-gray-400">
                              {new Date(log.created_at).toLocaleString('lo-LA', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Contact Seller ── */}
                  <ContactSeller orderId={o.id} />

                  {/* ── Slips ── */}
                  {(o.receipt_url || o.shipping_slip_url) && (
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      {o.receipt_url && (
                        <div>
                          <p className="text-[10px] text-gray-400 mb-1.5 font-bold">📎 ສະລິບຂອງຂ້ອຍ</p>
                          <a href={o.receipt_url} target="_blank" rel="noreferrer" className="block">
                            <img src={o.receipt_url} alt="Receipt" className="w-full h-20 object-cover rounded-xl border border-gray-200 hover:opacity-90 transition-opacity" />
                          </a>
                        </div>
                      )}
                      {o.shipping_slip_url && (
                        <div>
                          <p className="text-[10px] text-gray-400 mb-1.5 font-bold">🚚 ໃບຝາກ</p>
                          <a href={o.shipping_slip_url} target="_blank" rel="noreferrer" className="block">
                            <img src={o.shipping_slip_url} alt="Shipping" className="w-full h-20 object-cover rounded-xl border border-green-200 hover:opacity-90 transition-opacity" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Items expand ── */}
                {items.length > 0 && (
                  <>
                    <button onClick={() => toggle(o.id)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 border-t border-gray-100 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                      <span className="flex items-center gap-2">
                        <Package size={14} className="text-gray-400" />
                        ສິນຄ້າ {items.length} ລາຍການ
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="text-xs text-[#1247D8] font-bold">{fmt(total)}</span>
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 border-t border-gray-100">
                        <div className="space-y-2.5 pt-3">
                          {items.map((item: any, i: number) => {
                            const name = item.product_name || item.name || 'ສິນຄ້າ'
                            const qty  = item.quantity || item.qty || 1
                            const price = item.price ?? 0
                            return (
                              <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 text-sm">📦</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-gray-700 font-medium line-clamp-1">{name}</p>
                                  <p className="text-xs text-gray-400">{fmt(price)} × {qty}</p>
                                </div>
                                <p className="text-sm font-black text-gray-800 shrink-0">{fmt(price * qty)}</p>
                              </div>
                            )
                          })}
                        </div>
                        <div className="border-t mt-3 pt-3 flex justify-between font-black">
                          <span className="text-gray-600 text-sm">ລວມທັງໝົດ</span>
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
