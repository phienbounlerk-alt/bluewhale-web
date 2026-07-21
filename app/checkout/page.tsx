'use client'
import { useCart } from '@/store/cart'
import { fmt, supabase } from '@/lib/supabase'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  CheckCircle, MapPin, Phone, User, Upload, Building2,
  Tag, X, ShoppingBag, Truck, Clock, ChevronRight,
  ArrowLeft, Package
} from 'lucide-react'
import Image from 'next/image'
import { PROVINCES, PROVINCE_LIST } from '@/lib/laos-locations'
import SelectDropdown from '@/components/ui/SelectDropdown'
import { Suspense } from 'react'

const FREE = 200000, SHIP = 20000

// ── Validation helpers ────────────────────────────────────────────────────────
function validatePhone(v: string) {
  const digits = v.replace(/\D/g, '')
  if (!v.trim()) return 'ກະລຸນາໃສ່ເບີໂທ'
  if (digits.length < 8 || digits.length > 12) return 'ເບີໂທຕ້ອງ 8–12 ຕົວເລກ'
  return ''
}
function validateName(v: string) {
  if (!v.trim()) return 'ກະລຸນາໃສ່ຊື່ຜູ້ຮັບ'
  if (v.trim().length < 2) return 'ຊື່ຕ້ອງຢ່າງໜ້ອຍ 2 ຕົວ'
  return ''
}

// ── Payment method icon badges ────────────────────────────────────────────────
function PaymentBadges() {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {[
        { label: 'BCEL One', color: 'bg-blue-600' },
        { label: 'JDB', color: 'bg-red-600' },
        { label: 'LDB', color: 'bg-green-700' },
        { label: 'BIC', color: 'bg-orange-600' },
        { label: 'Visa', color: 'bg-[#1A1F71]' },
        { label: 'Mastercard', color: 'bg-[#EB001B]' },
      ].map(b => (
        <span key={b.label} className={`${b.color} text-white text-[9px] font-black px-2 py-1 rounded-md`}>
          {b.label}
        </span>
      ))}
    </div>
  )
}

// ── Step indicator ────────────────────────────────────────────────────────────
function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = [
    { n: 1, label: 'ທີ່ຢູ່' },
    { n: 2, label: 'ຊຳລະ' },
    { n: 3, label: 'ຢືນຢັນ' },
  ]
  return (
    <div className="flex items-center gap-2 mb-6">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-2 flex-1">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 transition-colors
            ${current >= s.n ? 'bg-[#1247D8] text-white' : 'bg-gray-100 text-gray-400'}`}>
            {current > s.n ? '✓' : s.n}
          </div>
          <span className={`text-xs font-bold hidden sm:block ${current >= s.n ? 'text-[#1247D8]' : 'text-gray-400'}`}>
            {s.label}
          </span>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 rounded-full ${current > s.n ? 'bg-[#1247D8]' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Success page ──────────────────────────────────────────────────────────────
function SuccessPage({ orderId, items, grand }: { orderId: string; items: any[]; grand: number }) {
  const deliveryDate = () => {
    const d = new Date(); d.setDate(d.getDate() + 3)
    return d.toLocaleDateString('lo-LA', { weekday: 'long', day: 'numeric', month: 'long' })
  }
  return (
    <div className="max-w-md mx-auto px-4 py-10">
      {/* Success animation */}
      <div className="text-center mb-8">
        <div className="relative inline-flex">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center animate-bounce-slow">
            <CheckCircle size={52} className="text-green-500" />
          </div>
          <span className="absolute -top-1 -right-1 text-2xl animate-spin-slow">🎉</span>
        </div>
        <h2 className="text-2xl font-black text-gray-800 mt-4 mb-1">ສັ່ງຊື້ສຳເລັດ!</h2>
        <p className="text-gray-500 text-sm">ຂອບໃຈທີ່ໃຊ້ BlueWhale 🐋</p>
      </div>

      {/* Order ID */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4 text-center">
        <p className="text-xs text-blue-500 font-bold mb-1">ລະຫັດຄຳສັ່ງຊື້</p>
        <p className="font-black text-[#1247D8] text-sm tracking-wider">#{orderId.slice(0, 8).toUpperCase()}</p>
      </div>

      {/* Items ordered */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-4">
        <p className="text-xs font-black text-gray-500 mb-3 flex items-center gap-1.5">
          <ShoppingBag size={12} /> ລາຍການທີ່ສັ່ງ
        </p>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-700 line-clamp-1 flex-1 mr-2">
                {item.product_name} <span className="text-gray-400">×{item.quantity}</span>
              </span>
              <span className="font-bold text-gray-800 shrink-0">{fmt(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="border-t mt-3 pt-3 flex justify-between font-black">
          <span className="text-gray-700">ລວມທັງໝົດ</span>
          <span className="text-[#1247D8] text-lg">{fmt(grand)}</span>
        </div>
      </div>

      {/* Estimated delivery */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
            <Clock size={15} className="text-orange-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-600">ຄາດການຮອດ</p>
            <p className="text-sm font-black text-gray-800">{deliveryDate()}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
            <Package size={15} className="text-green-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-600">ສະຖານະ</p>
            <p className="text-sm font-black text-orange-500">🕐 ລໍຖ້າຢືນຢັນ</p>
          </div>
        </div>
      </div>

      {/* What's next */}
      <div className="bg-gray-50 rounded-2xl p-4 mb-6">
        <p className="text-xs font-black text-gray-500 mb-3">ຂັ້ນຕອນຕໍ່ໄປ</p>
        {[
          '1. ທີມງານຈະໂທຢືນຢັນຄຳສັ່ງຊື້',
          '2. ສິນຄ້າຈະຖືກຈັດສົ່ງທາງຂົນສົ່ງ',
          '3. ທ່ານຈະໄດ້ຮັບລະຫັດຕິດຕາມ',
        ].map((s, i) => (
          <p key={i} className="text-xs text-gray-600 py-1.5 border-b border-gray-100 last:border-0">{s}</p>
        ))}
      </div>

      <div className="flex gap-3">
        <Link href="/orders"
          className="flex-1 flex items-center justify-center gap-2 border-2 border-[#1247D8] text-[#1247D8] font-bold py-3.5 rounded-2xl hover:bg-blue-50 transition-colors text-sm">
          ຕິດຕາມຄຳສັ່ງ
        </Link>
        <Link href="/"
          className="flex-1 flex items-center justify-center gap-2 bg-[#1247D8] text-white font-bold py-3.5 rounded-2xl hover:bg-[#0d35b0] transition-colors text-sm">
          ໜ້າຫຼັກ <ChevronRight size={14} />
        </Link>
      </div>
    </div>
  )
}

// ── Main checkout component ───────────────────────────────────────────────────
function CheckoutInner() {
  const { items, total, clear } = useCart()
  const router   = useRouter()
  const params   = useSearchParams()
  const subtotal = total()
  const shipping = subtotal >= FREE ? 0 : SHIP

  // Voucher from cart page URL params
  const [voucherCode, setVoucherCode] = useState(params.get('voucher') ?? '')
  const [voucherObj,  setVoucherObj]  = useState<any>(null)
  const [voucherErr,  setVoucherErr]  = useState('')
  const [checkingV,   setCheckingV]   = useState(false)
  const [voucherDiscount, setVoucherDiscount] = useState(Number(params.get('discount') ?? 0))

  const grand = Math.max(0, subtotal - voucherDiscount) + shipping

  const [method,        setMethod]        = useState('')
  const [courier,       setCourier]       = useState('')
  const [customCourier, setCustomCourier] = useState('')
  const [doneData,      setDoneData]      = useState<{ orderId: string; items: any[]; grand: number } | null>(null)
  const [loading,       setLoading]       = useState(false)
  const [uploading,     setUploading]     = useState(false)
  const [authChecked,   setAuthChecked]   = useState(false)
  const [form,          setForm]          = useState({ name: '', phone: '', branch: '', city: '', province: '' })
  const [errors,        setErrors]        = useState<Record<string, string>>({})
  const [touched,       setTouched]       = useState<Record<string, boolean>>({})
  const [settings,      setSettings]      = useState({ cod_enabled: true, qr_enabled: false, qr_image_url: null as string | null })
  const [receiptUrl,    setReceiptUrl]    = useState<string | null>(null)
  const [submitAttempt, setSubmitAttempt] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const setField = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.replace('/login?redirect=/checkout')
      else setAuthChecked(true)
    })
    supabase.from('payment_settings').select('*').eq('id', 1).single()
      .then(({ data }) => {
        if (data) {
          setSettings(data)
          if (data.cod_enabled) setMethod('cod')
          else if (data.qr_enabled) setMethod('qr')
        }
      })
  }, [])

  // Auto-apply voucher from URL
  useEffect(() => {
    if (params.get('voucher') && params.get('discount')) {
      setVoucherCode(params.get('voucher')!)
      setVoucherDiscount(Number(params.get('discount')))
    }
  }, [])

  // Real-time validation
  const validate = useCallback((field: string, value: string) => {
    if (field === 'name')   return validateName(value)
    if (field === 'phone')  return validatePhone(value)
    if (field === 'province') return value ? '' : 'ກະລຸນາເລືອກແຂວງ'
    if (field === 'city')     return value ? '' : 'ກະລຸນາເລືອກເມືອງ'
    if (field === 'branch')   return value.trim() ? '' : 'ກະລຸນາໃສ່ສາຂາ / ບ້ານ'
    return ''
  }, [])

  const handleBlur = (field: string) => {
    setTouched(t => ({ ...t, [field]: true }))
    setErrors(e => ({ ...e, [field]: validate(field, form[field as keyof typeof form]) }))
  }

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return
    setCheckingV(true); setVoucherErr('')
    const { data } = await supabase.from('vouchers')
      .select('*').eq('code', voucherCode.trim().toUpperCase()).eq('is_active', true).single()
    if (!data) { setVoucherErr('ໂຄດບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸ'); setCheckingV(false); return }
    if (data.uses_left <= 0) { setVoucherErr('ໂຄດນີ້ໃຊ້ຄົບແລ້ວ'); setCheckingV(false); return }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setVoucherErr('ໂຄດໝົດອາຍຸ'); setCheckingV(false); return }
    if (subtotal < data.min_order) { setVoucherErr(`ຕ້ອງຊື້ຂັ້ນຕ່ຳ ${fmt(data.min_order)}`); setCheckingV(false); return }
    let disc = data.discount_type === 'percent'
      ? Math.round(subtotal * data.discount_value / 100)
      : data.discount_value
    if (data.max_discount) disc = Math.min(disc, data.max_discount)
    setVoucherObj(data); setVoucherDiscount(disc); setCheckingV(false)
  }

  const removeVoucher = () => { setVoucherObj(null); setVoucherCode(''); setVoucherDiscount(0); setVoucherErr('') }

  // ── Upload receipt (unchanged logic) ──
  const uploadReceipt = async (file: File) => {
    setUploading(true)
    const ext  = file.name.split('.').pop()
    const path = `receipts/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('products').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('products').getPublicUrl(path)
      setReceiptUrl(data.publicUrl)
    }
    setUploading(false)
  }

  // ── Submit (core unchanged) ──
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitAttempt(true)

    // Validate all fields
    const newErrors: Record<string, string> = {}
    Object.keys(form).forEach(k => {
      const err = validate(k, form[k as keyof typeof form])
      if (err) newErrors[k] = err
    })
    setErrors(newErrors)
    setTouched({ name: true, phone: true, branch: true, city: true, province: true })

    if (Object.keys(newErrors).length) return
    if (!form.name || !form.phone || !form.branch || !form.city || !form.province || !method || !courier) {
      if (!courier) { alert('ກະລຸນາເລືອກບໍລິສັດຂົນສົ່ງ'); return }
      return
    }
    if (courier === 'other' && !customCourier.trim()) { alert('ກະລຸນາພິມຊື່ບໍລິສັດຂົນສົ່ງ'); return }
    if (method === 'qr' && !receiptUrl) { alert('ກະລຸນາ upload ສະລິບໂອນເງິນກ່ອນ'); return }

    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const orderId = crypto.randomUUID()
    const orderItems = items.map(i => ({
      product_id:   i.product.id,
      product_name: i.product.name,
      quantity:     i.quantity,
      price:        i.product.discount_price ?? i.product.price,
    }))
    const { error } = await supabase.from('orders').insert({
      id:               orderId,
      user_id:          user?.id ?? null,
      customer_email:   user?.email ?? null,
      address:          `${form.name} · ${form.phone} · ${form.branch} · ${form.city} · ${form.province}`,
      payment_method:   method,
      courier:          courier === 'other' ? customCourier : courier,
      receipt_url:      receiptUrl ?? '',
      items:            orderItems,
      total_amount:     grand,
      status:           'pending',
    })
    if (error) { console.error('Order error:', error); setLoading(false); alert('ສັ່ງຊື້ລົ້ມເຫລວ: ' + error.message); return }
    setLoading(false)
    clear()
    setDoneData({ orderId, items: orderItems, grand })
  }

  // ── States ──
  if (doneData) return <SuccessPage {...doneData} />
  if (!authChecked) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-[#1247D8] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (items.length === 0) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">🛒</div>
      <p className="text-gray-500 mb-4 font-bold">ກະຕ່າຫວ່າງ</p>
      <Link href="/products" className="inline-flex items-center gap-2 bg-[#1247D8] text-white font-bold px-8 py-3 rounded-2xl hover:bg-[#0d35b0] transition-colors">
        <ShoppingBag size={16} /> ເລືອກຊື້ສິນຄ້າ
      </Link>
    </div>
  )

  const methods = [
    settings.cod_enabled && { id: 'cod', label: 'COD — ຈ່າຍປາຍທາງ', icon: '💵', desc: 'ຈ່າຍເມື່ອໄດ້ຮັບສິນຄ້າ' },
    settings.qr_enabled && settings.qr_image_url && { id: 'qr', label: 'ໂອນເງິນ / QR', icon: '📱', desc: 'ສະແກນ QR ຫຼື ໂອນ BCEL One, JDB, LDB' },
  ].filter(Boolean) as { id: string; label: string; icon: string; desc: string }[]

  // Field component helper
  const Field = ({
    field, icon, placeholder, type = 'text',
  }: { field: keyof typeof form; icon: React.ReactNode; placeholder: string; type?: string }) => {
    const err = (touched[field] || submitAttempt) && errors[field]
    return (
      <div>
        <div className={`flex items-center border-2 rounded-xl overflow-hidden transition-colors ${err ? 'border-red-400 bg-red-50' : form[field] ? 'border-[#1247D8]/50 bg-white' : 'border-gray-200 bg-white'}`}>
          <span className={`mx-3 shrink-0 ${err ? 'text-red-400' : 'text-gray-400'}`}>{icon}</span>
          <input
            value={form[field]}
            onChange={e => setField(field, e.target.value)}
            onBlur={() => handleBlur(field)}
            required
            placeholder={placeholder}
            type={type}
            className="flex-1 py-3.5 pr-4 outline-none text-sm bg-transparent"
          />
          {form[field] && !err && (
            <span className="mr-3 text-green-500 text-sm">✓</span>
          )}
        </div>
        {err && <p className="text-red-500 text-xs mt-1 pl-1">{err}</p>}
      </div>
    )
  }

  const canSubmit = !loading && !!method && !uploading && !!courier
  const itemCount = items.reduce((s, i) => s + i.quantity, 0)

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-32 md:pb-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/cart" className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors shrink-0">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-xl font-black text-gray-800">ຊຳລະເງີນ</h1>
      </div>

      <Steps current={2} />

      <form onSubmit={submit} className="grid md:grid-cols-3 gap-5">
        {/* ── LEFT COLUMN ── */}
        <div className="md:col-span-2 space-y-4">

          {/* Delivery address */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-black text-gray-800 mb-4 flex items-center gap-2 text-base">
              <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                <MapPin size={14} className="text-[#1247D8]" />
              </div>
              ທີ່ຢູ່ຈັດສົ່ງ
            </h2>
            <div className="space-y-3">
              <Field field="name" icon={<User size={16} />} placeholder="ຊື່ຜູ້ຮັບ *" />
              <Field field="phone" icon={<Phone size={16} />} placeholder="ເບີໂທ * (020XXXXXXXX)" type="tel" />

              {/* Province */}
              <div>
                <SelectDropdown
                  value={form.province}
                  onChange={v => { setField('province', v); setField('city', ''); setTouched(t => ({ ...t, province: true })) }}
                  options={PROVINCE_LIST}
                  placeholder="ເລືອກແຂວງ *"
                  icon={<MapPin size={16} />}
                />
                {(touched.province || submitAttempt) && errors.province && (
                  <p className="text-red-500 text-xs mt-1 pl-1">{errors.province}</p>
                )}
              </div>

              {/* City */}
              <div>
                <SelectDropdown
                  value={form.city}
                  onChange={v => { setField('city', v); setTouched(t => ({ ...t, city: true })) }}
                  options={PROVINCES[form.province] ?? []}
                  placeholder={form.province ? 'ເລືອກເມືອງ *' : 'ເລືອກແຂວງກ່ອນ'}
                  disabled={!form.province}
                  icon={<MapPin size={16} />}
                />
                {(touched.city || submitAttempt) && errors.city && (
                  <p className="text-red-500 text-xs mt-1 pl-1">{errors.city}</p>
                )}
              </div>

              <Field field="branch" icon={<Building2 size={16} />} placeholder="ສາຂາ / ບ້ານ *" />
            </div>
          </div>

          {/* Courier selection */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-black text-gray-800 mb-4 flex items-center gap-2 text-base">
              <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
                <Truck size={14} className="text-orange-500" />
              </div>
              ເລືອກຂົນສົ່ງ
            </h2>
            {(submitAttempt && !courier) && (
              <p className="text-red-500 text-xs mb-3 bg-red-50 px-3 py-2 rounded-xl">⚠️ ກະລຸນາເລືອກບໍລິສັດຂົນສົ່ງ</p>
            )}
            <div className="grid grid-cols-4 gap-2.5">
              {[
                { id: 'ອານຸສິດ',  img: '/anousith.jpeg',   fee: '₭15k–35k' },
                { id: 'ຮຸ່ງອາລຸນ', img: '/houngaloun.jpeg', fee: '₭12k–30k' },
                { id: 'ມີໄຊ',     img: '/mixay.jpeg',       fee: '₭10k–28k' },
              ].map(c => (
                <button key={c.id} type="button" onClick={() => setCourier(c.id)}
                  className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all active:scale-95 ${courier === c.id ? 'border-[#1247D8] bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                  <img src={c.img} alt={c.id} className="w-14 h-14 object-contain rounded-lg" />
                  <span className="text-[11px] font-bold text-gray-700 text-center leading-tight">{c.id}</span>
                  <span className="text-[9px] text-gray-400">{c.fee}</span>
                  {courier === c.id && <span className="text-[9px] text-[#1247D8] font-black bg-blue-100 px-1.5 py-0.5 rounded-full">✓ ເລືອກ</span>}
                </button>
              ))}
              {/* Other */}
              <button type="button" onClick={() => setCourier('other')}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all active:scale-95 ${courier === 'other' ? 'border-[#1247D8] bg-blue-50 shadow-md' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                <div className="w-14 h-14 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-300">
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                </div>
                <span className="text-[11px] font-bold text-gray-700">ອື່ນໆ</span>
                <span className="text-[9px] text-gray-400 invisible">-</span>
                {courier === 'other' && <span className="text-[9px] text-[#1247D8] font-black bg-blue-100 px-1.5 py-0.5 rounded-full">✓ ເລືອກ</span>}
              </button>
            </div>
            {courier === 'other' && (
              <input
                value={customCourier}
                onChange={e => setCustomCourier(e.target.value)}
                placeholder="ພິມຊື່ບໍລິສັດຂົນສົ່ງ..."
                className="mt-3 w-full border-2 border-[#1247D8] rounded-xl px-4 py-3 text-sm outline-none bg-blue-50"
                autoFocus
              />
            )}
            {/* Delivery estimate */}
            {courier && (
              <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                <Clock size={12} className="text-[#1247D8] shrink-0" />
                <span>ຄາດການຮອດ <span className="font-bold text-gray-700">1–5 ວັນລັດຖະການ</span> ຂຶ້ນກັບທ້ອງຖິ່ນ</span>
              </div>
            )}
          </div>

          {/* Payment method */}
          {methods.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-black text-gray-800 mb-4 flex items-center gap-2 text-base">
                <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center shrink-0">
                  <span className="text-sm">💳</span>
                </div>
                ວິທີຊຳລະ
              </h2>
              <div className="space-y-2">
                {methods.map(m => (
                  <label key={m.id}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all active:scale-[0.99] ${method === m.id ? 'border-[#1247D8] bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="text-[#1247D8] shrink-0" />
                    <span className="text-xl shrink-0">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm text-gray-800">{m.label}</div>
                      <div className="text-xs text-gray-500">{m.desc}</div>
                      {m.id === 'qr' && <PaymentBadges />}
                    </div>
                    {method === m.id && (
                      <span className="w-5 h-5 bg-[#1247D8] rounded-full flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-black">✓</span>
                      </span>
                    )}
                  </label>
                ))}
              </div>

              {/* QR + upload slip */}
              {method === 'qr' && settings.qr_image_url && (
                <div className="mt-4 space-y-4 border-t pt-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-3 font-bold">ສະແກນ QR ຊຳລະ</p>
                    <div className="inline-block border-4 border-[#1247D8]/20 rounded-2xl overflow-hidden">
                      <img src={settings.qr_image_url} alt="QR Payment" className="w-48 h-48 object-contain" />
                    </div>
                    <div className="mt-3 inline-block bg-[#1247D8] text-white font-black px-6 py-2 rounded-xl text-sm">
                      ຈຳນວນ: {fmt(grand)}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-2">📎 ອັບໂຫລດສະລິບໂອນເງິນ <span className="text-red-500">*</span></p>
                    {receiptUrl ? (
                      <div>
                        <img src={receiptUrl} alt="Receipt" className="w-full max-h-48 object-contain border-2 border-green-200 rounded-xl bg-green-50" />
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-green-600 font-bold">✅ ອັບໂຫລດສຳເລັດ</p>
                          <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-[#1247D8] hover:underline">ປ່ຽນ</button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-[#1247D8] hover:bg-blue-50 transition-colors">
                        <Upload size={24} className="text-gray-300" />
                        <span className="text-sm font-bold text-gray-400">{uploading ? '⏳ ກຳລັງອັບໂຫລດ...' : 'ກົດເພື່ອອັບໂຫລດສະລິບ'}</span>
                        <span className="text-xs text-gray-300">PNG, JPG, HEIC</span>
                      </button>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadReceipt(f) }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Items summary */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-black text-gray-800 mb-4 flex items-center gap-2 text-base">
              <div className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                <ShoppingBag size={14} className="text-gray-500" />
              </div>
              ລາຍການ ({itemCount} ຊິ້ນ)
            </h2>
            <div className="space-y-3">
              {items.map(({ product: p, quantity }) => {
                const price = p.discount_price ?? p.price
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {p.image_url
                        ? <Image src={p.image_url} alt={p.name} fill className="object-cover" unoptimized />
                        : <div className="w-full h-full flex items-center justify-center text-lg">📦</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 line-clamp-1">{p.name}</p>
                      <p className="text-xs text-gray-400">{fmt(price)} × {quantity}</p>
                    </div>
                    <p className="text-sm font-black text-gray-800 shrink-0">{fmt(price * quantity)}</p>
                  </div>
                )
              })}
            </div>
          </div>

        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-24 space-y-4">
            <h2 className="font-black text-gray-800">ສະຫຼຸບ</h2>

            {/* Coupon */}
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1"><Tag size={11} /> ໂຄດສ່ວນຫຼຸດ</p>
              {(voucherObj || params.get('voucher')) && voucherDiscount > 0 ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                  <div>
                    <p className="text-green-700 font-black text-sm">{voucherCode}</p>
                    <p className="text-green-600 text-xs">-{fmt(voucherDiscount)}</p>
                  </div>
                  <button type="button" onClick={removeVoucher}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={voucherCode} onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && applyVoucher()}
                    placeholder="ໃສ່ໂຄດ..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1247D8] uppercase transition-colors" />
                  <button type="button" onClick={applyVoucher} disabled={checkingV || !voucherCode.trim()}
                    className="px-3 bg-[#1247D8] text-white rounded-xl text-xs font-bold hover:bg-[#0d35b0] disabled:opacity-50 transition-colors">
                    {checkingV ? '...' : 'ໃຊ້'}
                  </button>
                </div>
              )}
              {voucherErr && <p className="text-red-500 text-xs mt-1">{voucherErr}</p>}
            </div>

            {/* Price breakdown */}
            <div className="space-y-2.5 text-sm border-t pt-3">
              <div className="flex justify-between text-gray-600">
                <span>ສິນຄ້າ ({itemCount})</span>
                <span>{fmt(subtotal)}</span>
              </div>
              {voucherDiscount > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>ສ່ວນຫຼຸດ</span>
                  <span>-{fmt(voucherDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>ຄ່າສົ່ງ</span>
                <span className={shipping === 0 ? 'text-green-500 font-bold' : ''}>{shipping === 0 ? 'ຟຣີ 🎉' : fmt(shipping)}</span>
              </div>
              <div className="border-t pt-2.5 flex justify-between font-black text-xl">
                <span className="text-gray-800">ລວມ</span>
                <span className="text-[#1247D8]">{fmt(grand)}</span>
              </div>
            </div>

            {/* Desktop submit button */}
            <button type="submit" disabled={!canSubmit}
              className={`hidden md:block w-full font-black py-4 rounded-2xl transition-all text-sm ${canSubmit ? 'bg-gradient-to-r from-[#1247D8] to-[#1e5df0] text-white hover:from-[#0d35b0] shadow-lg shadow-blue-200 active:scale-[0.98]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ກຳລັງສົ່ງ...
                </span>
              ) : '✓ ຢືນຢັນການສັ່ງຊື້'}
            </button>

            <Link href="/cart" className="hidden md:block w-full text-center text-gray-400 text-xs hover:underline">
              ← ກັບໄປກະຕ່າ
            </Link>

            {/* Trust badges */}
            <div className="border-t pt-3 grid grid-cols-3 gap-2 text-center">
              {[
                { icon: '🔒', label: 'ປອດໄພ' },
                { icon: '🔄', label: 'ຄືນ 7 ວັນ' },
                { icon: '💵', label: 'COD ໄດ້' },
              ].map(b => (
                <div key={b.label} className="bg-gray-50 rounded-xl py-2 px-1">
                  <span className="text-base">{b.icon}</span>
                  <p className="text-[9px] text-gray-500 font-bold mt-0.5">{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </form>

      {/* ── STICKY BOTTOM BAR (mobile only) ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 shadow-2xl">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-xs text-gray-500">{itemCount} ລາຍການ{voucherDiscount > 0 ? ' · ສ່ວນຫຼຸດ -' + fmt(voucherDiscount) : ''}</p>
            <p className="font-black text-xl text-[#1247D8]">{fmt(grand)}</p>
          </div>
          <button
            type="button"
            form="checkout-form"
            disabled={!canSubmit}
            onClick={submit as any}
            className={`flex items-center gap-2 font-black px-7 py-3.5 rounded-2xl transition-all text-sm ${canSubmit ? 'bg-gradient-to-r from-[#1247D8] to-[#1e5df0] text-white active:scale-[0.97] shadow-lg shadow-blue-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ສົ່ງ...
              </span>
            ) : (
              <>ຢືນຢັນ <ChevronRight size={16} /></>
            )}
          </button>
        </div>
        <div className="flex items-center justify-center gap-4 text-[10px] text-gray-400">
          <span>🔒 ປອດໄພ</span>
          <span>📦 ຫຸ້ມຫໍ່ດີ</span>
          <span>💵 COD ໄດ້</span>
          <span>🔄 ຄືນ 7 ວັນ</span>
        </div>
      </div>
    </div>
  )
}

// Wrap with Suspense for useSearchParams
export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-[#1247D8] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutInner />
    </Suspense>
  )
}
