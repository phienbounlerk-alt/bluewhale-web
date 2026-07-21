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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_24px_rgba(0,0,0,.08)] md:hidden">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map(({ href, icon: Icon, label, isCart }) => {
          const active = path === href || (href !== '/' && path.startsWith(href))
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 relative group">

              {/* Active indicator dot */}
              {active && (
                <span className="absolute top-1.5 w-1 h-1 rounded-full bg-[#1247D8] animate-pop-in" />
              )}

              {/* Icon container */}
              <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-[#1247D8]/10 scale-110'
                  : 'group-active:scale-90 group-active:bg-gray-100'
              }`}>
                <Icon
                  size={22}
                  className={`transition-colors duration-200 ${active ? 'text-[#1247D8]' : 'text-gray-400'}`}
                  strokeWidth={active ? 2.5 : 1.8}
                />
                {isCart && count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#EE4D2D] text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 animate-pop-in shadow-sm">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </div>

              <span className={`text-[10px] transition-all duration-200 ${
                active ? 'text-[#1247D8] font-bold' : 'text-gray-400 font-medium'
              }`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
