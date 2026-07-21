'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { useCart } from '@/store/cart'
import { fmt, discountPct, supabase, type Product } from '@/lib/supabase'
import { useState, useEffect } from 'react'

function fmtSold(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k'
  return String(n)
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 flex flex-col">
      <div className="skeleton aspect-square" />
      <div className="p-3 flex flex-col gap-2">
        <div className="skeleton h-3 rounded-lg w-full" />
        <div className="skeleton h-3 rounded-lg w-3/4" />
        <div className="skeleton h-3 rounded-lg w-1/2" />
        <div className="flex items-end justify-between mt-1">
          <div className="skeleton h-5 rounded-lg w-24" />
          <div className="skeleton h-8 rounded-xl w-20" />
        </div>
      </div>
    </div>
  )
}

export default function ProductCard({ p }: { p: Product }) {
  const add = useCart(s => s.add)
  const [added, setAdded] = useState(false)
  const [wished, setWished] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return
      setUserId(data.user.id)
      supabase.from('wishlists').select('id').eq('user_id', data.user.id).eq('product_id', p.id).single()
        .then(({ data: w }) => setWished(!!w))
    })
  }, [p.id])

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    add(p)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  const toggleWish = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!userId) { window.location.href = '/login'; return }
    if (wished) {
      await supabase.from('wishlists').delete().eq('user_id', userId).eq('product_id', p.id)
    } else {
      await supabase.from('wishlists').insert({ user_id: userId, product_id: p.id })
    }
    setWished(!wished)
  }

  const pct = discountPct(p)
  const display = p.discount_price ?? p.price

  return (
    <Link href={`/products/${p.id}`}
      className="card-hover bg-white rounded-2xl overflow-hidden shadow-[var(--shadow-card)] border border-gray-100/80 flex flex-col group">

      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {p.image_url ? (
          <Image
            src={p.image_url} alt={p.name} fill
            className="object-cover group-hover:scale-[1.07] transition-transform duration-500 ease-out"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
        )}

        {/* Discount badge */}
        {pct > 0 && (
          <div className="absolute top-2 left-2 bg-[#EE4D2D] text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pop-in">
            -{pct}%
          </div>
        )}

        {/* Wishlist button */}
        <button onClick={toggleWish}
          className="absolute top-2 right-2 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full shadow-md flex items-center justify-center btn-press">
          <Heart
            size={16}
            className={`transition-all duration-200 ${wished ? 'fill-red-500 text-red-500 scale-110' : 'text-gray-400 hover:text-red-400'}`}
          />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1 gap-1.5">
        <p className="text-gray-800 text-sm font-medium line-clamp-2 leading-snug flex-1">{p.name}</p>

        {/* Rating + sold */}
        {p.rating ? (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1">
              <Star size={10} className="text-yellow-400 fill-yellow-400 shrink-0" />
              <span className="text-xs text-gray-500">
                {p.rating}{p.review_count ? ` (${p.review_count})` : ''}
              </span>
            </div>
            {p.sold_count != null && (
              <span className="text-[11px] text-gray-400">ຂາຍແລ້ວ {fmtSold(p.sold_count)}</span>
            )}
          </div>
        ) : p.sold_count != null ? (
          <span className="text-[11px] text-gray-400">ຂາຍແລ້ວ {fmtSold(p.sold_count)}</span>
        ) : null}

        {/* Free shipping badge */}
        {p.is_free_shipping && (
          <span className="self-start text-[10px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full">
            ສົ່ງຟຣີ
          </span>
        )}

        {/* Price + Add to cart */}
        <div className="flex items-end justify-between gap-2 mt-auto pt-1">
          <div className="min-w-0">
            <div className="text-[#1247D8] font-black text-base leading-tight">{fmt(display)}</div>
            {pct > 0 && <div className="text-gray-400 text-xs line-through">{fmt(p.price)}</div>}
          </div>
          <button
            onClick={handleAdd}
            className={`btn-press shrink-0 flex items-center gap-1.5 px-3 h-8 rounded-xl text-white text-xs font-bold shadow-sm transition-colors ${added ? 'bg-green-500' : 'bg-[#1247D8] hover:bg-[#0d35b0]'}`}>
            {added
              ? <><span className="animate-pop-in">✓</span><span>ເພີ່ມແລ້ວ</span></>
              : <><ShoppingCart size={13} /><span>ໃສ່ກະຕ່າ</span></>
            }
          </button>
        </div>
      </div>
    </Link>
  )
}
