'use client'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { getProducts, fmt, discountPct, type Product } from '@/lib/supabase'
import ProductCard from '@/components/product/ProductCard'
import SearchDropdown, { pushHistory } from '@/components/search/SearchDropdown'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import {
  SlidersHorizontal, X, ChevronDown, ChevronUp,
  Truck, Tag, Star, RotateCcw
} from 'lucide-react'

const CATS  = ['ທັງໝົດ', 'ເສື້ອຜ້າ', 'ອີເລັກໂທຣນິກ', 'ອາຫານ & ເຄື່ອງດື່ມ', 'ຄວາມງາມ', 'ຂອງໃຊ້ໃນບ້ານ']
const CAT_ICONS: Record<string, string> = {
  'ທັງໝົດ': '🛍', 'ເສື້ອຜ້າ': '👗', 'ອີເລັກໂທຣນິກ': '📱',
  'ອາຫານ & ເຄື່ອງດື່ມ': '🍜', 'ຄວາມງາມ': '💄', 'ຂອງໃຊ້ໃນບ້ານ': '🏠',
}
const SORTS = [
  { id: 'new',       label: 'ໃໝ່ສຸດ' },
  { id: 'price_asc', label: 'ລາຄາຕ່ຳ→ສູງ' },
  { id: 'price_desc',label: 'ລາຄາສູງ→ຕ່ຳ' },
  { id: 'popular',   label: 'ຂາຍດີ' },
  { id: 'rating',    label: 'ຄະແນນດີ' },
]

const PRICE_PRESETS = [
  { label: 'ທຸກລາຄາ', min: 0,       max: Infinity },
  { label: '< ₭100k', min: 0,       max: 100000 },
  { label: '₭100–500k', min: 100000, max: 500000 },
  { label: '₭500k–1M', min: 500000, max: 1000000 },
  { label: '> ₭1M',   min: 1000000, max: Infinity },
]

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [dv, setDv] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return dv
}

// ── Filter drawer ─────────────────────────────────────────────────────────────
interface FilterState {
  priceMin: number
  priceMax: number
  hasDiscount: boolean
  freeShipping: boolean
  minRating: number
  pricePreset: number
}

const DEFAULT_FILTER: FilterState = {
  priceMin: 0, priceMax: Infinity,
  hasDiscount: false, freeShipping: false,
  minRating: 0, pricePreset: 0,
}

function FilterDrawer({
  open, onClose, filter, setFilter, activeCount,
}: {
  open: boolean
  onClose: () => void
  filter: FilterState
  setFilter: (f: FilterState) => void
  activeCount: number
}) {
  const [local, setLocal] = useState<FilterState>(filter)

  useEffect(() => { if (open) setLocal(filter) }, [open, filter])

  const toggle = (k: keyof FilterState, v: any) => setLocal(f => ({ ...f, [k]: v }))

  const applyPreset = (i: number) => {
    const p = PRICE_PRESETS[i]
    setLocal(f => ({ ...f, pricePreset: i, priceMin: p.min, priceMax: p.max }))
  }

  const handleApply = () => { setFilter(local); onClose() }
  const handleReset = () => { setLocal(DEFAULT_FILTER); setFilter(DEFAULT_FILTER); onClose() }

  if (!open) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm" onClick={onClose} />
      {/* Drawer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto bg-white rounded-t-3xl shadow-2xl overflow-hidden">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-100">
          <h3 className="font-black text-gray-800">ການຄັດກອງ</h3>
          <div className="flex items-center gap-3">
            {activeCount > 0 && (
              <button onClick={handleReset} className="text-xs text-red-400 font-bold flex items-center gap-1 hover:text-red-600">
                <RotateCcw size={11} /> ລ້າງ ({activeCount})
              </button>
            )}
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[70vh] px-5 py-4 space-y-5">

          {/* Price range presets */}
          <div>
            <p className="text-xs font-black text-gray-500 mb-3 flex items-center gap-2">
              <Tag size={12} /> ລາຄາ
            </p>
            <div className="grid grid-cols-3 gap-2">
              {PRICE_PRESETS.map((p, i) => (
                <button key={p.label} onClick={() => applyPreset(i)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border-2 transition-all ${local.pricePreset === i ? 'border-[#1247D8] bg-blue-50 text-[#1247D8]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Min rating */}
          <div>
            <p className="text-xs font-black text-gray-500 mb-3 flex items-center gap-2">
              <Star size={12} /> ຄະແນນຂັ້ນຕ່ຳ
            </p>
            <div className="flex gap-2">
              {[0, 3, 4, 4.5].map(r => (
                <button key={r} onClick={() => toggle('minRating', r)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${local.minRating === r ? 'border-[#1247D8] bg-blue-50 text-[#1247D8]' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                  {r === 0 ? 'ທັງໝົດ' : `${r}★+`}
                </button>
              ))}
            </div>
          </div>

          {/* Toggle filters */}
          <div className="space-y-3">
            <p className="text-xs font-black text-gray-500">ຕົວກອງເພີ່ມ</p>
            {[
              { key: 'hasDiscount',  label: 'ສ່ວນຫຼຸດເທົ່ານັ້ນ', icon: <Tag size={14} className="text-red-500" />, color: 'text-[#EE4D2D]' },
              { key: 'freeShipping', label: 'ສົ່ງຟຣີ',            icon: <Truck size={14} className="text-green-500" />, color: 'text-green-600' },
            ].map(({ key, label, icon, color }) => (
              <label key={key} className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${local[key as keyof FilterState] ? 'border-[#1247D8] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="flex items-center gap-2.5">
                  {icon}
                  <span className={`text-sm font-bold ${local[key as keyof FilterState] ? color : 'text-gray-700'}`}>{label}</span>
                </div>
                <div className={`w-10 h-5 rounded-full transition-all relative ${local[key as keyof FilterState] ? 'bg-[#1247D8]' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${local[key as keyof FilterState] ? 'left-5' : 'left-0.5'}`} />
                </div>
                <input type="checkbox" checked={!!local[key as keyof FilterState]}
                  onChange={e => toggle(key as keyof FilterState, e.target.checked)} className="hidden" />
              </label>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-3">
          <button onClick={handleReset}
            className="flex-1 py-3 rounded-2xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-gray-300 transition-colors">
            ລ້າງ
          </button>
          <button onClick={handleApply}
            className="flex-2 flex-[2] py-3 rounded-2xl bg-[#1247D8] text-white font-black text-sm hover:bg-[#0d35b0] transition-colors active:scale-[0.98]">
            ນຳໃຊ້ຕົວກອງ
          </button>
        </div>
      </div>
    </>
  )
}

// ── Main products content ─────────────────────────────────────────────────────
function ProductsContent() {
  const sp     = useSearchParams()
  const router = useRouter()

  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [cat,   setCat]   = useState(sp.get('cat') || sp.get('category') || 'ທັງໝົດ')
  const [q,     setQ]     = useState(sp.get('q') || '')
  const [sort,  setSort]  = useState('new')
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<FilterState>(DEFAULT_FILTER)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [showSort, setShowSort]     = useState(false)
  const sortRef = useRef<HTMLDivElement>(null)

  const debouncedQ = useDebounce(q, 280)

  // ── Load products ──
  useEffect(() => {
    setLoading(true)
    getProducts(cat === 'ທັງໝົດ' ? undefined : cat).then(data => {
      setAllProducts(data)
      setLoading(false)
    })
  }, [cat])

  // ── Close sort on outside click ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSort(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Filtered + sorted products (memoized) ──
  const filtered = useMemo(() => {
    return allProducts
      .filter(p => {
        if (debouncedQ && !(
          p.name.toLowerCase().includes(debouncedQ.toLowerCase()) ||
          p.category.toLowerCase().includes(debouncedQ.toLowerCase()) ||
          (p.description ?? '').toLowerCase().includes(debouncedQ.toLowerCase())
        )) return false
        const price = p.discount_price ?? p.price
        if (price < filter.priceMin) return false
        if (filter.priceMax !== Infinity && price > filter.priceMax) return false
        if (filter.hasDiscount && !p.discount_price) return false
        if (filter.freeShipping && !p.is_free_shipping) return false
        if (filter.minRating > 0 && (p.rating ?? 0) < filter.minRating) return false
        return true
      })
      .sort((a, b) => {
        const pa = a.discount_price ?? a.price, pb = b.discount_price ?? b.price
        if (sort === 'price_asc')  return pa - pb
        if (sort === 'price_desc') return pb - pa
        if (sort === 'popular')    return (b.review_count ?? 0) - (a.review_count ?? 0)
        if (sort === 'rating')     return (b.rating ?? 0) - (a.rating ?? 0)
        return 0
      })
  }, [allProducts, debouncedQ, sort, filter])

  // ── Handle category change ──
  const handleCat = useCallback((c: string) => {
    setCat(c)
    router.replace(`/products?cat=${encodeURIComponent(c)}${q ? `&q=${encodeURIComponent(q)}` : ''}`, { scroll: false })
  }, [q, router])

  // ── Handle search from dropdown ──
  const handleSearch = useCallback((query: string) => {
    pushHistory(query)
    setQ(query)
    router.replace(`/products?q=${encodeURIComponent(query)}${cat !== 'ທັງໝົດ' ? `&cat=${encodeURIComponent(cat)}` : ''}`, { scroll: false })
  }, [cat, router])

  // ── Count active filters ──
  const activeFilterCount = [
    filter.pricePreset > 0,
    filter.hasDiscount,
    filter.freeShipping,
    filter.minRating > 0,
  ].filter(Boolean).length

  const productNames = useMemo(() => allProducts.map(p => p.name), [allProducts])
  const currentSort  = SORTS.find(s => s.id === sort) ?? SORTS[0]

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">

      {/* ── Search bar ── */}
      <form onSubmit={e => { e.preventDefault(); handleSearch(q) }} className="mb-4">
        <SearchDropdown
          value={q}
          onChange={setQ}
          onSearch={handleSearch}
          productNames={productNames}
          placeholder="ຄົ້ນຫາສິນຄ້າ..."
        />
      </form>

      {/* ── Category chips ── */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {CATS.map(c => (
          <button key={c} onClick={() => handleCat(c)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${cat === c ? 'bg-[#1247D8] text-white shadow-md shadow-blue-200' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#1247D8]/50 hover:text-[#1247D8]'}`}>
            <span>{CAT_ICONS[c]}</span>
            {c}
          </button>
        ))}
      </div>

      {/* ── Filter + Sort toolbar ── */}
      <div className="flex items-center gap-2 mb-4">
        {/* Filter button */}
        <button onClick={() => setDrawerOpen(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition-all ${activeFilterCount > 0 ? 'bg-[#1247D8] text-white border-[#1247D8] shadow-md shadow-blue-200' : 'bg-white text-gray-600 border-gray-200 hover:border-[#1247D8]/50'}`}>
          <SlidersHorizontal size={13} />
          ຕົວກອງ
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-white text-[#1247D8] text-[10px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Active filter pills */}
        {filter.pricePreset > 0 && (
          <span className="flex items-center gap-1 bg-blue-50 text-[#1247D8] border border-blue-200 px-2.5 py-1.5 rounded-xl text-[10px] font-bold">
            {PRICE_PRESETS[filter.pricePreset].label}
            <button onClick={() => setFilter(f => ({ ...f, pricePreset: 0, priceMin: 0, priceMax: Infinity }))}><X size={10} /></button>
          </span>
        )}
        {filter.hasDiscount && (
          <span className="flex items-center gap-1 bg-red-50 text-red-500 border border-red-200 px-2.5 py-1.5 rounded-xl text-[10px] font-bold">
            ສ່ວນຫຼຸດ <button onClick={() => setFilter(f => ({ ...f, hasDiscount: false }))}><X size={10} /></button>
          </span>
        )}
        {filter.freeShipping && (
          <span className="flex items-center gap-1 bg-green-50 text-green-600 border border-green-200 px-2.5 py-1.5 rounded-xl text-[10px] font-bold">
            ສົ່ງຟຣີ <button onClick={() => setFilter(f => ({ ...f, freeShipping: false }))}><X size={10} /></button>
          </span>
        )}
        {filter.minRating > 0 && (
          <span className="flex items-center gap-1 bg-yellow-50 text-yellow-600 border border-yellow-200 px-2.5 py-1.5 rounded-xl text-[10px] font-bold">
            {filter.minRating}★+ <button onClick={() => setFilter(f => ({ ...f, minRating: 0 }))}><X size={10} /></button>
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Sort dropdown */}
        <div ref={sortRef} className="relative">
          <button onClick={() => setShowSort(v => !v)}
            className="flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-2 rounded-xl text-xs font-bold text-gray-600 hover:border-[#1247D8]/50 transition-colors">
            {currentSort.label}
            {showSort ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {showSort && (
            <div className="absolute right-0 top-full mt-1 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-30 w-40">
              {SORTS.map(s => (
                <button key={s.id} onClick={() => { setSort(s.id); setShowSort(false) }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-bold transition-colors ${sort === s.id ? 'text-[#1247D8] bg-blue-50' : 'text-gray-600 hover:bg-gray-50'}`}>
                  {sort === s.id && <span className="mr-1">✓</span>}{s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Results count ── */}
      <div className="flex items-center gap-2 mb-3">
        <p className="text-gray-500 text-xs">
          {loading ? 'ກຳລັງໂຫຼດ...' : (
            <>
              <span className="font-black text-gray-700">{filtered.length}</span> ລາຍການ
              {debouncedQ && <span className="ml-1">ສຳລັບ "<span className="text-[#1247D8] font-bold">{debouncedQ}</span>"</span>}
              {cat !== 'ທັງໝົດ' && <span className="ml-1">ໃນ <span className="text-[#1247D8] font-bold">{cat}</span></span>}
            </>
          )}
        </p>
        {(debouncedQ || activeFilterCount > 0 || cat !== 'ທັງໝົດ') && (
          <button onClick={() => { setQ(''); setFilter(DEFAULT_FILTER); setCat('ທັງໝົດ') }}
            className="text-[10px] text-red-400 font-bold hover:text-red-600 flex items-center gap-0.5 ml-1">
            <RotateCcw size={10} /> ລ້າງ
          </button>
        )}
      </div>

      {/* ── Product grid ── */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array(10).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl aspect-[3/4] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-700 font-black text-lg mb-2">ບໍ່ພົບສິນຄ້າ</p>
          {debouncedQ && <p className="text-gray-400 text-sm mb-4">ສຳລັບ "<span className="font-bold">{debouncedQ}</span>"</p>}
          <button onClick={() => { setQ(''); setFilter(DEFAULT_FILTER); setCat('ທັງໝົດ') }}
            className="bg-[#1247D8] text-white font-bold px-6 py-2.5 rounded-2xl hover:bg-[#0d35b0] transition-colors">
            ລ້າງຕົວກອງ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      )}

      {/* Filter drawer */}
      <FilterDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filter={filter}
        setFilter={setFilter}
        activeCount={activeFilterCount}
      />
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-10 text-center">
        <div className="w-8 h-8 border-2 border-[#1247D8] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  )
}
