'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { LayoutDashboard, Package, ShoppingBag, LogOut, Menu, X, ChevronRight, User } from 'lucide-react'

const nav = [
  { href: '/seller/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/seller/products',  label: 'ສິນຄ້າຂອງຂ້ອຍ', icon: Package },
  { href: '/seller/orders',    label: 'ການສັ່ງຊື້',   icon: ShoppingBag },
  { href: '/seller/profile',   label: 'ໂປຣໄຟລຮ້ານ',  icon: User },
]

const PUBLIC = ['/seller/login', '/seller/register']

export default function SellerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const path = usePathname()
  const [ready, setReady] = useState(false)
  const [sideOpen, setSideOpen] = useState(false)
  const [seller, setSeller] = useState<{ shop_name: string; logo_url?: string; is_approved: boolean } | null>(null)

  useEffect(() => {
    if (PUBLIC.some(p => path.startsWith(p))) { setReady(true); return }
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) { router.replace('/seller/login'); return }
      const { data: s } = await supabase.from('sellers').select('shop_name,logo_url,is_approved').eq('user_id', data.session.user.id).single()
      if (!s) { router.replace('/seller/login'); return }
      setSeller(s)
      setReady(true)
    })
  }, [path, router])

  if (PUBLIC.some(p => path.startsWith(p))) return <>{children}</>
  if (!ready) return <div className="flex items-center justify-center h-screen bg-[#0A1628] text-white">ກຳລັງໂຫຼດ...</div>

  const logout = async () => { await supabase.auth.signOut(); router.replace('/seller/login') }

  return (
    <div className="flex h-screen bg-[#F4F5F8] overflow-hidden">
      {sideOpen && <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSideOpen(false)} />}

      <aside className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-[#0A1628] flex flex-col transition-transform duration-300 ${sideOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Brand */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1247D8] rounded-xl flex items-center justify-center text-xl shadow-lg shadow-blue-900/50 overflow-hidden shrink-0">
              {seller?.logo_url ? <img src={seller.logo_url} alt="" className="w-full h-full object-cover" /> : '🏪'}
            </div>
            <div className="min-w-0">
              <div className="text-white font-black text-sm truncate">{seller?.shop_name ?? 'ຮ້ານຂອງຂ້ອຍ'}</div>
              <div className={`text-xs font-semibold ${seller?.is_approved ? 'text-green-400' : 'text-yellow-400'}`}>
                {seller?.is_approved ? '✅ ອະນຸມັດແລ້ວ' : '⏳ ລໍຖ້າອະນຸມັດ'}
              </div>
            </div>
          </div>
        </div>

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

        <div className="p-4 border-t border-white/10">
          <button onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium">
            <LogOut size={18} />ອອກຈາກລະບົບ
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setSideOpen(!sideOpen)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100">
            {sideOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1">
            <h1 className="font-black text-gray-800 text-base">{nav.find(n => path.startsWith(n.href))?.label ?? 'Seller Portal'}</h1>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-xl">
            <div className="w-6 h-6 bg-[#1247D8] rounded-lg flex items-center justify-center text-xs text-white overflow-hidden">
              {seller?.logo_url ? <img src={seller.logo_url} alt="" className="w-full h-full object-cover" /> : '🏪'}
            </div>
            <span className="text-xs font-bold text-[#1247D8] hidden sm:block truncate max-w-24">{seller?.shop_name}</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 md:p-6">
          {!seller?.is_approved && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-2xl px-5 py-4 text-sm text-yellow-800 flex items-center gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="font-bold">ຮ້ານຂອງທ່ານລໍຖ້າການອະນຸມັດຈາກ Admin</p>
                <p className="text-yellow-600 text-xs mt-0.5">ຫຼັງຈາກອະນຸມັດ ຈຶ່ງສາມາດ upload ສິນຄ້າໄດ້</p>
              </div>
            </div>
          )}
          {children}
        </div>
      </div>
    </div>
  )
}
