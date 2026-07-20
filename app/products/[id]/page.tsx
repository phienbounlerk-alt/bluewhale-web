'use client'
import { useEffect, useState, useMemo } from 'react'
import { getProduct, fmt, discountPct, supabase, type Product, type ProductVariant } from '@/lib/supabase'
import { useCart } from '@/store/cart'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Star, Shield, Truck, ArrowLeft } from 'lucide-react'
import { use } from 'react'
import { useRouter } from 'next/navigation'

export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [p, setP] = useState<Product | null>(null)
  const [variants, setVariants] = useState<ProductVariant[]>([])
  const [selectedOpts, setSelectedOpts] = useState<Record<string, string>>({})
  const [activeImg, setActiveImg] = useState(0)
  const [added, setAdded] = useState(false)
  const add = useCart(s => s.add)
  const router = useRouter()

  useEffect(() => {
    getProduct(id).then(async prod => {
      setP(prod)
      if (prod?.id) {
        const { data } = await supabase.from('product_variants').select('*').eq('product_id', prod.id)
        setVariants(data ?? [])
      }
    })
  }, [id])

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
    </div>
  )
}
