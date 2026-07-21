'use client'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { fmt, type Product } from '@/lib/supabase'

const KEY = 'bw_recent'

export function trackView(productId: string) {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(KEY)
    const ids: string[] = raw ? JSON.parse(raw) : []
    const filtered = ids.filter((id: string) => id !== productId)
    localStorage.setItem(KEY, JSON.stringify([productId, ...filtered].slice(0, 10)))
  } catch {}
}

export default function RecentlyViewedSection({ products }: { products: Product[] }) {
  const [recent, setRecent] = useState<Product[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return
      const ids: string[] = JSON.parse(raw)
      const ordered = ids
        .map(id => products.find(p => p.id === id))
        .filter(Boolean) as Product[]
      setRecent(ordered.slice(0, 6))
    } catch {}
  }, [products])

  if (recent.length === 0) return null

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-gray-400 rounded-full" />
          <span className="text-lg">🕐</span>
          <h2 className="font-black text-gray-800 text-base">ເບິ່ງລ່າສຸດ</h2>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 py-3 pb-4 scrollbar-hide snap-x">
        {recent.map(p => (
          <Link key={p.id} href={`/products/${p.id}`}
            className="shrink-0 w-24 snap-start group">
            <div className="relative w-24 h-24 bg-gray-50 rounded-xl overflow-hidden mb-1.5">
              {p.image_url
                ? <Image src={p.image_url} alt={p.name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
              }
            </div>
            <p className="text-gray-700 text-[11px] font-medium line-clamp-2 leading-tight">{p.name}</p>
            <p className="text-[#1247D8] text-xs font-black mt-0.5">{fmt(p.discount_price ?? p.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
