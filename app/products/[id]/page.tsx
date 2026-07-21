'use client'
import { useEffect, useState, useMemo } from 'react'
import { getProduct, getProducts, fmt, discountPct, supabase, type Product, type ProductVariant } from '@/lib/supabase'
import { useCart } from '@/store/cart'
import { trackView } from '@/components/home/RecentlyViewedSection'
import Image from 'next/image'
import Link from 'next/link'
import {
  ShoppingCart, Star, Shield, Truck, ArrowLeft, Send,
  Package, RefreshCw, MapPin, Clock, Store, ChevronRight, Play
} from 'lucide-react'
import { use } from 'react'
import { useRouter } from 'next/navigation'

type Review = { id: string; user_name: string; rating: number; comment: string; created_at: string }

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} type="button"
          onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(i)}>
          <Star size={24} className={(hover || value) >= i ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
        </button>
      ))}
    </div>
  )
}

function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={size} className={i <= Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
      ))}
    </div>
  )
}

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [p, setP] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [selectedOpts, setSelectedOpts] = useState<Record<string, string>>({})
  const [activeImg, setActiveImg] = useState(0)
  const [showVideo, setShowVideo] = useState(false)
  const [added, setAdded] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [myRating, setMyRating] = useState(5)
  const [myComment, setMyComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const [freqBought, setFreqBought] = useState<Product[]>([])
  const [freqAdded, setFreqAdded] = useState<string | null>(null)
  const add = useCart(s => s.add)
  const router = useRouter()

  useEffect(() => {
    getProduct(id).then(async prod => {
      setP(prod)
      if (!prod) return
      trackView(prod.id)

      const [{ data: vd }, { data: rd }, allProds] = await Promise.all([
        supabase.from('product_variants').select('*').eq('product_id', prod.id),
        supabase.from('reviews').select('*').eq('product_id', prod.id).order('created_at', { ascending: false }),
        getProducts(prod.category),
      ])
      setVariants(vd ?? [])
      setReviews(rd ?? [])

      const others = allProds.filter(x => x.id !== prod.id)
      setSimilarProducts(others.slice(0, 8))
      // Randomly pick 2-3 for frequently bought together
      const shuffled = [...others].sort(() => Math.random() - 0.5)
      setFreqBought(shuffled.slice(0, 2))
    })
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user))
  }, [id])

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) { router.push('/login'); return }
    setSubmitting(true)
    const name = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'ຜູ້ໃຊ້'
    const { data: rev } = await supabase.from('reviews').insert({
      product_id: id, user_id: currentUser.id, user_name: name,
      rating: myRating, comment: myComment
    }).select().single()
    if (rev) setReviews(r => [rev, ...r])
    setMyComment(''); setMyRating(5); setSubmitting(false)
  }

  const optionGroups = useMemo<Record<string, string[]>>(() => p?.variant_options ?? {}, [p])
  const optionKeys = Object.keys(optionGroups)

  const selectedVariant = useMemo(() => {
    if (!variants.length || !optionKeys.length) return null
    if (optionKeys.some(k => !selectedOpts[k])) return null
    return variants.find(v => optionKeys.every(k => v.options[k] === selectedOpts[k])) ?? null
  }, [variants, selectedOpts, optionKeys])

  const isAvailable = (key: string, val: string) =>
    variants.some(v =>
      v.options[key] === val && v.stock > 0 &&
      optionKeys.filter(k => k !== key).every(k => !selectedOpts[k] || v.options[k] === selectedOpts[k])
    )

  const allSelected = optionKeys.length === 0 || optionKeys.every(k => selectedOpts[k])

  if (!p) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-gray-400">
      <div className="w-8 h-8 border-2 border-[#1247D8] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm">ກຳລັງໂຫຼດ...</p>
    </div>
  )

  const pct = discountPct(p)
  const displayPrice = selectedVariant?.price ?? (p.discount_price ?? p.price)
  const displayStock = selectedVariant ? selectedVariant.stock : (optionKeys.length === 0 ? p.stock : null)
  const allImages = p.images?.length ? p.images : (p.image_url ? [p.image_url] : [])
  const outOfStock = allSelected && (selectedVariant ? selectedVariant.stock === 0 : p.stock === 0)
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : (p.rating ?? 0)

  const handleAdd = () => {
    if (outOfStock || !allSelected) return
    add(p)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const handleFreqAdd = (e: React.MouseEvent, prod: Product) => {
    e.preventDefault()
    add(prod)
    setFreqAdded(prod.id)
    setTimeout(() => setFreqAdded(null), 1500)
  }

  // Delivery date estimate
  const deliveryDate = () => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    return d.toLocaleDateString('lo-LA', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <Link href="/products" className="flex items-center gap-2 text-[#1247D8] hover:underline text-sm">
        <ArrowLeft size={16} /> ກັບຫຼັງ
      </Link>

      {/* ── MAIN GRID ── */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Image / Video Gallery */}
        <div>
          {/* Tab switcher */}
          {p.video_url && (
            <div className="flex gap-2 mb-2">
              <button onClick={() => setShowVideo(false)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${!showVideo ? 'bg-[#1247D8] text-white' : 'bg-gray-100 text-gray-500'}`}>
                📸 ຮູບພາບ
              </button>
              <button onClick={() => setShowVideo(true)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-colors ${showVideo ? 'bg-[#1247D8] text-white' : 'bg-gray-100 text-gray-500'}`}>
                <span className="flex items-center justify-center gap-1"><Play size={11} /> ວິດີໂອ</span>
              </button>
            </div>
          )}

          {showVideo && p.video_url ? (
            <div className="aspect-square rounded-2xl overflow-hidden bg-black">
              <video src={p.video_url} controls className="w-full h-full object-cover" />
            </div>
          ) : (
            <>
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-sm">
                {allImages[activeImg]
                  ? <Image src={allImages[activeImg]} alt={p.name} fill className="object-cover" unoptimized />
                  : <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>}
                {pct > 0 && (
                  <div className="absolute top-4 left-4 bg-[#EE4D2D] text-white font-black px-3 py-1 rounded-full text-sm shadow">
                    -{pct}%
                  </div>
                )}
                {p.is_free_shipping && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow">
                    ສົ່ງຟຣີ
                  </div>
                )}
                {/* Video preview hint */}
                {p.video_url && !showVideo && (
                  <button onClick={() => setShowVideo(true)}
                    className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1 backdrop-blur-sm">
                    <Play size={11} /> ເບິ່ງວິດີໂອ
                  </button>
                )}
              </div>
              {allImages.length > 1 && (
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                  {allImages.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${activeImg === i ? 'border-[#1247D8]' : 'border-gray-200 hover:border-gray-300'}`}>
                      <Image src={img} alt="" fill className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{p.category}</span>
            <h1 className="text-xl font-black text-gray-800 mt-2 leading-snug">{p.name}</h1>
          </div>

          {/* Rating summary */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Stars rating={avgRating} size={14} />
              <span className="text-sm font-bold text-gray-700">{avgRating.toFixed(1)}</span>
            </div>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">{reviews.length || p.review_count || 0} ລີວິວ</span>
            {p.sold_count != null && (
              <>
                <span className="text-gray-300">|</span>
                <span className="text-sm text-gray-500">ຂາຍແລ້ວ {p.sold_count.toLocaleString()}</span>
              </>
            )}
          </div>

          {/* Price */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
            <div className="text-3xl font-black text-[#1247D8]">{fmt(displayPrice)}</div>
            {pct > 0 && !selectedVariant?.price && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-400 line-through text-sm">{fmt(p.price)}</span>
                <span className="bg-[#EE4D2D] text-white text-xs font-bold px-2 py-0.5 rounded-full">ປະຫຍັດ {fmt(p.price - displayPrice)}</span>
              </div>
            )}
            {displayStock !== null && (
              <p className={`text-xs mt-1.5 font-bold ${displayStock === 0 ? 'text-red-500' : displayStock < 10 ? 'text-orange-500' : 'text-green-600'}`}>
                {displayStock === 0 ? '❌ ໝົດສາງ' : displayStock < 10 ? `⚠️ ເຫຼືອ ${displayStock} ຊິ້ນ` : `✅ ສາງ: ${displayStock} ຊິ້ນ`}
              </p>
            )}
          </div>

          {/* Variant selector */}
          {optionKeys.length > 0 && (
            <div className="space-y-3">
              {optionKeys.map(key => (
                <div key={key}>
                  <p className="text-sm font-bold text-gray-700 mb-2">
                    {key}: {selectedOpts[key] && <span className="text-[#1247D8]">{selectedOpts[key]}</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(optionGroups[key] ?? []).map(val => {
                      const avail = isAvailable(key, val)
                      const selected = selectedOpts[key] === val
                      return (
                        <button key={val} disabled={!avail}
                          onClick={() => setSelectedOpts(s => ({ ...s, [key]: val }))}
                          className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all
                            ${selected ? 'border-[#1247D8] bg-[#1247D8] text-white shadow-md'
                              : avail ? 'border-gray-200 hover:border-[#1247D8] text-gray-700'
                                : 'border-gray-100 text-gray-300 line-through cursor-not-allowed'}`}>
                          {val}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              {!allSelected && (
                <p className="text-xs text-orange-500 bg-orange-50 px-3 py-2 rounded-xl">
                  ⚠️ ກະລຸນາເລືອກ: {optionKeys.filter(k => !selectedOpts[k]).join(', ')}
                </p>
              )}
            </div>
          )}

          <p className="text-gray-600 text-sm leading-relaxed">{p.description}</p>

          {/* Shipping info inline */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-xl p-2">
              <Truck size={14} className="text-[#1247D8] shrink-0" />
              <span>ສົ່ງຟຣີ ≥₭200k</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-xl p-2">
              <Shield size={14} className="text-green-500 shrink-0" />
              <span>ຮ້ານຢັ້ງຢືນ 100%</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-xl p-2">
              <RefreshCw size={14} className="text-orange-500 shrink-0" />
              <span>ຄືນສິນຄ້າ 7 ວັນ</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 rounded-xl p-2">
              <Package size={14} className="text-purple-500 shrink-0" />
              <span>ຫຸ້ມຫໍ່ຢ່າງດີ</span>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={handleAdd} disabled={outOfStock || !allSelected}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white transition-all active:scale-95
                ${added ? 'bg-green-500' : outOfStock ? 'bg-gray-300 cursor-not-allowed' : !allSelected ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1247D8] hover:bg-[#0d35b0]'}`}>
              <ShoppingCart size={18} />
              {added ? 'ເພີ່ມແລ້ວ ✓' : outOfStock ? 'ໝົດສາງ' : !allSelected ? 'ເລືອກກ່ອນ' : 'ໃສ່ກະຕ່າ'}
            </button>
            <button onClick={() => { handleAdd(); router.push('/cart') }}
              disabled={outOfStock || !allSelected}
              className="flex-1 flex items-center justify-center py-4 rounded-2xl font-black border-2 border-[#1247D8] text-[#1247D8] hover:bg-[#1247D8] hover:text-white transition-all active:scale-95 disabled:border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed">
              ຊື້ດ່ວນ →
            </button>
          </div>
        </div>
      </div>

      {/* ── SELLER INFORMATION ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#1247D8] to-[#0d35b0] rounded-xl flex items-center justify-center text-2xl">
              🐋
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-black text-gray-800 text-sm">BlueWhale Official</p>
                <span className="bg-[#1247D8] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">✓ ຢັ້ງຢືນ</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">ສິນຄ້າທົ່ວໄປ | ວຽງຈັນ, ລາວ</p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-gray-500">⭐ 4.9</span>
                <span className="text-xs text-gray-500">👥 12.4k ຜູ້ຕິດຕາມ</span>
                <span className="text-xs text-gray-500">📦 1.2k ສິນຄ້າ</span>
              </div>
            </div>
          </div>
          <Link href="/products" className="flex items-center gap-1 text-xs text-[#1247D8] font-bold border border-[#1247D8]/30 px-3 py-1.5 rounded-xl hover:bg-blue-50 transition-colors">
            <Store size={12} /> ຮ້ານ
          </Link>
        </div>
      </div>

      {/* ── SHIPPING / DELIVERY / RETURN ── */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
        <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
          <Truck size={16} className="text-[#1247D8]" /> ຂໍ້ມູນການຈັດສົ່ງ
        </h3>
        <div className="space-y-2">
          {/* Estimated delivery */}
          <div className="flex items-start gap-3 py-2 border-b border-gray-50">
            <Clock size={16} className="text-[#1247D8] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-gray-700">ຄາດການຮອດ</p>
              <p className="text-xs text-gray-500 mt-0.5">ທ່ານຈະໄດ້ຮັບສິນຄ້າໂດຍ <span className="font-bold text-green-600">{deliveryDate()}</span></p>
              <p className="text-xs text-gray-400">ສົ່ງພາຍໃນ 1-3 ວັນລັດຖະການ</p>
            </div>
          </div>
          {/* Shipping info */}
          <div className="flex items-start gap-3 py-2 border-b border-gray-50">
            <MapPin size={16} className="text-orange-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-gray-700">ຂໍ້ມູນຂົນສົ່ງ</p>
              <p className="text-xs text-gray-500 mt-0.5">ຮ່ວມມືກັບ <span className="font-bold">ອານຸສິດ · ຮຸ່ງອາລຸນ · ມີໄຊ</span></p>
              <p className="text-xs text-gray-400">ສົ່ງຟຣີ ເມື່ອຊື້ຄົບ ₭200,000 | COD ຈ່າຍປາຍທາງ</p>
            </div>
          </div>
          {/* Return policy */}
          <div className="flex items-start gap-3 py-2">
            <RefreshCw size={16} className="text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-gray-700">ນະໂຍບາຍຄືນສິນຄ້າ</p>
              <p className="text-xs text-gray-500 mt-0.5">ຄືນສິນຄ້າໄດ້ພາຍໃນ <span className="font-bold text-green-600">7 ວັນ</span> ນັບຈາກວັນຮັບສິນຄ້າ</p>
              <p className="text-xs text-gray-400">ສິນຄ້າຕ້ອງຢູ່ໃນສະພາບດີ ຍັງບໍ່ໄດ້ໃຊ້ ມີໃບຮັບເງິນ</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── FREQUENTLY BOUGHT TOGETHER ── */}
      {freqBought.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-800 text-sm mb-3 flex items-center gap-2">
            <span>🛒</span> ມັກຊື້ຄຽງກັນ
          </h3>
          <div className="flex items-center gap-3 overflow-x-auto pb-1">
            {/* Current product */}
            <div className="shrink-0 flex flex-col items-center gap-1 w-20">
              <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50 border-2 border-[#1247D8]">
                {p.image_url
                  ? <Image src={p.image_url} alt={p.name} fill className="object-cover" unoptimized />
                  : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
              </div>
              <p className="text-[10px] text-gray-600 text-center line-clamp-1 w-full">{p.name}</p>
              <p className="text-xs font-black text-[#1247D8]">{fmt(displayPrice)}</p>
            </div>

            {freqBought.map((fp, i) => (
              <div key={fp.id} className="flex items-center gap-3 shrink-0">
                <span className="text-gray-300 font-bold text-lg">+</span>
                <Link href={`/products/${fp.id}`} className="flex flex-col items-center gap-1 w-20">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-50">
                    {fp.image_url
                      ? <Image src={fp.image_url} alt={fp.name} fill className="object-cover" unoptimized />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                  </div>
                  <p className="text-[10px] text-gray-600 text-center line-clamp-1 w-full">{fp.name}</p>
                  <p className="text-xs font-black text-[#1247D8]">{fmt(fp.discount_price ?? fp.price)}</p>
                </Link>
              </div>
            ))}

            <div className="shrink-0 ml-2">
              <p className="text-xs text-gray-500 mb-1">ລວມ</p>
              <p className="font-black text-[#EE4D2D] text-base">
                {fmt(displayPrice + freqBought.reduce((s, x) => s + (x.discount_price ?? x.price), 0))}
              </p>
              <button onClick={() => { add(p); freqBought.forEach(x => add(x)) }}
                className="mt-2 bg-[#1247D8] text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-[#0d35b0] active:scale-95 transition-all whitespace-nowrap">
                ໃສ່ກະຕ່າທັງໝົດ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SIMILAR PRODUCTS ── */}
      {similarProducts.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-black text-gray-800 text-sm flex items-center gap-2">
              <span>🔍</span> ສິນຄ້າໃກ້ຄຽງ
            </h3>
            <Link href={`/products?category=${encodeURIComponent(p.category)}`}
              className="text-xs text-[#1247D8] font-bold flex items-center gap-0.5">
              ທັງໝົດ <ChevronRight size={12} />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
            {similarProducts.map(sp => {
              const spct = discountPct(sp)
              return (
                <Link key={sp.id} href={`/products/${sp.id}`}
                  className="shrink-0 w-32 snap-start group">
                  <div className="relative w-32 h-32 bg-gray-50 rounded-xl overflow-hidden mb-2">
                    {sp.image_url
                      ? <Image src={sp.image_url} alt={sp.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                      : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>}
                    {spct > 0 && (
                      <div className="absolute top-1.5 left-1.5 bg-[#EE4D2D] text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                        -{spct}%
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 font-medium line-clamp-2 leading-snug">{sp.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs font-black text-[#1247D8]">{fmt(sp.discount_price ?? sp.price)}</p>
                    <button onClick={e => handleFreqAdd(e, sp)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all active:scale-90"
                      style={{ background: freqAdded === sp.id ? '#22c55e' : '#1247D8' }}>
                      {freqAdded === sp.id
                        ? <span className="text-white text-[10px]">✓</span>
                        : <ShoppingCart size={11} className="text-white" />}
                    </button>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ── REVIEWS ── */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-[#1247D8] rounded-full" />
          <h2 className="text-xl font-black text-gray-800">ລີວິວສິນຄ້າ</h2>
          <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{reviews.length} ລີວິວ</span>
        </div>

        {/* Rating Breakdown */}
        {reviews.length > 0 && (() => {
          const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
          return (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-6">
                <div className="text-center shrink-0">
                  <div className="text-5xl font-black text-[#1247D8]">{avg.toFixed(1)}</div>
                  <Stars rating={avg} size={14} />
                  <p className="text-xs text-gray-400 mt-1">{reviews.length} ລີວິວ</p>
                </div>
                <div className="flex-1 space-y-1.5">
                  {[5,4,3,2,1].map(star => {
                    const count = reviews.filter(r => r.rating === star).length
                    const pct = reviews.length ? (count / reviews.length) * 100 : 0
                    return (
                      <div key={star} className="flex items-center gap-2 text-xs">
                        <span className="w-3 text-gray-500 text-right">{star}</span>
                        <Star size={10} className="text-yellow-400 fill-yellow-400 shrink-0" />
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-400 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-4 text-gray-400 text-right">{count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })()}

        {/* Write review */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-black text-gray-800 mb-4">✍️ ຂຽນລີວິວ</h3>
          {currentUser ? (
            <form onSubmit={submitReview} className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-2">ຄະແນນຂອງທ່ານ:</p>
                <StarPicker value={myRating} onChange={setMyRating} />
              </div>
              <textarea value={myComment} onChange={e => setMyComment(e.target.value)}
                placeholder="ແບ່ງປັນຄວາມຄິດເຫັນ... ສິນຄ້າດີໄລໝ? ຄຸ້ມຄ່າໄລ?"
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1247D8] resize-none transition-colors" />
              <button type="submit" disabled={submitting || !myComment.trim()}
                className="flex items-center gap-2 bg-[#1247D8] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#0d35b0] transition-colors disabled:opacity-50 active:scale-95">
                <Send size={14} />
                {submitting ? 'ກຳລັງສົ່ງ...' : 'ສົ່ງລີວິວ'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm mb-3">ກະລຸນາເຂົ້າສູ່ລະບົບເພື່ອຂຽນລີວິວ</p>
              <Link href="/login" className="bg-[#1247D8] text-white font-bold px-6 py-2 rounded-xl text-sm hover:bg-[#0d35b0] transition-colors">
                ເຂົ້າສູ່ລະບົບ
              </Link>
            </div>
          )}
        </div>

        {/* Review list */}
        {reviews.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
            <Star size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm text-gray-400">ຍັງບໍ່ມີລີວິວ — ເປັນຄົນທຳອິດທີ່ລີວິວ!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#1247D8] to-[#0d35b0] flex items-center justify-center text-white font-black text-sm shrink-0">
                      {r.user_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{r.user_name}</p>
                      <Stars rating={r.rating} size={11} />
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">
                    {new Date(r.created_at).toLocaleDateString('lo-LA', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {r.comment && <p className="text-gray-600 text-sm mt-3 leading-relaxed pl-12">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
