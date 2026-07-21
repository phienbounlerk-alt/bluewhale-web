'use client'
import Link from 'next/link'
import { ShoppingCart, User, Menu, X } from 'lucide-react'
import { useCart } from '@/store/cart'
import { useAuth } from '@/lib/auth-context'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import SearchDropdown, { pushHistory } from '@/components/search/SearchDropdown'
import { getProducts, type Product } from '@/lib/supabase'

const CATS = ['ທັງໝົດ','ເສື້ອຜ້າ','ອີເລັກໂທຣນິກ','ອາຫານ & ເຄື່ອງດື່ມ','ຄວາມງາມ','ຂອງໃຊ້ໃນບ້ານ']

export default function Navbar() {
  const count  = useCart(s => s.count())
  const { user, signOut } = useAuth()
  const [open, setOpen]   = useState(false)
  const [q, setQ]         = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const router = useRouter()

  // Lazy-load product names for suggestions (once)
  useEffect(() => {
    getProducts().then(p => setProducts(p))
  }, [])

  const productNames = products.map(p => p.name)

  const handleSearch = (query: string) => {
    if (!query.trim()) return
    pushHistory(query)
    router.push(`/products?q=${encodeURIComponent(query.trim())}`)
  }

  return (
    <nav className="bg-[#1247D8] sticky top-0 z-50 shadow-lg">

      {/* ── MOBILE HEADER ── */}
      <div className="sm:hidden flex items-center gap-2 px-3 py-2">
        <Link href="/" className="shrink-0 flex items-center justify-center w-8 h-8">
          <span className="text-[22px] leading-none">🐋</span>
        </Link>

        {/* Search with dropdown */}
        <form onSubmit={e => { e.preventDefault(); handleSearch(q) }} className="flex-1 min-w-0">
          <SearchDropdown
            value={q}
            onChange={setQ}
            onSearch={handleSearch}
            productNames={productNames}
            placeholder="ຄົ້ນຫາສິນຄ້າ..."
            navbarMode
            inputClassName="text-sm"
          />
        </form>

        <Link href="/cart" className="relative shrink-0 w-9 h-9 flex items-center justify-center">
          <ShoppingCart size={20} className="text-white" />
          {count > 0 && (
            <span className="absolute top-0.5 right-0.5 bg-[#EE4D2D] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Link>

        <button onClick={() => setOpen(!open)}
          className="shrink-0 w-9 h-9 flex items-center justify-center text-white"
          aria-label="ເມນູ">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── DESKTOP HEADER ── */}
      <div className="hidden sm:flex items-center gap-3 max-w-7xl mx-auto px-4 py-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🐋</span>
          <span className="text-white font-black text-xl tracking-tight">BlueWhale</span>
        </Link>

        <form onSubmit={e => { e.preventDefault(); handleSearch(q) }} className="flex-1 max-w-xl mx-2">
          <SearchDropdown
            value={q}
            onChange={setQ}
            onSearch={handleSearch}
            productNames={productNames}
            placeholder="ຄົ້ນຫາສິນຄ້າ..."
            navbarMode={false}
            inputClassName="py-1.5"
          />
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/cart" className="relative p-2">
            <ShoppingCart size={22} className="text-white" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#EE4D2D] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </Link>
          {user ? (
            <Link href="/profile" className="p-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                <span className="text-white text-xs font-black">
                  {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/login" className="p-2 hover:bg-white/10 rounded-xl transition-colors">
              <User size={22} className="text-white" />
            </Link>
          )}
        </div>
      </div>

      {/* Mobile menu drawer */}
      {open && (
        <div className="sm:hidden bg-[#0d35b0] px-3 pb-2 pt-1 flex flex-wrap gap-1.5">
          {CATS.map(c => (
            <Link key={c} href={`/products?cat=${encodeURIComponent(c)}`}
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white text-xs py-1.5 px-3 rounded-lg hover:bg-white/10 transition-colors">
              {c}
            </Link>
          ))}
        </div>
      )}

      {/* Desktop categories */}
      <div className="bg-[#0d35b0] hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {CATS.map(c => (
            <Link key={c} href={`/products?cat=${encodeURIComponent(c)}`}
              className="text-white/80 hover:text-white text-sm py-2 px-4 hover:bg-white/10 rounded transition-colors">
              {c}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
