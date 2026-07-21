'use client'
import Link from 'next/link'
import { ShoppingCart, Search, User, Menu, X } from 'lucide-react'
import { useCart } from '@/store/cart'
import { useAuth } from '@/lib/auth-context'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const count = useCart(s => s.count())
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const router = useRouter()

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) router.push(`/products?q=${encodeURIComponent(q.trim())}`)
  }

  const CATS = ['ທັງໝົດ','ເສື້ອຜ້າ','ອີເລັກໂທຣນິກ','ອາຫານ & ເຄື່ອງດື່ມ','ຄວາມງາມ','ຂອງໃຊ້ໃນບ້ານ']

  return (
    <nav className="bg-[#1247D8] sticky top-0 z-50 shadow-lg">

      {/* ── MOBILE HEADER ── */}
      <div className="sm:hidden flex items-center gap-2 px-3 py-2">
        {/* Logo */}
        <Link href="/" className="shrink-0 flex items-center justify-center w-8 h-8">
          <span className="text-[22px] leading-none">🐋</span>
        </Link>

        {/* Search — takes all remaining space */}
        <form onSubmit={search} className="flex-1 min-w-0">
          <div className="flex items-center bg-white rounded-lg overflow-hidden h-8">
            <input
              value={q} onChange={e => setQ(e.target.value)}
              placeholder="ຄົ້ນຫາສິນຄ້າ..."
              className="flex-1 min-w-0 px-3 text-sm text-gray-800 outline-none bg-transparent"
            />
            <button type="submit" className="bg-[#EE4D2D] h-8 px-2.5 flex items-center justify-center shrink-0">
              <Search size={14} className="text-white" />
            </button>
          </div>
        </form>

        {/* Cart */}
        <Link href="/cart" className="relative shrink-0 w-9 h-9 flex items-center justify-center">
          <ShoppingCart size={20} className="text-white" />
          {count > 0 && (
            <span className="absolute top-0.5 right-0.5 bg-[#EE4D2D] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
              {count}
            </span>
          )}
        </Link>

        {/* Menu toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="shrink-0 w-9 h-9 flex items-center justify-center text-white"
          aria-label="ເມນູ"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* ── DESKTOP HEADER ── */}
      <div className="hidden sm:flex items-center gap-3 max-w-7xl mx-auto px-4 py-3">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🐋</span>
          <span className="text-white font-black text-xl tracking-tight">BlueWhale</span>
        </Link>

        <form onSubmit={search} className="flex-1 max-w-xl mx-2">
          <div className="flex bg-white rounded-xl overflow-hidden">
            <input
              value={q} onChange={e => setQ(e.target.value)}
              placeholder="ຄົ້ນຫາສິນຄ້າ..."
              className="flex-1 px-4 py-2 text-sm text-gray-800 outline-none"
            />
            <button type="submit" className="bg-[#EE4D2D] px-4 flex items-center">
              <Search size={16} className="text-white" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <Link href="/cart" className="relative p-2">
            <ShoppingCart size={22} className="text-white" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#EE4D2D] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{count}</span>
            )}
          </Link>
          {user ? (
            <Link href="/profile" className="p-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-black">
                  {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
                </span>
              </div>
            </Link>
          ) : (
            <Link href="/login" className="p-2">
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
