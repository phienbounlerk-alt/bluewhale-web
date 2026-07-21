'use client'
import { useCart } from '@/store/cart'
import { fmt, discountPct, getProducts, supabase, type Product } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import {
  Trash2, Plus, Minus, ShoppingBag, Tag, X, Truck, Clock,
  Bookmark, BookmarkCheck, ChevronRight, ShoppingCart, ArrowRight
} from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'

const FREE_SHIPPING = 200000
const BASE_SHIPPING = 20000

// Shipping rates per province zone
const PROVINCE_ZONES: Record<string, { fee: number; days: string }> = {
  'ນະຄອນຫຼວງວຽງຈັນ': { fee: 15000,  days: '1–2 ວັນ' },
  'ແຂວງວຽງຈັນ':      { fee: 18000,  days: '1–2 ວັນ' },
  'ແຂວງບໍລິຄຳໄຊ':   { fee: 22000,  days: '2–3 ວັນ' },
  'ແຂວງຄຳມ່ວນ':     { fee: 25000,  days: '2–3 ວັນ' },
  'ແຂວງສະຫວັນນະເຂດ':{ fee: 25000,  days: '2–3 ວັນ' },
  'ແຂວງສາລະວັນ':    { fee: 28000,  days: '3–4 ວັນ' },
  'ແຂວງເຊກອງ':      { fee: 30000,  days: '3–4 ວັນ' },
  'ແຂວງຈຳປາສັກ':    { fee: 30000,  days: '3–4 ວັນ' },
  'ແຂວງອັດຕະປື':    { fee: 32000,  days: '3–5 ວັນ' },
  'ແຂວງຫົວພັນ':     { fee: 28000,  days: '3–4 ວັນ' },
  'ແຂວງຊຽງຂວາງ':    { fee: 25000,  days: '2–3 ວັນ' },
  'ແຂວງລວງນາທາ':    { fee: 32000,  days: '3–5 ວັນ' },
  'ແຂວງບ່ອນແຜ່ນ':   { fee: 28000,  days: '3–4 ວັນ' },
  'ແຂວງອຸດົມໄຊ':    { fee: 30000,  days: '3–4 ວັນ' },
  'ແຂວງໄຊຍະບູລີ':   { fee: 28000,  days: '2–3 ວັນ' },
  'ແຂວງໄຊສົມບູນ':   { fee: 30000,  days: '3–4 ວັນ' },
  'ແຂວງຫຼວງພະບາງ':  { fee: 28000,  days: '2–3 ວັນ' },
  'ແຂວງຜົ້ງສາລີ':   { fee: 35000,  days: '4–6 ວັນ' },
}

const SAVED_KEY = 'bw_saved_items'

function getSaved(): Product[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]') } catch { return [] }
}
function setSavedLS(items: Product[]) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(items))
}

export default function CartPage() {
  const { items, remove, update, total, clear, add } = useCart()
  const [voucherCode, setVoucherCode]   = useState('')
  const [voucher, setVoucher]           = useState<any>(null)
  const [voucherErr, setVoucherErr]     = useState('')
  const [checking, setChecking]         = useState(false)
  const [province, setProvince]         = useState('')
  const [showProvince, setShowProvince] = useState(false)
  const [savedItems, setSavedItems]     = useState<Product[]>([])
  const [recommended, setRecommended]   = useState<Product[]>([])
  const [recAdded, setRecAdded]         = useState<string | null>(null)

  // Load saved items + recommended products
  useEffect(() => {
    setSavedItems(getSaved())
    getProducts().then(prods => {
      const cartIds = new Set(items.map(i => i.product.id))
      setRecommended(prods.filter(p => !cartIds.has(p.id)).slice(0, 8))
    })
  }, [])  // eslint-disable-line

  const subtotal = total()

  // Shipping fee (province-aware)
  const zoneInfo = province ? PROVINCE_ZONES[province] : null
  const shippingFee = subtotal >= FREE_SHIPPING ? 0 : (zoneInfo ? zoneInfo.fee : BASE_SHIPPING)
  const deliveryDays = zoneInfo?.days ?? '1–3 ວັນ'
  const isFreeShipping = subtotal >= FREE_SHIPPING
  const progressPct = Math.min(100, (subtotal / FREE_SHIPPING) * 100)

  // Voucher discount
  let discount = 0
  if (voucher) {
    discount = voucher.discount_type === 'percent'
      ? Math.round(subtotal * voucher.discount_value / 100)
      : voucher.discount_value
    if (voucher.max_discount) discount = Math.min(discount, voucher.max_discount)
  }
  const grand = Math.max(0, subtotal - discount) + shippingFee

  const applyVoucher = async () => {
    if (!voucherCode.trim()) return
    setChecking(true); setVoucherErr('')
    const { data, error } = await supabase.from('vouchers')
      .select('*').eq('code', voucherCode.trim().toUpperCase()).eq('is_active', true).single()
    if (!data || error) { setVoucherErr('ໂຄດບໍ່ຖືກຕ້ອງ ຫຼື ໝົດອາຍຸແລ້ວ'); setChecking(false); return }
    if (data.uses_left <= 0) { setVoucherErr('ໂຄດນີ້ໃຊ້ຄົບແລ້ວ'); setChecking(false); return }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setVoucherErr('ໂຄດໝົດອາຍຸແລ້ວ'); setChecking(false); return }
    if (subtotal < data.min_order) { setVoucherErr(`ຕ້ອງຊື້ຂັ້ນຕ່ຳ ${fmt(data.min_order)}`); setChecking(false); return }
    setVoucher(data); setChecking(false)
  }

  const removeVoucher = () => { setVoucher(null); setVoucherCode(''); setVoucherErr('') }

  const saveForLater = useCallback((product: Product) => {
    remove(product.id)
    const existing = getSaved()
    if (!existing.find(p => p.id === product.id)) {
      const updated = [product, ...existing]
      setSavedLS(updated)
      setSavedItems(updated)
    }
  }, [remove])

  const moveToCart = useCallback((product: Product) => {
    add(product)
    const updated = getSaved().filter(p => p.id !== product.id)
    setSavedLS(updated)
    setSavedItems(updated)
  }, [add])

  const removeSaved = useCallback((id: string) => {
    const updated = getSaved().filter(p => p.id !== id)
    setSavedLS(updated)
    setSavedItems(updated)
  }, [])

  const handleRecAdd = (e: React.MouseEvent, prod: Product) => {
    e.preventDefault()
    add(prod)
    setRecAdded(prod.id)
    setTimeout(() => setRecAdded(null), 1500)
  }

  // ── EMPTY STATE ──
  if (items.length === 0 && savedItems.length === 0) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-7xl mb-4">🛒</div>
      <h2 className="text-xl font-black text-gray-700 mb-2">ກະຕ່າຫວ່າງ</h2>
      <p className="text-gray-400 mb-6">ເລີ່ມຊອບປິ້ງ ເພື່ອເພີ່ມສິນຄ້າ</p>
      <Link href="/products" className="inline-flex items-center gap-2 bg-[#1247D8] text-white font-bold px-8 py-3 rounded-2xl hover:bg-[#0d35b0] transition-colors">
        <ShoppingBag size={16} /> ເລືອກຊື້ສິນຄ້າ
      </Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">

      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2">
          <ShoppingBag className="text-[#1247D8]" />
          ກະຕ່າສິນຄ້າ
          {items.length > 0 && (
            <span className="bg-[#1247D8] text-white text-xs font-black w-6 h-6 rounded-full flex items-center justify-center">
              {items.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </h1>
        {items.length > 0 && (
          <button onClick={clear} className="text-xs text-red-400 hover:text-red-600 hover:underline">ລ້າງທັງໝົດ</button>
        )}
      </div>

      {/* ── FREE SHIPPING PROGRESS BAR ── */}
      {items.length > 0 && (
        <div className={`rounded-2xl p-4 ${isFreeShipping ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-100'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Truck size={16} className={isFreeShipping ? 'text-green-500' : 'text-[#1247D8]'} />
              {isFreeShipping ? (
                <p className="text-sm font-bold text-green-600">🎉 ທ່ານໄດ້ຮັບການສົ່ງຟຣີ!</p>
              ) : (
                <p className="text-sm font-medium text-gray-700">
                  ຊື້ເພີ່ມ <span className="font-black text-[#1247D8]">{fmt(FREE_SHIPPING - subtotal)}</span> ເພື່ອສົ່ງຟຣີ
                </p>
              )}
            </div>
            <span className="text-xs font-bold text-gray-500">{Math.round(progressPct)}%</span>
          </div>
          <div className="h-2.5 bg-white/70 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isFreeShipping ? 'bg-green-400' : 'bg-gradient-to-r from-[#1247D8] to-blue-400'}`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {!isFreeShipping && (
            <div className="flex justify-between mt-1.5 text-[10px] text-gray-400 px-0.5">
              <span>₭0</span><span>{fmt(FREE_SHIPPING)}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">

        {/* ── CART ITEMS ── */}
        <div className="md:col-span-2 space-y-3">

          {items.length > 0 && items.map(({ product: p, quantity }) => {
            const pct = discountPct(p)
            const price = p.discount_price ?? p.price
            return (
              <div key={p.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-3">
                {/* Image */}
                <Link href={`/products/${p.id}`} className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-100 block">
                  {p.image_url && <Image src={p.image_url} alt={p.name} fill className="object-cover" unoptimized />}
                  {pct > 0 && (
                    <div className="absolute top-1 left-1 bg-[#EE4D2D] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      -{pct}%
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <p className="font-bold text-gray-800 text-sm line-clamp-2 leading-snug">{p.name}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-[#1247D8] font-black">{fmt(price)}</span>
                      {pct > 0 && <span className="text-gray-400 text-xs line-through">{fmt(p.price)}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {/* Qty stepper */}
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button onClick={() => update(p.id, quantity - 1)}
                        className="w-8 h-8 bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="w-9 text-center font-black text-sm border-x border-gray-200 h-8 flex items-center justify-center">
                        {quantity}
                      </span>
                      <button onClick={() => update(p.id, quantity + 1)}
                        className="w-8 h-8 bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Line total */}
                    <span className="text-xs font-bold text-gray-500 ml-1">= {fmt(price * quantity)}</span>

                    {/* Actions */}
                    <div className="ml-auto flex items-center gap-1">
                      <button onClick={() => saveForLater(p)}
                        title="ເກັບໄວ້ກ່ອນ"
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#1247D8] hover:bg-blue-50 transition-colors">
                        <Bookmark size={15} />
                      </button>
                      <button onClick={() => remove(p.id)}
                        title="ລຶບ"
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}

          {/* ── SAVE FOR LATER ── */}
          {savedItems.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-black text-gray-700 text-sm mb-3 flex items-center gap-2">
                <BookmarkCheck size={15} className="text-[#1247D8]" /> ເກັບໄວ້ກ່ອນ ({savedItems.length})
              </h3>
              <div className="space-y-3">
                {savedItems.map(p => (
                  <div key={p.id} className="flex gap-3 items-center">
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                      {p.image_url && <Image src={p.image_url} alt={p.name} fill className="object-cover" unoptimized />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-700 line-clamp-1">{p.name}</p>
                      <p className="text-xs text-[#1247D8] font-black">{fmt(p.discount_price ?? p.price)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => moveToCart(p)}
                        className="text-xs bg-[#1247D8] text-white font-bold px-3 py-1.5 rounded-xl hover:bg-[#0d35b0] transition-colors whitespace-nowrap">
                        ໃສ່ກະຕ່າ
                      </button>
                      <button onClick={() => removeSaved(p.id)}
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── SUMMARY SIDEBAR ── */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 sticky top-24 space-y-4">
            <h2 className="font-black text-gray-800">ສະຫຼຸບລາຄາ</h2>

            {/* Shipping estimate picker */}
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1">
                <MapPinIcon /> ຄາດການຄ່າສົ່ງ
              </p>
              <div className="relative">
                <button onClick={() => setShowProvince(v => !v)}
                  className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 hover:border-[#1247D8] transition-colors">
                  <span className={province ? 'text-gray-800' : 'text-gray-400'}>
                    {province || 'ເລືອກແຂວງ...'}
                  </span>
                  <ChevronRight size={14} className={`text-gray-400 transition-transform ${showProvince ? 'rotate-90' : ''}`} />
                </button>
                {showProvince && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-52 overflow-y-auto">
                    {Object.keys(PROVINCE_ZONES).map(pv => (
                      <button key={pv} onClick={() => { setProvince(pv); setShowProvince(false) }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${province === pv ? 'text-[#1247D8] font-bold bg-blue-50' : 'text-gray-700'}`}>
                        {pv}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Delivery + shipping result */}
              {province && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 rounded-xl p-2.5 text-center">
                    <Truck size={14} className="text-[#1247D8] mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">ຄ່າສົ່ງ</p>
                    <p className="text-xs font-black text-[#1247D8]">{isFreeShipping ? 'ຟຣີ 🎉' : fmt(shippingFee)}</p>
                  </div>
                  <div className="bg-orange-50 rounded-xl p-2.5 text-center">
                    <Clock size={14} className="text-orange-500 mx-auto mb-1" />
                    <p className="text-[10px] text-gray-500">ໄລຍະເວລາ</p>
                    <p className="text-xs font-black text-orange-600">{deliveryDays}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Voucher input */}
            <div>
              <p className="text-xs font-bold text-gray-600 mb-2 flex items-center gap-1">
                <Tag size={12} /> ໂຄດສ່ວນຫຼຸດ
              </p>
              {voucher ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                  <div>
                    <p className="text-green-700 font-black text-sm">{voucher.code}</p>
                    <p className="text-green-600 text-xs">
                      {voucher.discount_type === 'percent' ? `-${voucher.discount_value}%` : `-${fmt(voucher.discount_value)}`}
                      {voucher.max_discount && ` (ສູງສຸດ ${fmt(voucher.max_discount)})`}
                    </p>
                  </div>
                  <button onClick={removeVoucher} className="text-gray-400 hover:text-gray-600 w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={voucherCode} onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && applyVoucher()}
                    placeholder="ໃສ່ໂຄດ..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1247D8] uppercase transition-colors" />
                  <button onClick={applyVoucher} disabled={checking || !voucherCode.trim()}
                    className="px-3 bg-[#1247D8] text-white rounded-xl text-xs font-bold hover:bg-[#0d35b0] disabled:opacity-50 transition-colors whitespace-nowrap">
                    {checking ? '...' : 'ໃຊ້'}
                  </button>
                </div>
              )}
              {voucherErr && <p className="text-red-500 text-xs mt-1.5 bg-red-50 px-3 py-1.5 rounded-lg">{voucherErr}</p>}
            </div>

            {/* Price breakdown */}
            <div className="space-y-2.5 text-sm border-t pt-3">
              <div className="flex justify-between text-gray-600">
                <span>ລາຄາສິນຄ້າ ({items.reduce((s,i)=>s+i.quantity,0)} ລາຍການ)</span>
                <span>{fmt(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-bold">
                  <span>ສ່ວນຫຼຸດ ({voucher.code})</span>
                  <span>-{fmt(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>ຄ່າສົ່ງ{province ? ` (${province.replace('ແຂວງ','').replace('ນະຄອນຫຼວງ','ນ.ຫ.')})` : ''}</span>
                <span className={isFreeShipping ? 'text-green-500 font-bold' : ''}>
                  {isFreeShipping ? 'ຟຣີ 🎉' : fmt(shippingFee)}
                </span>
              </div>
              {!province && !isFreeShipping && (
                <p className="text-[10px] text-gray-400 italic">* ເລືອກແຂວງ ເພື່ອຄາດການຄ່າສົ່ງທີ່ຖືກຕ້ອງ</p>
              )}
              <div className="border-t pt-2.5 flex justify-between font-black text-xl">
                <span className="text-gray-800">ລວມ</span>
                <span className="text-[#1247D8]">{fmt(grand)}</span>
              </div>
            </div>

            {/* CHECKOUT BUTTON */}
            {items.length > 0 && (
              <Link
                href={`/checkout${voucher ? `?voucher=${voucher.code}&discount=${discount}` : ''}`}
                className="group relative block overflow-hidden bg-gradient-to-r from-[#1247D8] to-[#1e5df0] text-white text-center font-black py-4 rounded-2xl hover:from-[#0d35b0] hover:to-[#1247D8] transition-all active:scale-[0.98] shadow-lg shadow-blue-200">
                <div className="flex items-center justify-center gap-3">
                  <span className="text-base">ດຳເນີນການຊຳລະ</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-blue-200 text-xs mt-0.5">{fmt(grand)} · {items.reduce((s,i)=>s+i.quantity,0)} ລາຍການ</p>
              </Link>
            )}

            {/* Continue shopping */}
            <Link href="/products"
              className="block text-center text-sm text-[#1247D8] font-bold hover:underline py-1">
              ← ຊື້ຕໍ່
            </Link>
          </div>

          {/* Delivery guarantee badges */}
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="grid grid-cols-2 gap-2 text-center">
              {[
                { icon: '🔒', label: 'ຊຳລະປອດໄພ' },
                { icon: '🔄', label: 'ຄືນສິນຄ້າ 7 ວັນ' },
                { icon: '📦', label: 'ຫຸ້ມຫໍ່ຢ່າງດີ' },
                { icon: '💵', label: 'COD ຈ່າຍປາຍທາງ' },
              ].map(b => (
                <div key={b.label} className="bg-gray-50 rounded-xl py-2.5 px-1">
                  <span className="text-lg">{b.icon}</span>
                  <p className="text-[10px] text-gray-600 font-bold mt-0.5 leading-tight">{b.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── RECOMMENDED PRODUCTS ── */}
      {recommended.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
              <span>✨</span> ສິນຄ້າທີ່ທ່ານອາດຈະຊອບ
            </h3>
            <Link href="/products" className="text-xs text-[#1247D8] font-bold flex items-center gap-0.5 hover:underline">
              ທັງໝົດ <ChevronRight size={12} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {recommended.map(prod => {
              const pct = discountPct(prod)
              return (
                <Link key={prod.id} href={`/products/${prod.id}`}
                  className="shrink-0 w-32 snap-start group">
                  <div className="relative w-32 h-32 bg-gray-50 rounded-xl overflow-hidden mb-2">
                    {prod.image_url
                      ? <Image src={prod.image_url} alt={prod.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                      : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>}
                    {pct > 0 && (
                      <div className="absolute top-1.5 left-1.5 bg-[#EE4D2D] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        -{pct}%
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 font-medium line-clamp-2 leading-snug">{prod.name}</p>
                  <div className="flex items-center justify-between mt-1 gap-1">
                    <p className="text-xs font-black text-[#1247D8]">{fmt(prod.discount_price ?? prod.price)}</p>
                    <button onClick={e => handleRecAdd(e, prod)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-90"
                      style={{ background: recAdded === prod.id ? '#22c55e' : '#1247D8' }}>
                      {recAdded === prod.id
                        ? <span className="text-white text-[10px]">✓</span>
                        : <ShoppingCart size={12} className="text-white" />}
                    </button>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Inline icon component to avoid extra import
function MapPinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  )
}
