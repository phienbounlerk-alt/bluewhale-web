'use client'
import { useEffect, useState } from 'react'
import { getProduct, fmt, discountPct, type Product } from '@/lib/supabase'
import { useCart } from '@/store/cart'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Star, Shield, Truck, ArrowLeft } from 'lucide-react'
import { use } from 'react'
import { useRouter } from 'next/navigation'


export default function ProductDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [p, setP] = useState<Product | null>(null)
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const add = useCart(s => s.add)
  const router = useRouter()

  useEffect(() => { getProduct(id).then(setP) }, [id])

  if (!p) return <div className="flex items-center justify-center h-64 text-gray-400">ກຳລັງໂຫຼດ...</div>

  const pct = discountPct(p)
  const display = p.discount_price ?? p.price
  const allImages = p.images?.length ? p.images : (p.image_url ? [p.image_url] : [])

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) add(p)
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
          {/* Main image */}
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-white shadow-sm">
            {allImages[activeImg]
              ? <Image src={allImages[activeImg]} alt={p.name} fill className="object-cover" unoptimized />
              : <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>}
            {pct > 0 && (
              <div className="absolute top-4 left-4 bg-[#EE4D2D] text-white font-black px-3 py-1 rounded-xl text-sm">-{pct}%</div>
            )}
          </div>

          {/* Thumbnails row */}
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

          {/* Rating */}
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
            <div className="text-3xl font-black text-[#1247D8]">{fmt(display)}</div>
            {pct > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-400 line-through text-sm">{fmt(p.price)}</span>
                <span className="bg-[#EE4D2D] text-white text-xs font-bold px-2 py-0.5 rounded">ປະຫຍັດ {fmt(p.price - display)}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 text-sm leading-relaxed">{p.description}</p>

          {/* Trust badges */}
          <div className="flex gap-3">
            <div className="flex items-center gap-1 text-xs text-gray-500"><Truck size={14} className="text-[#1247D8]" /> ສົ່ງຟຣີ ≥₭200k</div>
            <div className="flex items-center gap-1 text-xs text-gray-500"><Shield size={14} className="text-green-500" /> ຮ້ານຢັ້ງຢືນ</div>
          </div>

          {/* Qty */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600 font-medium">ຈຳນວນ:</span>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-10 h-10 text-lg font-bold hover:bg-gray-100 transition-colors">−</button>
              <span className="w-12 text-center font-bold">{qty}</span>
              <button onClick={() => setQty(q => Math.min(p.stock, q + 1))} className="w-10 h-10 text-lg font-bold hover:bg-gray-100 transition-colors">+</button>
            </div>
            <span className="text-xs text-gray-400">ສາງ: {p.stock}</span>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button onClick={handleAdd}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white transition-all ${added ? 'bg-green-500' : 'bg-[#1247D8] hover:bg-[#0d35b0]'}`}>
              <ShoppingCart size={18} />
              {added ? 'ເພີ່ມແລ້ວ ✓' : 'ເພີ່ມໃສ່ກະຕ່າ'}
            </button>
            <button onClick={() => { handleAdd(); router.push('/cart') }}
              className="flex-1 flex items-center justify-center py-4 rounded-2xl font-black border-2 border-[#1247D8] text-[#1247D8] hover:bg-[#1247D8] hover:text-white transition-all">
              ຊື້ດ່ວນ →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
