'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Home, Grid3X3, ShoppingCart, ClipboardList, Bell } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useCart } from '@/store/cart'
import { useAuth } from '@/lib/auth-context'

const tabs = [
  { href: '/', icon: Home, label: 'ໜ້າຫຼັກ' },
  { href: '/products', icon: Grid3X3, label: 'ໝວດໝູ່' },
  { href: '/cart', icon: ShoppingCart, label: 'ກະຕ່າ', isCart: true },
  { href: '/notifications', icon: Bell, label: 'ການແຈ້ງເຕືອນ' },
  { href: '/profile', label: 'ໂປຣໄຟລ', isProfile: true },
]

export default function BottomNav() {
  const path = usePathname()
  const count = useCart(s => s.count())
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const avatarUrl: string | undefined =
    user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-4px_24px_rgba(0,0,0,.08)] md:hidden rounded-t-2xl">
      <div className="flex items-center justify-around h-16 px-1">
        {tabs.map(({ href, icon: Icon, label, isCart, isProfile }) => {
          const active = path === href || (href !== '/' && path.startsWith(href))
          return (
            <Link key={href} href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 relative group">

              {active && (
                <span className="absolute top-1.5 w-1 h-1 rounded-full bg-[#1247D8] animate-pop-in" />
              )}

              <div className={`relative p-1.5 rounded-xl transition-all duration-200 ${
                active
                  ? 'bg-[#1247D8]/10 scale-110'
                  : 'group-active:scale-90 group-active:bg-gray-100'
              }`}>
                {isProfile ? (
                  avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt="ໂປຣໄຟລ"
                      width={24}
                      height={24}
                      className={`rounded-full object-cover border-2 transition-colors duration-200 ${
                        active ? 'border-[#1247D8]' : 'border-gray-300'
                      }`}
                      unoptimized
                    />
                  ) : (
                    /* fallback: coloured initial circle */
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black transition-colors duration-200 ${
                      active ? 'bg-[#1247D8] text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {(user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}
                    </div>
                  )
                ) : Icon ? (
                  <>
                    <Icon
                      size={22}
                      className={`transition-colors duration-200 ${active ? 'text-[#1247D8]' : 'text-gray-400'}`}
                      strokeWidth={active ? 2.5 : 1.8}
                    />
                    {isCart && mounted && count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#EE4D2D] text-white text-[9px] font-black rounded-full min-w-[16px] h-4 flex items-center justify-center px-0.5 animate-pop-in shadow-sm">
                        {count > 99 ? '99+' : count}
                      </span>
                    )}
                  </>
                ) : null}
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
