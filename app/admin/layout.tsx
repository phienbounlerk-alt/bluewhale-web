'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { LayoutDashboard, Package, ShoppingBag, Users, LogOut, Menu, X, ChevronRight, Settings, Tag, Store } from 'lucide-react'

const nav = [
  { href: '/admin/dashboard', label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/admin/products',  label: 'ສິນຄ້າ',        icon: Package },
  { href: '/admin/orders',    label: 'ການສັ່ງຊື້',     icon: ShoppingBag },
  { href: '/admin/customers', label: 'ລູກຄ້າ',         icon: Users },
  { href: '/admin/sellers',   label: 'ຮ້ານຄ້າ Seller', icon: Store },
  { href: '/admin/vouchers',  label: 'ໂຄດສ່ວນຫຼຸດ',   icon: Tag },
  { href: '/admin/settings',  label: 'ຕັ້ງຄ່າການຊຳລະ', icon: Settings },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const path = usePathname()
  const [ready, setReady] = useState(false)
  const [sideOpen, setSideOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session && path !== '/admin/login') {
        router.replace('/admin/login')
      } else {
        setReady(true)
      }
    })
  }, [path, router])

  if (path === '/admin/login') return <>{children}</>
  if (!ready) return <div className="flex items-center justify-center h-screen bg-[#0A1628] text-white">ກຳລັງໂຫຼດ...</div>

  const logout = async () => {
    await supabase.auth.signOut()
    router.replace('/admin/login')
  }

  return (
    <div className="flex h-screen bg-[#F4F5F8] overflow-hidden">
      {/* Sidebar overlay (mobile) */}
      {sideOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSideOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#0A1628] flex flex-col transition-transform duration-300 ${sideOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Brand */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1247D8] rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-900/50">🐋</div>
            <div>
              <div className="text-white font-black text-base">BlueWhale</div>
              <div className="text-xs text-blue-400 font-semibold">Admin Panel</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = path.startsWith(href)
            return (
              <Link key={href} href={href} onClick={() => setSideOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm ${active ? 'bg-[#1247D8] text-white shadow-lg shadow-blue-900/40' : 'text-blue-200/70 hover:bg-white/5 hover:text-white'}`}>
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={14} />}
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-white/10">
          <button onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium">
            <LogOut size={18} />
            ອອກຈາກລະບົບ
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setSideOpen(!sideOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            {sideOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1">
            <h1 className="font-black text-gray-800 text-base">{nav.find(n => path.startsWith(n.href))?.label ?? 'Admin'}</h1>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl">
            <div className="w-6 h-6 bg-[#1247D8] rounded-lg flex items-center justify-center text-xs text-white">A</div>
            <span className="text-xs font-bold text-[#1247D8] hidden sm:block">Administrator</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
