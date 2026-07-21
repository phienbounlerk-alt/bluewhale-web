'use client'
import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { fmt, discountPct, type Product } from '@/lib/supabase'
import { useCart } from '@/store/cart'
import { useState } from 'react'

interface Props {
  title: string
  icon: string
  products: Product[]
  href?: string
  accent?: string
}

export default function ProductRowSection({ title, icon, products, href = '/products', accent = '#1247D8' }: Props) {
  const add = useCart(s => s.add)
  const [added, setAdded] = useState<string | null>(null)

  const handleAdd = (e: React.MouseEvent, p: Product) => {
    e.preventDefault()
    add(p)
    setAdded(p.id)
    setTimeout(() => setAdded(null), 1500)
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: accent }} />
          <span className="text-lg">{icon}</span>
          <h2 className="font-black text-gray-800 text-base">{title}</h2>
        </div>
        <Link href={href} className="text-xs font-bold px-3 py-1 rounded-full border transition-colors hover:text-white"
          style={{ color: accent, borderColor: accent + '40' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = accent }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '' }}>
          ທັງໝົດ →
        </Link>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-3 overflow-x-auto px-4 py-3 pb-4 scrollbar-hide snap-x snap-mandatory">
        {products.map(p => {
          const pct = discountPct(p)
          const display = p.discount_price ?? p.price
          return (
            <Link key={p.id} href={`/products/${p.id}`}
              className="shrink-0 w-36 snap-start group">
              {/* Image */}
              <div className="relative w-36 h-36 bg-gray-50 rounded-xl overflow-hidden mb-2">
                {p.image_url
                  ? <Image src={p.image_url} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                  : <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                }
                {pct > 0 && (
                  <div className="absolute top-1.5 left-1.5 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full"
                    style={{ background: '#EE4D2D' }}>
                    -{pct}%
                  </div>
                )}
              </div>
              {/* Info */}
              <p className="text-gray-800 text-xs font-medium line-clamp-2 leading-snug mb-1">{p.name}</p>
              <div className="flex items-center justify-between gap-1">
                <div>
                  <div className="font-black text-sm" style={{ color: accent }}>{fmt(display)}</div>
                  {pct > 0 && <div className="text-gray-400 text-[10px] line-through">{fmt(p.price)}</div>}
                </div>
                <button onClick={e => handleAdd(e, p)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 shrink-0"
                  style={{ background: added === p.id ? '#22c55e' : accent }}>
                  {added === p.id
                    ? <span className="text-white text-xs">✓</span>
                    : <ShoppingCart size={13} className="text-white" />
                  }
                </button>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
