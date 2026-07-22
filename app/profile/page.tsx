'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  User, ClipboardList, Heart, MapPin, ChevronRight, LogOut,
  Star, Tag, Bell, Zap, Store, Eye, Gift, Award,
  Package, Truck, CheckCircle, Clock, Settings, Shield, Camera, Sun, Moon
} from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { supabase, fmt, getProducts, discountPct, type Product } from '@/lib/supabase'
import { useTheme } from '@/lib/theme-context'

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
  const { theme, toggle } = useTheme()
  const router = useRouter()

  const [stats, setStats]               = useState({ orders: 0, shipping: 0, wishlist: 0, reviews: 0, orderTotal: 0 })
  const [vouchers, setVouchers]         = useState<any[]>([])
  const [recentProducts, setRecent]     = useState<Product[]>([])
  const [myReviews, setMyReviews]       = useState<any[]>([])
  const [unreadCount, setUnreadCount]   = useState(2)
  const [loading, setLoading]           = useState(true)
  const [activeTab, setActiveTab]       = useState<'home' | 'reviews' | 'notifs'>('home')
  const [uploading, setUploading]       = useState(false)
  const avatarInputRef                  = useRef<HTMLInputElement>(null)

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `avatars/${user.id}.${ext}`
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type })
      if (upErr) throw upErr
      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = data.publicUrl + '?t=' + Date.now()
      await supabase.auth.updateUser({ data: { avatar_url: publicUrl } })
      // force re-render by reloading auth session
      await supabase.auth.refreshSession()
      window.location.reload()
    } catch (err) {
      alert('ອັບໂຫລດຮູບບໍ່ສຳເລັດ ກະລຸນາລອງໃໝ່')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
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
    <div className="min-h-screen bg-[#1247D8]">
      {/* Hero — tall blue section */}
      <div className="px-6 pt-12 pb-36 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-56 h-56 rounded-full bg-white/5 -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full bg-white/5 translate-y-12 -translate-x-12" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 rounded-full bg-white/3 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white/30 backdrop-blur-sm shadow-2xl">
            <User size={36} className="text-white" />
          </div>
          <p className="font-black text-2xl">ຍິນດີຕ້ອນຮັບ!</p>
          <p className="text-white/70 text-sm mt-2 mb-6">ເຂົ້າສູ່ລະບົບເພື່ອຈັດການບັນຊີ<br/>ແລະ ຕິດຕາມການສັ່ງຊື້</p>
          <div className="flex gap-3 justify-center">
            <Link href="/login"
              className="inline-flex items-center gap-2 bg-white text-[#1247D8] font-black px-6 py-3 rounded-2xl hover:bg-gray-100 transition-colors shadow-lg text-sm">
              ເຂົ້າສູ່ລະບົບ
            </Link>
            <Link href="/login"
              className="inline-flex items-center gap-2 bg-white/15 text-white font-bold px-6 py-3 rounded-2xl hover:bg-white/25 transition-colors text-sm border border-white/25">
              ສ້າງບັນຊີ
            </Link>
          </div>
        </div>
      </div>

      {/* White sheet slides up from bottom */}
      <div className="-mt-16 bg-white rounded-t-[32px] shadow-[0_-8px_40px_rgba(0,0,0,0.15)] px-4 pt-6 pb-32 space-y-3">
        {/* Benefits */}
        <div className="p-4 bg-gray-50 rounded-2xl">
          <p className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-wider">ສິ່ງທີ່ຈະໄດ້ຮັບ</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: <Package size={16} className="text-[#1247D8]" />, color: 'bg-blue-50', title: 'ຕິດຕາມຄຳສັ່ງ', desc: 'ຮູ້ທຸກຂັ້ນຕອນການສົ່ງ' },
              { icon: <Heart size={16} className="text-red-500" />,    color: 'bg-red-50',  title: 'Wishlist',     desc: 'ບັນທຶກສິນຄ້າທີ່ຖືກໃຈ' },
              { icon: <Tag size={16} className="text-green-600" />,    color: 'bg-green-50', title: 'ໂຄດສ່ວນຫຼຸດ', desc: 'ໃຊ້ coupon ຫຼຸດລາຄາ' },
              { icon: <Award size={16} className="text-amber-500" />,  color: 'bg-amber-50', title: 'ສະສົມຄະແນນ',  desc: 'ຂຶ້ນ level ຮັບສິດ' },
            ].map(b => (
              <div key={b.title} className="flex items-center gap-2.5 bg-white rounded-xl p-2.5 shadow-sm">
                <div className={`w-9 h-9 ${b.color} rounded-xl flex items-center justify-center shrink-0`}>{b.icon}</div>
                <div>
                  <p className="text-xs font-black text-gray-700">{b.title}</p>
                  <p className="text-[10px] text-gray-400 leading-tight">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {[
            { icon: <Package size={16} className="text-[#1247D8]" />, color: 'bg-blue-50',   label: 'ສິນຄ້າທັງໝົດ',  href: '/products' },
            { icon: <Tag size={16} className="text-green-600" />,     color: 'bg-green-50',  label: 'ໂປໂມຊັ່ນ',     href: '/products' },
            { icon: <Store size={16} className="text-indigo-600" />,  color: 'bg-indigo-50', label: 'ຮ້ານຄ້າ',       href: '/products' },
          ].map(({ icon, color, label, href }) => (
            <Link key={label} href={href}
              className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
              <div className={`w-9 h-9 ${color} rounded-xl flex items-center justify-center`}>{icon}</div>
              <span className="font-bold text-gray-700 flex-1 text-sm">{label}</span>
              <ChevronRight size={14} className="text-gray-300" />
            </Link>
          ))}
        </div>

        <p className="text-center text-xs text-gray-300 pt-2">BlueWhale v1.0 🐋</p>
      </div>
    </div>
  )

  // ── LOGGED IN ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ── */}
      <div className="bg-gradient-to-b from-[#1247D8] to-[#0d35b0] px-5 pt-10 pb-20 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full bg-white/5" />
        <div className="absolute top-16 right-8 w-20 h-20 rounded-full bg-white/5" />

        {/* Top actions */}
        <div className="absolute top-5 right-4 flex gap-2">
          <button onClick={() => setUnreadCount(0)}
            className="relative w-9 h-9 bg-white/15 rounded-full flex items-center justify-center active:bg-white/25">
            <Bell size={16} className="text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-black flex items-center justify-center border-2 border-[#1247D8] text-white">
                {unreadCount}
              </span>
            )}
          </button>
          <Link href="/profile/settings"
            className="w-9 h-9 bg-white/15 rounded-full flex items-center justify-center active:bg-white/25">
            <Settings size={16} className="text-white" />
          </Link>
        </div>

        {/* Hidden file input */}
        <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />

        {/* Avatar + name */}
        <div className="flex flex-col items-center text-center relative">
          <div className="relative mb-3">
            <button onClick={() => avatarInputRef.current?.click()} className="block relative group" disabled={uploading}>
              {avatarUrl ? (
                <Image src={avatarUrl} alt={displayName} width={80} height={80}
                  className="rounded-full ring-4 ring-white/30 shadow-xl object-cover w-20 h-20" unoptimized />
              ) : (
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center ring-4 ring-white/30 shadow-xl backdrop-blur-sm">
                  <span className="text-3xl font-black text-white">{uploading ? '⏳' : initial}</span>
                </div>
              )}
              {/* Camera overlay */}
              <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                {uploading
                  ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Camera size={20} className="text-white" />}
              </div>
            </button>
            <div className={`absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full bg-gradient-to-r ${level.color} text-white text-[10px] font-black border-2 border-white shadow-sm`}>
              {level.icon} {level.label}
            </div>
          </div>
          <p className="font-black text-white text-xl leading-tight">{displayName}</p>
          <p className="text-white/60 text-xs mt-0.5">{user.email}</p>
          <p className="text-white/40 text-[10px] mt-1">ສະມາຊິກ {memberSince}</p>
        </div>

        {/* Points bar */}
        <div className="mt-5 bg-white/10 rounded-2xl p-3.5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Zap size={12} className="text-yellow-300" />
              <span className="text-xs font-bold text-white">ຄະແນນສະສົມ</span>
            </div>
            <span className="font-black text-yellow-300 text-sm">{points.toLocaleString()} pts</span>
          </div>
          <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-300 to-amber-400 rounded-full transition-all"
              style={{ width: level.next ? `${Math.min(100, (points / level.nextPts) * 100)}%` : '100%' }} />
          </div>
          <p className="text-[10px] text-white/50 mt-1.5">
            {level.next ? `ຂາດ ${(level.nextPts - points).toLocaleString()} pts ຈຶ່ງຂຶ້ນ ${level.next}` : '🎉 ສູງສຸດ Diamond!'}
          </p>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="px-4 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="grid grid-cols-4 gap-0 divide-x divide-gray-100 animate-pulse">
              {[0,1,2,3].map(i => (
                <div key={i} className="flex flex-col items-center gap-1.5 py-4">
                  <div className="w-6 h-6 bg-gray-100 rounded-full" />
                  <div className="w-6 h-5 bg-gray-100 rounded" />
                  <div className="w-10 h-3 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 divide-x divide-gray-100">
              {[
                { href: '/orders',   icon: <Package size={20} className="text-[#1247D8]" />,   label: 'ການສັ່ງ',  count: stats.orders },
                { href: '/orders',   icon: <Truck size={20} className="text-orange-500" />,     label: 'ສົ່ງຢູ່',   count: stats.shipping },
                { href: '/wishlist', icon: <Heart size={20} className="text-red-500" />,         label: 'Wishlist', count: stats.wishlist },
                { href: '#',         icon: <Star size={20} className="text-yellow-500" />,       label: 'ລີວິວ',    count: stats.reviews },
              ].map(({ href, icon, label, count }) => (
                <Link key={label} href={href} className="flex flex-col items-center gap-0.5 py-4 active:bg-gray-50 transition-colors">
                  {icon}
                  <span className="font-black text-gray-800 text-lg leading-none mt-1">{count}</span>
                  <span className="text-gray-400 text-[10px]">{label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Shortcuts ── */}
      <div className="px-4 mt-3">
        <div className="bg-white rounded-2xl p-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">ທາງລັດ</p>
          <div className="grid grid-cols-4 gap-y-4">
            {[
              { icon: ClipboardList, label: 'ສັ່ງຊື້',    href: '/orders',   bg: 'bg-blue-50',   fg: 'text-[#1247D8]' },
              { icon: Heart,         label: 'Wishlist',   href: '/wishlist', bg: 'bg-red-50',    fg: 'text-red-500'   },
              { icon: Tag,           label: 'ໂຄດ',        href: '#coupons',  bg: 'bg-green-50',  fg: 'text-green-600' },
              { icon: Store,         label: 'ຮ້ານ',        href: '#shops',    bg: 'bg-indigo-50', fg: 'text-indigo-600'},
              { icon: Eye,           label: 'ລ່າສຸດ',     href: '#recent',   bg: 'bg-purple-50', fg: 'text-purple-600'},
              { icon: Award,         label: 'ຄະແນນ',      href: '#points',   bg: 'bg-amber-50',  fg: 'text-amber-600' },
              { icon: Star,          label: 'ລີວິວ',       href: '#',         bg: 'bg-yellow-50', fg: 'text-yellow-500'},
              { icon: Shield,        label: 'ຄວາມປອດໄພ',  href: '#',         bg: 'bg-gray-50',   fg: 'text-gray-500'  },
            ].map(({ icon: Icon, label, href, bg, fg }) => (
              <Link key={label} href={href} className="flex flex-col items-center gap-1.5 group">
                <div className={`w-12 h-12 ${bg} rounded-2xl flex items-center justify-center group-active:scale-95 transition-transform`}>
                  <Icon size={20} className={fg} />
                </div>
                <span className="text-[10px] text-gray-500 font-medium text-center leading-tight">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Menu list ── */}
      <div className="px-4 mt-3">
        <div className="bg-white rounded-2xl overflow-hidden">
          {[
            { icon: ClipboardList, label: 'ປະຫວັດການສັ່ງຊື້', href: '/orders',    bg: 'bg-blue-50',  fg: 'text-[#1247D8]',  badge: stats.orders > 0 ? stats.orders : undefined },
            { icon: Heart,         label: 'Wishlist',          href: '/wishlist',  bg: 'bg-red-50',   fg: 'text-red-500',    badge: stats.wishlist > 0 ? stats.wishlist : undefined },
            { icon: MapPin,        label: 'ທີ່ຢູ່ຈັດສົ່ງ',     href: '/addresses', bg: 'bg-green-50', fg: 'text-green-600',  badge: undefined },
          ].map(({ icon: Icon, label, href, bg, fg, badge }) => (
            <Link key={label} href={href}
              className="flex items-center gap-3.5 px-4 py-4 border-b border-gray-50 active:bg-gray-50 transition-colors last:border-0">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon size={18} className={fg} />
              </div>
              <span className="font-bold text-gray-800 flex-1 text-sm">{label}</span>
              {badge !== undefined && (
                <span className="bg-[#1247D8] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">{badge}</span>
              )}
              <ChevronRight size={15} className="text-gray-300" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Coupons ── */}
      <div className="px-4 mt-3" id="coupons">
        <div className="bg-white rounded-2xl overflow-hidden">
          <SectionHeader icon={<Tag size={14} className="text-green-600" />} title="ໂຄດສ່ວນຫຼຸດ" count={vouchers.length} />
          {loading ? (
            <div className="flex gap-3 px-4 pb-4 overflow-x-auto">
              {[0,1].map(i => <div key={i} className="shrink-0 w-52 h-20 bg-gray-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : vouchers.length === 0 ? (
            <div className="px-4 pb-6 text-center">
              <Gift size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-gray-400">ຍັງບໍ່ມີໂຄດສ່ວນຫຼຸດ</p>
            </div>
          ) : (
            <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-hide">
              {vouchers.map(v => <CouponCard key={v.id} voucher={v} subtotal={stats.orderTotal} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── Recently Viewed ── */}
      {recentProducts.length > 0 && (
        <div className="px-4 mt-3" id="recent">
          <div className="bg-white rounded-2xl overflow-hidden">
            <SectionHeader icon={<Eye size={14} className="text-purple-600" />} title="ເບິ່ງລ່າສຸດ" href="/products" count={recentProducts.length} />
            <div className="flex gap-3 px-4 pb-4 overflow-x-auto scrollbar-hide snap-x">
              {recentProducts.map(p => (
                <Link key={p.id} href={`/products/${p.id}`} className="shrink-0 w-28 snap-start group">
                  <div className="relative w-28 h-28 bg-gray-50 rounded-xl overflow-hidden mb-2">
                    {p.image_url
                      ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                    {discountPct(p) > 0 && (
                      <div className="absolute top-1.5 left-1.5 bg-[#EE4D2D] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">-{discountPct(p)}%</div>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-700 font-medium line-clamp-2 leading-snug">{p.name}</p>
                  <p className="text-xs font-black text-[#1247D8] mt-0.5">{fmt(p.discount_price ?? p.price)}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Dark / Light mode toggle ── */}
      <div className="px-4 mt-3">
        <button onClick={toggle}
          className="w-full flex items-center gap-3.5 bg-white px-4 py-4 rounded-2xl active:bg-gray-50 transition-colors">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-yellow-50' : 'bg-slate-100'}`}>
            {theme === 'dark'
              ? <Sun size={18} className="text-yellow-500" />
              : <Moon size={18} className="text-slate-500" />}
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-gray-800 text-sm">{theme === 'dark' ? 'ໂໝດມືດ' : 'ໂໝດສະຫວ່າງ'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{theme === 'dark' ? 'ກົດເພື່ອປ່ຽນເປັນໂໝດສະຫວ່າງ' : 'ກົດເພື່ອປ່ຽນເປັນໂໝດມືດ'}</p>
          </div>
          <div className={`w-12 h-6 rounded-full transition-colors relative ${theme === 'dark' ? 'bg-[#1247D8]' : 'bg-gray-200'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </div>
        </button>
      </div>

      {/* ── Sign out ── */}
      <div className="px-4 mt-2 pb-28">
        <button onClick={handleSignOut}
          className="w-full flex items-center gap-3.5 bg-white px-4 py-4 rounded-2xl active:bg-red-50 transition-colors">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
            <LogOut size={18} className="text-red-500" />
          </div>
          <span className="font-bold text-red-500 text-sm">ອອກຈາກລະບົບ</span>
        </button>
        <p className="text-center text-[10px] text-gray-300 mt-4">BlueWhale v1.0 🐋</p>
      </div>
    </div>
  )
}
