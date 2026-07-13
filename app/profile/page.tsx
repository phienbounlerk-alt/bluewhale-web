'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, ClipboardList, Heart, MapPin, ChevronRight, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#1247D8] px-6 pt-8 pb-16 text-white text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <User size={40} className="text-white" />
          </div>
          <p className="font-black text-lg">ເຂົ້າສູ່ລະບົບ</p>
          <p className="text-white/70 text-sm mt-1">ເພື່ອຕິດຕາມການສັ່ງຊື້ຂອງທ່ານ</p>
          <Link href="/login"
            className="inline-block mt-4 bg-white text-[#1247D8] font-bold px-6 py-2 rounded-xl hover:bg-gray-100 transition-colors">
            ເຂົ້າສູ່ລະບົບ / ສ້າງບັນຊີ
          </Link>
        </div>

        <div className="-mt-8 px-4 space-y-3">
          <div className="bg-white rounded-2xl p-4 grid grid-cols-4 gap-2 shadow-sm">
            {[
              { icon: '🛒', label: 'ການສັ່ງ', count: 0 },
              { icon: '🚚', label: 'ກຳລັງສົ່ງ', count: 0 },
              { icon: '❤️', label: 'Wishlist', count: 0 },
              { icon: '⭐', label: 'ລີວິວ', count: 0 },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span className="text-xl">{s.icon}</span>
                <span className="text-[#1247D8] font-black text-lg">{s.count}</span>
                <span className="text-gray-500 text-xs">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="pb-4">
            <p className="text-center text-xs text-gray-400">BlueWhale v1.0</p>
          </div>
        </div>
      </div>
    )
  }

  const displayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'ຜູ້ໃຊ້'
  const initial = displayName[0].toUpperCase()

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-[#1247D8] px-6 pt-8 pb-16 text-white text-center">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-black text-3xl">{initial}</span>
        </div>
        <p className="font-black text-lg">{displayName}</p>
        <p className="text-white/70 text-sm mt-1">{user.email}</p>
      </div>

      <div className="-mt-8 px-4 space-y-3">
        {/* Stats */}
        <div className="bg-white rounded-2xl p-4 grid grid-cols-4 gap-2 shadow-sm">
          {[
            { icon: '🛒', label: 'ການສັ່ງ', count: 0 },
            { icon: '🚚', label: 'ກຳລັງສົ່ງ', count: 0 },
            { icon: '❤️', label: 'Wishlist', count: 0 },
            { icon: '⭐', label: 'ລີວິວ', count: 0 },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-xl">{s.icon}</span>
              <span className="text-[#1247D8] font-black text-lg">{s.count}</span>
              <span className="text-gray-500 text-xs">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {[
            { icon: ClipboardList, label: 'ປະຫວັດການສັ່ງ', href: '/orders', color: 'bg-blue-100 text-[#1247D8]' },
            { icon: Heart, label: 'Wishlist', href: '/wishlist', color: 'bg-red-100 text-red-500' },
            { icon: MapPin, label: 'ທີ່ຢູ່ຈັດສົ່ງ', href: '/addresses', color: 'bg-green-100 text-green-600' },
          ].map(({ icon: Icon, label, href, color }) => (
            <Link key={label} href={href}
              className="flex items-center gap-3 px-4 py-4 border-b border-gray-50 hover:bg-gray-50 transition-colors">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={18} />
              </div>
              <span className="font-medium text-gray-800 flex-1">{label}</span>
              <ChevronRight size={16} className="text-gray-400" />
            </Link>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <LogOut size={18} className="text-red-500" />
            </div>
            <span className="font-medium text-red-500 flex-1 text-left">ອອກຈາກລະບົບ</span>
          </button>
        </div>

        <div className="pb-4">
          <p className="text-center text-xs text-gray-400">BlueWhale v1.0 · ສະມາຊິກ BlueWhale</p>
        </div>
      </div>
    </div>
  )
}
