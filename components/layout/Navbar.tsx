'use client'
import Link from 'next/link'
import { ShoppingCart, Search, User, Menu, X } from 'lucide-react'
import { useCart } from '@/store/cart'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const count = useCart(s => s.count())
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const router = useRouter()

  const search = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) router.push(`/products?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <nav className="bg-[#1247D8] sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="text-2xl">🐋</span>
          <span className="text-white font-black text-xl tracking-tight hidden sm:block">BlueWhale</span>
        </Link>

        {/* Search */}
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

        {/* Right icons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link href="/cart" className="relative p-2">
            <ShoppingCart size={22} className="text-white" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#EE4D2D] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{count}</span>
            )}
          </Link>
          <Link href="/login" className="p-2 hidden sm:block">
            <User size={22} className="text-white" />
          </Link>
          <button onClick={() => setOpen(!open)} className="p-2 sm:hidden text-white">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile categories */}
      {open && (
        <div className="bg-[#0d35b0] px-4 pb-3 flex flex-wrap gap-2 sm:hidden">
          {['ທັງໝົດ','ເສື້ອຜ້າ','ອີເລັກໂທຣນິກ','ອາຫານ & ເຄື່ອງດື່ມ','ຄວາມງາມ','ຂອງໃຊ້ໃນບ້ານ'].map(c => (
            <Link key={c} href={`/products?cat=${encodeURIComponent(c)}`}
              onClick={() => setOpen(false)}
              className="text-white/80 hover:text-white text-sm py-1 px-3 rounded-lg hover:bg-white/10">
              {c}
            </Link>
          ))}
        </div>
      )}

      {/* Desktop categories */}
      <div className="bg-[#0d35b0] hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {['ທັງໝົດ','ເສື້ອຜ້າ','ອີເລັກໂທຣນິກ','ອາຫານ & ເຄື່ອງດື່ມ','ຄວາມງາມ','ຂອງໃຊ້ໃນບ້ານ'].map(c => (
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
