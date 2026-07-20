'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { useCart } from '@/store/cart'
import { fmt, discountPct, supabase, type Product } from '@/lib/supabase'
import { useState, useEffect } from 'react'

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
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group border border-gray-100 flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {p.image_url ? (
          <Image src={p.image_url} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
        )}
        {pct > 0 && (
          <div className="absolute top-0 left-0 bg-[#EE4D2D] text-white text-xs font-black px-2 py-1 rounded-br-xl">
            -{pct}%
          </div>
        )}
        <button onClick={toggleWish}
          className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center transition-transform hover:scale-110">
          <Heart size={14} className={wished ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
        </button>
      </div>

      <div className="p-3 flex flex-col flex-1">
        <p className="text-gray-800 text-sm font-medium line-clamp-2 flex-1">{p.name}</p>

        {p.rating && (
          <div className="flex items-center gap-1 mt-1">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-xs text-gray-500">{p.rating} · {p.review_count} ລີວິວ</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-2">
          <div>
            <div className="text-[#1247D8] font-black text-base">{fmt(display)}</div>
            {pct > 0 && <div className="text-gray-400 text-xs line-through">{fmt(p.price)}</div>}
          </div>
          <button onClick={handleAdd}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm ${added ? 'bg-green-500' : 'bg-[#1247D8] hover:bg-[#0d35b0]'}`}>
            {added ? <span className="text-white text-sm">✓</span> : <ShoppingCart size={15} className="text-white" />}
          </button>
        </div>
      </div>
    </Link>
  )
}
