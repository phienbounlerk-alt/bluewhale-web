'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import {
  User, ClipboardList, Heart, MapPin, ChevronRight, LogOut,
  Star, Tag, Bell, Zap, Store, Eye, Gift, Award,
  Package, Truck, CheckCircle, Clock, Settings, Shield
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase, fmt, getProducts, discountPct, type Product } from '@/lib/supabase'

const RECENTLY_VIEWED_KEY = 'bw_recent'
const SAVED_KEY           = 'bw_saved_items'

// ── Helpers ───────────────────────────────────────────────────────────────────
function getRecentIds(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) ?? '[]') } catch { return [] }
}

function calcPoints(orderTotal: number) {
  return Math.floor(orderTotal / 10000)
}

function getLevelInfo(points: number) {
  if (points >= 10000) return { label: 'Diamond', color: 'from-blue-400 to-cyan-300', icon: '💎', next: null, nextPts: 0 }
  if (points >= 5000)  return { label: 'Gold',    color: 'from-yellow-400 to-amber-400', icon: '🏆', next: 'Diamond', nextPts: 10000 }
  if (points >= 1000)  return { label: 'Silver',  color: 'from-gray-300 to-gray-400', icon: '🥈', next: 'Gold', nextPts: 5000 }
  return                      { label: 'Bronze',  color: 'from-amber-600 to-amber-700', icon: '🥉', next: 'Silver', nextPts: 1000 }
}

// ── Static mock notifications ─────────────────────────────────────────────────
const NOTIFS = [
  { id: 1, icon: '🚚', title: 'ສິນຄ້າກຳລັງສົ່ງ', desc: 'ຄຳສັ່ງ #A1B2C3 ຢູ່ໃນທາງ', time: '5 ນາທີກ່ອນ', unread: true },
  { id: 2, icon: '🎉', title: 'ສ່ວນຫຼຸດສະເພາະທ່ານ', desc: 'ໃຊ້ BW20 ຮັບສ່ວນຫຼຸດ 20% ທຸກອໍເດີ', time: '2 ຊົ່ວໂມງ', unread: true },
  { id: 3, icon: '⭐', title: 'ຂໍລີວິວ', desc: 'ທ່ານໄດ້ຮັບສິນຄ້າ ຂໍຮ້ອງໃຫ້ລີວິວ', time: 'ມື້ວານ', unread: false },
  { id: 4, icon: '🏆', title: 'ຍົກລະດັບ Silver!', desc: 'ຂໍສະແດງຊົມ ທ່ານໄດ້ Silver', time: '3 ວັນກ່ອນ', unread: false },
]

// ── Mock followed shops ───────────────────────────────────────────────────────
const FOLLOWED_SHOPS = [
  { id: 1, name: 'BlueWhale Official', emoji: '🐋', cat: 'ສິນຄ້າທົ່ວໄປ', color: 'from-[#1247D8] to-[#0d35b0]', followers: '12.4k' },
  { id: 2, name: 'Lao Fashion',        emoji: '👗', cat: 'ເສື້ອຜ້າ',       color: 'from-pink-500 to-rose-600',    followers: '8.2k'  },
  { id: 3, name: 'Tech Zone',          emoji: '📱', cat: 'ອີເລັກ',          color: 'from-slate-700 to-slate-900',  followers: '6.7k'  },
  { id: 4, name: 'Beauty Corner',      emoji: '💄', cat: 'ຄວາມງາມ',         color: 'from-purple-500 to-pink-500',  followers: '5.1k'  },
]

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, href, count }: { icon: React.ReactNode; title: string; href?: string; count?: number }) {
  return (
    <div className="flex items-center justify-between mb-3 px-4 pt-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 bg-[#1247D8] rounded-full" />
        {icon}
        <h2 className="font-black text-gray-800 text-sm">{title}</h2>
        {count !== undefined && (
          <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      {href && (
        <Link href={href} className="text-xs text-[#1247D8] font-bold flex items-center gap-0.5 hover:underline">
          ທັງໝົດ <ChevronRight size={12} />
        </Link>
      )}
    </div>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ icon, label, count, href, color, sub }: {
  icon: React.ReactNode; label: string; count: number; href?: string; color: string; sub?: string
}) {
  const content = (
    <div className="flex flex-col items-center gap-1 py-1">
      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${color} shadow-sm`}>
        {icon}
      </div>
      <span className="font-black text-gray-800 text-lg leading-none">{count}</span>
      <span className="text-gray-500 text-[10px] font-medium text-center leading-tight">{label}</span>
      {sub && <span className="text-[9px] text-gray-300">{sub}</span>}
    </div>
  )
  return href ? <Link href={href}>{content}</Link> : <div>{content}</div>
}

// ── Coupon card ───────────────────────────────────────────────────────────────
function CouponCard({ voucher, subtotal }: { voucher: any; subtotal: number }) {
  const pct = voucher.discount_type === 'percent'
  const usable = subtotal >= (voucher.min_order ?? 0)
  return (
    <div className={`shrink-0 w-52 rounded-2xl overflow-hidden border ${usable ? 'border-[#1247D8]/20' : 'border-gray-200 opacity-60'}`}>
      <div className={`px-3 py-2 ${usable ? 'bg-gradient-to-r from-[#1247D8] to-[#1e5df0]' : 'bg-gray-300'} text-white`}>
        <p className="font-black text-xl tracking-widest">{voucher.code}</p>
        <p className="text-xs text-white/80 font-bold">
          {pct ? `-${voucher.discount_value}%` : `-${fmt(voucher.discount_value)}`}
          {voucher.max_discount ? ` (ສູງສຸດ ${fmt(voucher.max_discount)})` : ''}
        </p>
      </div>
      <div className="bg-white px-3 py-2 relative">
        {/* Cutout dots */}
        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-100 border border-gray-200" />
        <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gray-100 border border-gray-200" />
        <p className="text-[10px] text-gray-500">
          {voucher.min_order ? `ຊື້ຂັ້ນຕ່ຳ ${fmt(voucher.min_order)}` : 'ບໍ່ມີຂັ້ນຕ່ຳ'}
        </p>
        <p className="text-[10px] text-gray-400">
          {voucher.expires_at
            ? `ໝົດ: ${new Date(voucher.expires_at).toLocaleDateString('lo-LA', { day: 'numeric', month: 'short' })}`
            : 'ບໍ່ໝົດອາຍຸ'}
        </p>
        {!usable && voucher.min_order > 0 && (
          <p className="text-[9px] text-orange-500 font-bold mt-0.5">ຊື້ + {fmt(voucher.min_order - subtotal)} ເພື່ອໃຊ້</p>
        )}
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const [stats, setStats]               = useState({ orders: 0, shipping: 0, wishlist: 0, reviews: 0, orderTotal: 0 })
  const [vouchers, setVouchers]         = useState<any[]>([])
  const [recentProducts, setRecent]     = useState<Product[]>([])
  const [myReviews, setMyReviews]       = useState<any[]>([])
  const [unreadCount, setUnreadCount]   = useState(2)
  const [loading, setLoading]           = useState(true)
  const [activeTab, setActiveTab]       = useState<'home' | 'reviews' | 'notifs'>('home')

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  useEffect(() => {
    if (!user) { setLoading(false); return }

    const loadData = async () => {
      const uid = user.id

      const [
        { data: orders },
        { data: wishlists },
        { data: reviews },
        { data: vouchers },
        allProducts,
      ] = await Promise.all([
        supabase.from('orders').select('id, status, total_amount').eq('user_id', uid),
        supabase.from('wishlists').select('product_id').eq('user_id', uid),
        supabase.from('reviews').select('id, rating, comment, created_at, product_id').eq('user_id', uid).order('created_at', { ascending: false }),
        supabase.from('vouchers').select('*').eq('is_active', true).limit(8),
        getProducts(),
      ])

      const shippingCount = (orders ?? []).filter(o => o.status === 'shipping').length
      const orderTotal    = (orders ?? []).reduce((s: number, o: any) => s + (o.total_amount ?? 0), 0)
      setStats({
        orders:     (orders ?? []).length,
        shipping:   shippingCount,
        wishlist:   (wishlists ?? []).length,
        reviews:    (reviews ?? []).length,
        orderTotal,
      })
      setVouchers(vouchers ?? [])
      setMyReviews(reviews ?? [])

      // Recently viewed from localStorage
      const recentIds = getRecentIds()
      if (recentIds.length) {
        const matched = recentIds
          .map(id => allProducts.find(p => p.id === id))
          .filter(Boolean) as Product[]
        setRecent(matched.slice(0, 6))
      }

      setLoading(false)
    }

    loadData()
  }, [user])

  // ── Shared hero UI ────────────────────────────────────────────────────────
  const displayName = user
    ? (user.user_metadata?.full_name || user.email?.split('@')[0] || 'ຜູ້ໃຊ້')
    : 'ຜູ້ໃຊ້'
  const initial   = displayName[0]?.toUpperCase() ?? '?'
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined
  const points    = calcPoints(stats.orderTotal)
  const level     = getLevelInfo(points)
  const memberSince = user ? new Date(user.created_at).toLocaleDateString('lo-LA', { year: 'numeric', month: 'short' }) : ''

  // ── NOT LOGGED IN ─────────────────────────────────────────────────────────
  if (!user) return (
    <div className="max-w-2xl mx-auto pb-8">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1247D8] to-[#0d35b0] px-6 pt-10 pb-20 text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 left-4 w-32 h-32 rounded-full bg-white/20" />
          <div className="absolute bottom-4 right-4 w-48 h-48 rounded-full bg-white/10" />
        </div>
        <div className="relative">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white/30">
            <User size={40} className="text-white" />
          </div>
          <p className="font-black text-xl">ຍິນດີຕ້ອນຮັບ!</p>
          <p className="text-white/70 text-sm mt-1 mb-5">ເຂົ້າສູ່ລະບົບເພື່ອຕິດຕາມການສັ່ງຊື້</p>
          <Link href="/login"
            className="inline-flex items-center gap-2 bg-white text-[#1247D8] font-black px-6 py-2.5 rounded-2xl hover:bg-gray-100 transition-colors shadow-lg">
            ເຂົ້າສູ່ລະບົບ / ສ້າງບັນຊີ →
          </Link>
        </div>
      </div>

      <div className="-mt-10 px-4 space-y-3">
        {/* Stats placeholder */}
        <div className="bg-white rounded-2xl p-5 shadow-sm grid grid-cols-4 gap-2">
          {[
            { icon: <Package size={18} className="text-[#1247D8]" />, label: 'ການສັ່ງ', color: 'bg-blue-50' },
            { icon: <Truck size={18} className="text-orange-500" />,   label: 'ສົ່ງຢູ່',  color: 'bg-orange-50' },
            { icon: <Heart size={18} className="text-red-500" />,      label: 'Wishlist', color: 'bg-red-50' },
            { icon: <Star size={18} className="text-yellow-500" />,    label: 'ລີວິວ',   color: 'bg-yellow-50' },
          ].map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1.5">
              <div className={`w-10 h-10 ${s.color} rounded-2xl flex items-center justify-center`}>{s.icon}</div>
              <span className="font-black text-gray-300 text-xl">—</span>
              <span className="text-gray-400 text-[10px]">{s.label}</span>
            </div>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 pt-2">BlueWhale v1.0 🐋</p>
      </div>
    </div>
  )

  // ── LOGGED IN ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl mx-auto pb-10">

      {/* ── Hero header ── */}
      <div className="bg-gradient-to-br from-[#1247D8] via-[#1555e8] to-[#0d35b0] px-5 pt-8 pb-20 text-white relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-10 translate-x-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-8 -translate-x-8" />

        {/* Settings icon top-right */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button onClick={() => setUnreadCount(0)}
            className="relative w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center hover:bg-white/25 transition-colors"
            aria-label="Notifications">
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black flex items-center justify-center border border-white">
                {unreadCount}
              </span>
            )}
          </button>
          <Link href="/profile/settings"
            className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center hover:bg-white/25 transition-colors">
            <Settings size={16} />
          </Link>
        </div>

        {/* Avatar + info */}
        <div className="flex items-center gap-4 relative">
          <div className="relative shrink-0">
            {avatarUrl ? (
              <Image src={avatarUrl} alt={displayName} width={72} height={72} className="rounded-full ring-4 ring-white/30 object-cover" unoptimized />
            ) : (
              <div className="w-18 h-18 w-[72px] h-[72px] bg-white/20 rounded-full flex items-center justify-center ring-4 ring-white/30">
                <span className="text-3xl font-black">{initial}</span>
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-br ${level.color} flex items-center justify-center text-[10px] border-2 border-white`}>
              {level.icon}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-lg leading-tight truncate">{displayName}</p>
            <p className="text-white/70 text-xs mt-0.5 truncate">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full bg-gradient-to-r ${level.color} text-white shadow-sm`}>
                {level.icon} {level.label}
              </span>
              <span className="text-[10px] text-white/60">ສະມາຊິກ {memberSince}</span>
            </div>
          </div>
        </div>

        {/* Loyalty points bar */}
        <div className="mt-4 bg-white/15 rounded-2xl p-3 relative">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Zap size={13} className="text-yellow-300" />
              <span className="text-xs font-bold">ຄະແນນສະສົມ</span>
            </div>
            <span className="font-black text-yellow-300">{points.toLocaleString()} pts</span>
          </div>
          {level.next && (
            <>
              <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-300 to-yellow-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (points / level.nextPts) * 100)}%` }} />
              </div>
              <p className="text-[10px] text-white/60 mt-1">
                ຂາດ {(level.nextPts - points).toLocaleString()} pts ຈຶ່ງຂຶ້ນ {level.next}
              </p>
            </>
          )}
          {!level.next && (
            <p className="text-xs text-yellow-300 font-bold mt-1">🎉 ສູງສຸດ Diamond!</p>
          )}
        </div>
      </div>

      <div className="-mt-10 px-4 space-y-3">

        {/* ── Stats cards ── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50">
          {loading ? (
            <div className="grid grid-cols-4 gap-2 animate-pulse">
              {[0,1,2,3].map(i => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div className="w-10 h-10 bg-gray-100 rounded-2xl" />
                  <div className="w-8 h-5 bg-gray-100 rounded" />
                  <div className="w-10 h-3 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-1">
              <StatCard
                href="/orders"
                icon={<Package size={18} className="text-[#1247D8]" />}
                label="ການສັ່ງ" count={stats.orders}
                color="bg-blue-50"
              />
              <StatCard
                href="/orders"
                icon={<Truck size={18} className="text-orange-500" />}
                label="ສົ່ງຢູ່" count={stats.shipping}
                color="bg-orange-50"
                sub={stats.shipping > 0 ? 'ກຳລັງໄປ' : undefined}
              />
              <StatCard
                href="/wishlist"
                icon={<Heart size={18} className="text-red-500" />}
                label="Wishlist" count={stats.wishlist}
                color="bg-red-50"
              />
              <StatCard
                icon={<Star size={18} className="text-yellow-500" />}
                label="ລີວິວ" count={stats.reviews}
                color="bg-yellow-50"
              />
            </div>
          )}
        </div>

        {/* ── Tab switcher ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden">
          <div className="flex border-b border-gray-100">
            {([
              { key: 'home',    label: 'ໜ້າຫຼັກ',  icon: User },
              { key: 'reviews', label: 'ລີວິວຂ້ອຍ', icon: Star },
              { key: 'notifs',  label: 'ແຈ້ງເຕືອນ',  icon: Bell },
            ] as const).map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-bold transition-colors ${activeTab === key ? 'text-[#1247D8] border-b-2 border-[#1247D8] bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}>
                <Icon size={13} />
                {label}
                {key === 'notifs' && unreadCount > 0 && (
                  <span className="w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-black">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Home tab ── */}
          {activeTab === 'home' && (
            <div>
              {/* Quick actions */}
              <div className="p-4 pb-2">
                <p className="text-[10px] font-black text-gray-400 mb-3">ທາງລັດ</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { icon: ClipboardList, label: 'ສັ່ງຊື້',    href: '/orders',   color: 'bg-blue-50 text-[#1247D8]' },
                    { icon: Heart,         label: 'Wishlist',  href: '/wishlist', color: 'bg-red-50 text-red-500'    },
                    { icon: Star,          label: 'ລີວິວ',     href: '#reviews',  color: 'bg-yellow-50 text-yellow-500' },
                    { icon: Tag,           label: 'ໂຄດ',       href: '#coupons',  color: 'bg-green-50 text-green-600' },
                    { icon: Eye,           label: 'ເບິ່ງລ່າສຸດ', href: '#recent',  color: 'bg-purple-50 text-purple-600' },
                    { icon: Store,         label: 'ຮ້ານ',       href: '#shops',    color: 'bg-indigo-50 text-indigo-600' },
                    { icon: Award,         label: 'ຄະແນນ',     href: '#points',   color: 'bg-amber-50 text-amber-600' },
                    { icon: Shield,        label: 'ຄວາມປອດໄພ', href: '#',         color: 'bg-gray-50 text-gray-500'   },
                  ].map(({ icon: Icon, label, href, color }) => (
                    <Link key={label} href={href}
                      className="flex flex-col items-center gap-1.5 group">
                      <div className={`w-11 h-11 ${color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                        <Icon size={18} />
                      </div>
                      <span className="text-[10px] text-gray-600 font-medium text-center leading-tight">{label}</span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="h-px bg-gray-50 my-1" />

              {/* Menu links */}
              <div>
                {[
                  { icon: ClipboardList, label: 'ປະຫວັດການສັ່ງຊື້', href: '/orders',   color: 'bg-blue-50 text-[#1247D8]',   badge: stats.orders > 0 ? stats.orders : undefined },
                  { icon: Heart,         label: 'Wishlist',          href: '/wishlist', color: 'bg-red-50 text-red-500',       badge: stats.wishlist > 0 ? stats.wishlist : undefined },
                  { icon: MapPin,        label: 'ທີ່ຢູ່ຈັດສົ່ງ',     href: '/addresses', color: 'bg-green-50 text-green-600',  badge: undefined },
                ].map(({ icon: Icon, label, href, color, badge }) => (
                  <Link key={label} href={href}
                    className="flex items-center gap-3 px-4 py-3.5 border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
                      <Icon size={16} />
                    </div>
                    <span className="font-bold text-gray-800 flex-1 text-sm">{label}</span>
                    {badge !== undefined && (
                      <span className="bg-[#1247D8] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{badge}</span>
                    )}
                    <ChevronRight size={14} className="text-gray-300" />
                  </Link>
                ))}

                {/* Sign out */}
                <button onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3.5 border-t border-gray-50 hover:bg-red-50 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
                    <LogOut size={16} className="text-red-500" />
                  </div>
                  <span className="font-bold text-red-500 flex-1 text-left text-sm">ອອກຈາກລະບົບ</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Reviews tab ── */}
          {activeTab === 'reviews' && (
            <div className="p-4 space-y-3">
              {loading ? (
                <div className="py-8 text-center text-gray-400 text-sm">ກຳລັງໂຫຼດ...</div>
              ) : myReviews.length === 0 ? (
                <div className="py-10 text-center">
                  <Star size={36} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm font-bold">ຍັງບໍ່ມີລີວິວ</p>
                  <p className="text-gray-300 text-xs mt-1">ຊື້ສິນຄ້າ ແລ້ວຂຽນລີວິວ</p>
                  <Link href="/products" className="inline-block mt-3 bg-[#1247D8] text-white text-xs font-bold px-4 py-2 rounded-xl">
                    ເລືອກສິນຄ້າ
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-gray-500">{myReviews.length} ລີວິວ</p>
                    <div className="flex items-center gap-1">
                      <Star size={12} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-black text-gray-700">
                        {(myReviews.reduce((s, r) => s + r.rating, 0) / myReviews.length).toFixed(1)} ສະເລ່ຍ
                      </span>
                    </div>
                  </div>
                  {myReviews.slice(0, 5).map(r => (
                    <div key={r.id} className="bg-gray-50 rounded-2xl p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} size={11} className={i <= r.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'} />
                          ))}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {new Date(r.created_at).toLocaleDateString('lo-LA', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      {r.comment && <p className="text-xs text-gray-700 leading-relaxed">{r.comment}</p>}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {/* ── Notifications tab ── */}
          {activeTab === 'notifs' && (
            <div>
              <div className="flex items-center justify-between px-4 pt-3 pb-2">
                <p className="text-xs font-black text-gray-500">{NOTIFS.length} ການແຈ້ງເຕືອນ</p>
                <button onClick={() => setUnreadCount(0)} className="text-[10px] text-[#1247D8] font-bold hover:underline">
                  ອ່ານທັງໝົດ
                </button>
              </div>
              {NOTIFS.map(n => (
                <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-t border-gray-50 ${n.unread ? 'bg-blue-50/40' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-lg ${n.unread ? 'bg-blue-100' : 'bg-gray-100'}`}>
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${n.unread ? 'text-gray-800' : 'text-gray-500'}`}>{n.title}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{n.desc}</p>
                    <p className="text-[10px] text-gray-300 mt-1">{n.time}</p>
                  </div>
                  {n.unread && <div className="w-2 h-2 rounded-full bg-[#1247D8] shrink-0 mt-1" />}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── My Coupons ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden" id="coupons">
          <SectionHeader
            icon={<Tag size={14} className="text-green-600" />}
            title="ໂຄດສ່ວນຫຼຸດ"
            count={vouchers.length}
          />
          {loading ? (
            <div className="px-4 pb-4 flex gap-3 overflow-x-auto">
              {[0,1,2].map(i => <div key={i} className="shrink-0 w-52 h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : vouchers.length === 0 ? (
            <div className="px-4 pb-4 text-center py-6">
              <Gift size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">ຍັງບໍ່ມີໂຄດສ່ວນຫຼຸດ</p>
            </div>
          ) : (
            <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-hide">
              {vouchers.map(v => (
                <CouponCard key={v.id} voucher={v} subtotal={stats.orderTotal} />
              ))}
            </div>
          )}
        </div>

        {/* ── Recently Viewed ── */}
        {recentProducts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden" id="recent">
            <SectionHeader
              icon={<Eye size={14} className="text-purple-600" />}
              title="ເບິ່ງລ່າສຸດ"
              href="/products"
              count={recentProducts.length}
            />
            <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-hide snap-x">
              {recentProducts.map(p => (
                <Link key={p.id} href={`/products/${p.id}`}
                  className="shrink-0 w-28 snap-start group">
                  <div className="relative w-28 h-28 bg-gray-50 rounded-xl overflow-hidden mb-2">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                    {discountPct(p) > 0 && (
                      <div className="absolute top-1.5 left-1.5 bg-[#EE4D2D] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                        -{discountPct(p)}%
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-700 font-medium line-clamp-2 leading-snug">{p.name}</p>
                  <p className="text-xs font-black text-[#1247D8] mt-0.5">{fmt(p.discount_price ?? p.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Followed Shops ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-50 overflow-hidden" id="shops">
          <SectionHeader
            icon={<Store size={14} className="text-indigo-600" />}
            title="ຮ້ານທີ່ຕິດຕາມ"
            count={FOLLOWED_SHOPS.length}
          />
          <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-hide">
            {FOLLOWED_SHOPS.map(shop => (
              <Link key={shop.id} href="/products"
                className="shrink-0 w-28 flex flex-col items-center gap-2 group">
                <div className={`w-16 h-16 bg-gradient-to-br ${shop.color} rounded-2xl flex items-center justify-center text-3xl group-hover:scale-105 transition-transform duration-200 shadow-sm`}>
                  {shop.emoji}
                </div>
                <div className="text-center">
                  <p className="text-[11px] font-bold text-gray-800 line-clamp-1">{shop.name}</p>
                  <p className="text-[9px] text-gray-400">{shop.cat}</p>
                  <p className="text-[9px] text-[#1247D8] font-bold">👥 {shop.followers}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Loyalty Points detail ── */}
        <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-100" id="points">
          <div className="flex items-center gap-2 mb-3">
            <Award size={16} className="text-amber-500" />
            <h3 className="font-black text-gray-800 text-sm">ຄະແນນສະສົມ</h3>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-3xl font-black text-amber-600">{points.toLocaleString()}</p>
              <p className="text-xs text-gray-500">pts ທັງໝົດ</p>
            </div>
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${level.color} flex items-center justify-center text-2xl shadow-md`}>
              {level.icon}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              { label: 'Bronze', icon: '🥉', req: '0', done: points >= 0 },
              { label: 'Silver', icon: '🥈', req: '1k',  done: points >= 1000 },
              { label: 'Gold',   icon: '🏆', req: '5k',  done: points >= 5000 },
            ].map(tier => (
              <div key={tier.label} className={`rounded-xl py-2 px-1 ${tier.done ? 'bg-amber-100' : 'bg-white/60'}`}>
                <span className={`text-lg ${tier.done ? '' : 'grayscale opacity-40'}`}>{tier.icon}</span>
                <p className={`text-[10px] font-bold mt-0.5 ${tier.done ? 'text-amber-700' : 'text-gray-400'}`}>{tier.label}</p>
                <p className="text-[9px] text-gray-400">{tier.req} pts</p>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-gray-400 text-center mt-2">ໄດ້ 1 pt ທຸກ ₭10,000 ທີ່ຊື້</p>
        </div>

        <p className="text-center text-xs text-gray-300 pt-2">BlueWhale v1.0 🐋</p>
      </div>
    </div>
  )
}
