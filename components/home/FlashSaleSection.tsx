'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { fmt, discountPct, type Product } from '@/lib/supabase'
import { useCart } from '@/store/cart'

function useCountdown(hours = 2, minutes = 43, seconds = 33) {
  const [time, setTime] = useState(hours * 3600 + minutes * 60 + seconds)
  useEffect(() => {
    const t = setInterval(() => setTime(s => (s > 0 ? s - 1 : 0)), 1000)
    return () => clearInterval(t)
  }, [])
  const h = String(Math.floor(time / 3600)).padStart(2, '0')
  const m = String(Math.floor((time % 3600) / 60)).padStart(2, '0')
  const s = String(time % 60).padStart(2, '0')
  return { h, m, s }
}

export default function FlashSaleSection({ products }: { products: Product[] }) {
  const { h, m, s } = useCountdown()
  const add = useCart(st => st.add)
  const [added, setAdded] = useState<string | null>(null)

  const handleAdd = (e: React.MouseEvent, p: Product) => {
    e.preventDefault()
    add(p)
    setAdded(p.id)
    setTimeout(() => setAdded(null), 1500)
  }

  return (
    <div className="bg-[#0E1420] rounded-2xl p-4 shadow-[0_4px_24px_rgba(0,0,0,.20)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[#EE4D2D] text-xl animate-bounce-y">⚡</span>
            <span className="text-white font-black text-lg tracking-tight">Flash Sale</span>
          </div>
          {/* Countdown */}
          <div className="flex items-center gap-1">
            {[h, m, s].map((t, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="bg-[#EE4D2D] text-white font-black text-sm px-2 py-0.5 rounded-lg min-w-[28px] text-center tabular-nums shadow-sm">
                  {t}
                </span>
                {i < 2 && <span className="text-[#EE4D2D] font-black text-sm">:</span>}
              </span>
            ))}
          </div>
        </div>
        <Link href="/products"
          className="text-[#EE4D2D] text-sm font-bold hover:text-red-300 transition-colors">
          ທັງໝົດ →
        </Link>
      </div>

      {/* Products */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {products.map((p, idx) => {
          const pct = discountPct(p)
          const sold = Math.floor(Math.random() * 60) + 20
          return (
            <Link key={p.id} href={`/products/${p.id}`}
              className="card-hover shrink-0 w-36 bg-[#1A2540] rounded-xl overflow-hidden group animate-slide-up"
              style={{ animationDelay: `${idx * 40}ms` }}>
              <div className="relative w-full aspect-square overflow-hidden">
                {p.image_url
                  ? <Image
                      src={p.image_url} alt={p.name} fill
                      className="object-cover group-hover:scale-[1.07] transition-transform duration-500 ease-out"
                      unoptimized
                    />
                  : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                }
                {pct > 0 && (
                  <div className="absolute top-0 left-0 bg-[#EE4D2D] text-white text-xs font-black px-2 py-0.5 rounded-br-lg">
                    -{pct}%
                  </div>
                )}
              </div>
              <div className="p-2 space-y-1.5">
                <p className="text-white text-xs line-clamp-1 font-medium leading-snug">{p.name}</p>
                <p className="text-[#EE4D2D] font-black text-sm">{fmt(p.discount_price ?? p.price)}</p>
                {/* Sold bar */}
                <div>
                  <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#EE4D2D] to-[#ff7043] rounded-full transition-all"
                      style={{ width: `${sold}%` }}
                    />
                  </div>
                  <p className="text-white/50 text-[10px] mt-0.5">ລາຍ {sold}%</p>
                </div>
                <button
                  onClick={e => handleAdd(e, p)}
                  className={`btn-press w-full py-1.5 rounded-xl text-xs font-bold transition-colors shadow-sm ${
                    added === p.id
                      ? 'bg-green-500 text-white'
                      : 'bg-[#EE4D2D] text-white hover:bg-[#d63d1e]'
                  }`}>
                  {added === p.id ? '✓ ເພີ່ມແລ້ວ' : '🛒 ໃສ່ກະຕ່າ'}
                </button>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
