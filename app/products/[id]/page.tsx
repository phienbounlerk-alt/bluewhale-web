'use client'
import { useEffect, useState, useMemo } from 'react'
import { getProduct, fmt, discountPct, supabase, type Product, type ProductVariant } from '@/lib/supabase'
import { useCart } from '@/store/cart'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Star, Shield, Truck, ArrowLeft, Send } from 'lucide-react'
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

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [p, setP] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [selectedOpts, setSelectedOpts] = useState<Record<string, string>>({})
  const [activeImg, setActiveImg] = useState(0)
  const [added, setAdded] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])
  const [myRating, setMyRating] = useState(5)
  const [myComment, setMyComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const add = useCart(s => s.add)
  const router = useRouter()

  useEffect(() => {
    getProduct(id).then(async prod => {
      setP(prod)
      if (prod?.id) {
        const { data: vd } = await supabase.from('product_variants').select('*').eq('product_id', prod.id)
        setVariants(vd ?? [])
        const { data: rd } = await supabase.from('reviews').select('*').eq('product_id', prod.id).order('created_at', { ascending: false })
        setReviews(rd ?? [])
      }
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

  // Find variant matching current selection
  const selectedVariant = useMemo(() => {
    if (!variants.length || !optionKeys.length) return null
    if (optionKeys.some(k => !selectedOpts[k])) return null
    return variants.find(v => optionKeys.every(k => v.options[k] === selectedOpts[k])) ?? null
  }, [variants, selectedOpts, optionKeys])

  // Check if a specific option value has any stock (given other selections)
  const isAvailable = (key: string, val: string) =>
    variants.some(v =>
      v.options[key] === val &&
      v.stock > 0 &&
      optionKeys.filter(k => k !== key).every(k => !selectedOpts[k] || v.options[k] === selectedOpts[k])
    )

  const allSelected = optionKeys.length === 0 || optionKeys.every(k => selectedOpts[k])

  if (!p) return <div className="flex items-center justify-center h-64 text-gray-400">ກຳລັງໂຫຼດ...</div>

  const pct = discountPct(p)
  const displayPrice = selectedVariant?.price ?? (p.discount_price ?? p.price)
  const displayStock = selectedVariant ? selectedVariant.stock : (optionKeys.length === 0 ? p.stock : null)
  const allImages = p.images?.length ? p.images : (p.image_url ? [p.image_url] : [])
  const outOfStock = allSelected && (selectedVariant ? selectedVariant.stock === 0 : p.stock === 0)

  const handleAdd = () => {
    if (outOfStock || !allSelected) return
    for (let i = 0; i < 1; i++) add(p)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <Link href="/products" className="flex items-center gap-2 text-[#1247D8] mb-4 hover:underline text-sm">
        <ArrowLeft size={16} /> ກັບຫຼັງ
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image Gallery */}
        <div>
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-sm">
            {allImages[activeImg]
              ? <Image src={allImages[activeImg]} alt={p.name} fill className="object-cover" unoptimized />
              : <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>}
            {pct > 0 && (
              <div className="absolute top-4 left-4 bg-[#EE4D2D] text-white font-black px-3 py-1 rounded-xl text-sm">-{pct}%</div>
            )}
          </div>
          {allImages.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
              {allImages.map((img, i) => (
                <button key={i} onClick={() => setActiveImg(i)}
                  className={`relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-colors ${activeImg === i ? 'border-[#1247D8]' : 'border-gray-200'}`}>
                  <Image src={img} alt="" fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-4">
          <div>
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">{p.category}</span>
            <h1 className="text-2xl font-black text-gray-800 mt-2">{p.name}</h1>
          </div>

          {p.rating && (
            <div className="flex items-center gap-2">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={14} className={i <= Math.round(p.rating!) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                ))}
              </div>
              <span className="text-sm text-gray-500">{p.rating} ({p.review_count} ລີວິວ)</span>
            </div>
          )}

          {/* Price */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <div className="text-3xl font-black text-[#1247D8]">{fmt(displayPrice)}</div>
            {pct > 0 && !selectedVariant?.price && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-400 line-through text-sm">{fmt(p.price)}</span>
                <span className="bg-[#EE4D2D] text-white text-xs font-bold px-2 py-0.5 rounded">ປະຫຍັດ {fmt(p.price - displayPrice)}</span>
              </div>
            )}
            {/* Stock status */}
            {displayStock !== null && (
              <p className={`text-xs mt-1 font-bold ${displayStock === 0 ? 'text-red-500' : 'text-green-600'}`}>
                {displayStock === 0 ? 'ໝົດສາງ' : `ສາງ: ${displayStock} ຊິ້ນ`}
              </p>
            )}
          </div>

          {/* Variant selector */}
          {optionKeys.length > 0 && (
            <div className="space-y-3">
              {optionKeys.map(key => (
                <div key={key}>
                  <p className="text-sm font-bold text-gray-700 mb-2">
                    {key}:
                    {selectedOpts[key] && <span className="text-[#1247D8] ml-1">{selectedOpts[key]}</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(optionGroups[key] ?? []).map(val => {
                      const avail = isAvailable(key, val)
                      const selected = selectedOpts[key] === val
                      return (
                        <button key={val} disabled={!avail}
                          onClick={() => setSelectedOpts(s => ({ ...s, [key]: val }))}
                          className={`px-4 py-2 rounded-xl border-2 text-sm font-bold transition-all
                            ${selected
                              ? 'border-[#1247D8] bg-[#1247D8] text-white'
                              : avail
                                ? 'border-gray-200 hover:border-[#1247D8] text-gray-700'
                                : 'border-gray-100 text-gray-300 line-through cursor-not-allowed'}`}>
                          {val}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              {!allSelected && (
                <p className="text-xs text-orange-500">
                  ກະລຸນາເລືອກ: {optionKeys.filter(k => !selectedOpts[k]).join(', ')}
                </p>
              )}
            </div>
          )}

          <p className="text-gray-600 text-sm leading-relaxed">{p.description}</p>

          <div className="flex gap-3">
            <div className="flex items-center gap-1 text-xs text-gray-500"><Truck size={14} className="text-[#1247D8]" /> ສົ່ງຟຣີ ≥₭200k</div>
            <div className="flex items-center gap-1 text-xs text-gray-500"><Shield size={14} className="text-green-500" /> ຮ້ານຢັ້ງຢືນ</div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={handleAdd} disabled={outOfStock || !allSelected}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white transition-all
                ${added ? 'bg-green-500' : outOfStock ? 'bg-gray-300 cursor-not-allowed' : !allSelected ? 'bg-gray-300 cursor-not-allowed' : 'bg-[#1247D8] hover:bg-[#0d35b0]'}`}>
              <ShoppingCart size={18} />
              {added ? 'ເພີ່ມແລ້ວ ✓' : outOfStock ? 'ໝົດສາງ' : !allSelected ? 'ເລືອກຕົວເລືອກກ່ອນ' : 'ເພີ່ມໃສ່ກະຕ່າ'}
            </button>
            <button onClick={() => { handleAdd(); router.push('/cart') }}
              disabled={outOfStock || !allSelected}
              className="flex-1 flex items-center justify-center py-4 rounded-2xl font-black border-2 border-[#1247D8] text-[#1247D8] hover:bg-[#1247D8] hover:text-white transition-all disabled:border-gray-200 disabled:text-gray-300 disabled:cursor-not-allowed">
              ຊື້ດ່ວນ →
            </button>
          </div>
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-6 bg-[#1247D8] rounded-full" />
          <h2 className="text-xl font-black text-gray-800">ລີວິວສິນຄ້າ</h2>
          <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{reviews.length} ລີວິວ</span>
        </div>

        {/* Average rating */}
        {reviews.length > 0 && (() => {
          const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
          return (
            <div className="bg-blue-50 rounded-2xl p-5 mb-6 flex items-center gap-6">
              <div className="text-center">
                <div className="text-5xl font-black text-[#1247D8]">{avg.toFixed(1)}</div>
                <div className="flex justify-center gap-0.5 mt-1">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} size={14} className={i <= Math.round(avg) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">{reviews.length} ລີວິວ</p>
              </div>
              <div className="flex-1 space-y-1">
                {[5,4,3,2,1].map(star => {
                  const count = reviews.filter(r => r.rating === star).length
                  const pct = reviews.length ? (count / reviews.length) * 100 : 0
                  return (
                    <div key={star} className="flex items-center gap-2 text-xs">
                      <span className="w-4 text-gray-500">{star}</span>
                      <Star size={10} className="text-yellow-400 fill-yellow-400 shrink-0" />
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-5 text-gray-400">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Submit form */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6">
          <h3 className="font-black text-gray-800 mb-4">ຂຽນລີວິວ</h3>
          {currentUser ? (
            <form onSubmit={submitReview} className="space-y-3">
              <div>
                <p className="text-sm text-gray-600 mb-2">ຄະແນນ:</p>
                <StarPicker value={myRating} onChange={setMyRating} />
              </div>
              <textarea value={myComment} onChange={e => setMyComment(e.target.value)}
                placeholder="ແບ່ງປັນຄວາມຄິດເຫັນຂອງທ່ານ..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1247D8] resize-none" />
              <button type="submit" disabled={submitting}
                className="flex items-center gap-2 bg-[#1247D8] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#0d35b0] transition-colors disabled:opacity-60">
                <Send size={14} />
                {submitting ? 'ກຳລັງສົ່ງ...' : 'ສົ່ງລີວິວ'}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 text-sm mb-3">ກະລຸນາເຂົ້າສູ່ລະບົບເພື່ອຂຽນລີວິວ</p>
              <a href="/login" className="bg-[#1247D8] text-white font-bold px-6 py-2 rounded-xl text-sm">ເຂົ້າສູ່ລະບົບ</a>
            </div>
          )}
        </div>

        {/* Review list */}
        {reviews.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <Star size={32} className="mx-auto mb-2 text-gray-200" />
            <p className="text-sm">ຍັງບໍ່ມີລີວິວ — ເປັນຄົນທຳອິດທີ່ລີວິວ!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(r => (
              <div key={r.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#1247D8] flex items-center justify-center text-white font-black text-sm">
                      {r.user_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{r.user_name}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star key={i} size={11} className={i <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleDateString('lo-LA', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </span>
                </div>
                {r.comment && <p className="text-gray-600 text-sm mt-3 leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
