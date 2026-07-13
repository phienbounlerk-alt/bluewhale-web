'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Grid3X3, ShoppingCart, ClipboardList, User } from 'lucide-react'
import { useCart } from '@/store/cart'

const tabs = [
  { href: '/', icon: Home, label: 'ໜ້າຫຼັກ' },
  { href: '/products', icon: Grid3X3, label: 'ໝວດໝູ່' },
  { href: '/cart', icon: ShoppingCart, label: 'ກະຕ່າ', isCart: true },
  { href: '/orders', icon: ClipboardList, label: 'ການສັ່ງ' },
  { href: '/profile', icon: User, label: 'ໂປຣໄຟລ' },
]

export default function BottomNav() {
  const path = usePathname()
  const count = useCart(s => s.count())

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map(({ href, icon: Icon, label, isCart }) => {
          const active = path === href || (href !== '/' && path.startsWith(href))
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 relative">
              <div className={`relative p-1.5 rounded-xl transition-colors ${active ? 'bg-blue-50' : ''}`}>
                <Icon size={22} className={active ? 'text-[#1247D8]' : 'text-gray-400'} strokeWidth={active ? 2.5 : 1.8} />
                {isCart && count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#EE4D2D] text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${active ? 'text-[#1247D8] font-bold' : 'text-gray-400'}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
