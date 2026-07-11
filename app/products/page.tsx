'use client'
import { useState, useEffect } from 'react'
import { getProducts, type Product } from '@/lib/supabase'
import ProductCard from '@/components/product/ProductCard'
import { Search, SlidersHorizontal } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

const cats = ['ທັງໝົດ', 'ເສື້ອຜ້າ', 'ອີເລັກໂທຣນິກ', 'ອາຫານ & ເຄື່ອງດື່ມ', 'ຄວາມງາມ', 'ຂອງໃຊ້ໃນບ້ານ']
const sorts = ['ໃໝ່ສຸດ', 'ລາຄາ: ຕ່ຳ→ສູງ', 'ລາຄາ: ສູງ→ຕ່ຳ', 'ຂາຍດີ']

function ProductsContent() {
  const sp = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [cat, setCat] = useState(sp.get('cat') || 'ທັງໝົດ')
  const [q, setQ] = useState(sp.get('q') || '')
  const [sort, setSort] = useState('ໃໝ່ສຸດ')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getProducts(cat === 'ທັງໝົດ' ? undefined : cat).then(d => {
      setProducts(d)
      setLoading(false)
    })
  }, [cat])

  const filtered = products
    .filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.category.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'ລາຄາ: ຕ່ຳ→ສູງ') return (a.discount_price ?? a.price) - (b.discount_price ?? b.price)
      if (sort === 'ລາຄາ: ສູງ→ຕ່ຳ') return (b.discount_price ?? b.price) - (a.discount_price ?? a.price)
      if (sort === 'ຂາຍດີ') return (b.review_count ?? 0) - (a.review_count ?? 0)
      return 0
    })

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search bar */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 flex bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="ຄົ້ນຫາສິນຄ້າ..."
            className="flex-1 px-4 py-3 text-sm outline-none" />
          <div className="px-3 flex items-center text-gray-400"><Search size={18} /></div>
        </div>
        <select value={sort} onChange={e => setSort(e.target.value)}
          className="bg-white border border-gray-200 rounded-xl px-3 text-sm shadow-sm outline-none">
          {sorts.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-bold transition-colors ${cat === c ? 'bg-[#1247D8] text-white' : 'bg-white text-gray-600 hover:bg-gray-100'}`}>
            {c}
          </button>
        ))}
      </div>

      {/* Count */}
      <p className="text-gray-500 text-sm mb-4">{filtered.length} ລາຍການ</p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl aspect-[3/4] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <div className="text-5xl mb-4">🔍</div>
          <p>ບໍ່ພົບສິນຄ້າ "{q}"</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-10 text-center text-gray-400">ກຳລັງໂຫຼດ...</div>}>
      <ProductsContent />
    </Suspense>
  )
}
