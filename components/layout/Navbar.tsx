'use client'
import Link from 'next/link'
import { ShoppingCart, User, Menu, X, Search, Camera } from 'lucide-react'
import { useCart } from '@/store/cart'
import { useAuth } from '@/lib/auth-context'
import { useState, useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import SearchDropdown, { pushHistory } from '@/components/search/SearchDropdown'
import { getProducts, type Product } from '@/lib/supabase'

const CATS = ['ທັງໝົດ','ເສື້ອຜ້າ','ອີເລັກໂທຣນິກ','ອາຫານ & ເຄື່ອງດື່ມ','ຄວາມງາມ','ຂອງໃຊ້ໃນບ້ານ']

export default function Navbar() {
  const count = useCart(s => s.count())
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const router = useRouter()
  const pathname = usePathname()
  const searchInputRef = useRef<HTMLInputElement>(null)
  // JS innerWidth instead of CSS breakpoints — fixes iframe device-width viewport issue
  const [isMobile, setIsMobile] = useState(true)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    getProducts().then(p => setProducts(p))
  }, [])

  if (pathname === '/login' || pathname === '/register' || pathname === '/profile' || pathname === '/cart' || pathname === '/notifications') return null

  const productNames = products.map(p => p.name)

  const handleSearch = (query: string) => {
    if (!query.trim()) return
    pushHistory(query)
    router.push(`/products?q=${encodeURIComponent(query.trim())}`)
  }

  if (isMobile) {
    return (
      <nav className="bg-[#1247D8] sticky top-0 z-50 shadow-lg">
        {/* Search bar row — slides in when search icon tapped */}
        {searchOpen ? (
          <div className="flex items-center gap-2 px-3 py-2">
            <button onClick={() => { setSearchOpen(false); setQ('') }}
              className="shrink-0 text-white">
              <X size={22} />
            </button>
            <form onSubmit={e => { e.preventDefault(); handleSearch(q); setSearchOpen(false) }} className="flex-1 min-w-0">
              <SearchDropdown
                value={q}
                onChange={setQ}
                onSearch={q => { handleSearch(q); setSearchOpen(false) }}
                productNames={productNames}
                placeholder="ຄົ້ນຫາສິນຄ້າ..."
                navbarMode
                inputClassName="text-sm"
              />
            </form>
          </div>
        ) : (
          /* Main header row — Facebook style */
          <div className="flex items-center gap-3 px-3 py-2">
            <button onClick={() => setOpen(!open)}
              className="text-white shrink-0" aria-label="ເມນູ">
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link href="/" className="text-white font-black text-xl tracking-tight leading-none shrink-0">
              BlueWhale
            </Link>
            {/* Long search pill */}
            <div className="flex-1 flex items-center bg-white/15 rounded-full overflow-hidden">
              <button onClick={() => setSearchOpen(true)}
                className="flex-1 flex items-center gap-2 px-4 py-2 active:bg-white/10 transition-colors"
                aria-label="ຄົ້ນຫາ">
                <Search size={14} className="shrink-0 text-white/70" />
                <span className="text-white/60 text-sm truncate">ຄົ້ນຫາສິນຄ້າ...</span>
              </button>
              {/* Camera / image search button */}
              <button
                onClick={() => { setSearchOpen(true); }}
                className="shrink-0 pr-3 pl-1 py-2 text-white/70 active:text-white transition-colors"
                aria-label="ຄົ້ນຫາດ້ວຍຮູບ">
                <Camera size={16} />
              </button>
            </div>
          </div>
        )}

        {open && !searchOpen && (
          <div className="bg-[#0d35b0] px-3 pb-2 pt-1 flex flex-wrap gap-1.5">
            {CATS.map(c => (
              <Link key={c} href={`/products?cat=${encodeURIComponent(c)}`}
                onClick={() => setOpen(false)}
                className="text-white/80 hover:text-white text-xs py-1.5 px-3 rounded-lg hover:bg-white/10 transition-colors">
                {c}
              </Link>
            ))}
          </div>
        )}
      </nav>
    )
  }

  return (
    <nav className="bg-[#1247D8] sticky top-0 z-50 shadow-lg">
      <div className="flex items-center gap-3 max-w-7xl mx-auto px-4 py-3">
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
      <div className="bg-[#0d35b0]">
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
