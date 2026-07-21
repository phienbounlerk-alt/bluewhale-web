import { getProducts } from '@/lib/supabase'
import ProductCard from '@/components/product/ProductCard'
import FlashSaleSection from '@/components/home/FlashSaleSection'
import BannerSlider from '@/components/home/BannerSlider'
import ProductRowSection from '@/components/home/ProductRowSection'
import RecentlyViewedSection from '@/components/home/RecentlyViewedSection'
import FeaturedStoresSection from '@/components/home/FeaturedStoresSection'
import Link from 'next/link'

const categories = [
  { icon: '👗', label: 'ເສື້ອຜ້າ',       href: '/products?category=ເສື້ອຜ້າ',           color: 'bg-pink-50 text-pink-600' },
  { icon: '📱', label: 'ອີເລັກ',          href: '/products?category=ອີເລັກໂທຣນິກ',       color: 'bg-blue-50 text-blue-600' },
  { icon: '🍜', label: 'ອາຫານ',           href: '/products?category=ອາຫານ & ເຄື່ອງດື່ມ', color: 'bg-orange-50 text-orange-600' },
  { icon: '💄', label: 'ຄວາມງາມ',         href: '/products?category=ຄວາມງາມ',             color: 'bg-purple-50 text-purple-600' },
  { icon: '🏠', label: 'ຂອງໃຊ້ບ້ານ',     href: '/products?category=ຂອງໃຊ້ໃນບ້ານ',       color: 'bg-green-50 text-green-600' },
  { icon: '🎁', label: 'ທັງໝົດ',          href: '/products',                              color: 'bg-gray-50 text-gray-600' },
]

const services = [
  { icon: '🚚', label: 'ສົ່ງຟຣີ',   sub: '≥ ₭200,000' },
  { icon: '💳', label: 'BCEL One', sub: 'JDB · LDB' },
  { icon: '💵', label: 'COD',      sub: 'ຈ່າຍປາຍທາງ' },
  { icon: '🔄', label: 'ຄືນສິນຄ້າ', sub: '7 ວັນ' },
  { icon: '✅', label: 'ຢັ້ງຢືນ',   sub: '100%' },
]

export default async function Home() {
  const products = await getProducts()

  const flashSale   = products.filter(p => p.discount_price).slice(0, 8)
  const bestSellers = [...products].sort((a, b) => (b.review_count ?? 0) - (a.review_count ?? 0)).slice(0, 10)
  const newArrivals = [...products].reverse().slice(0, 10)
  const recommended = products.slice(0, 12)

  return (
    <div className="bg-gray-100 min-h-screen animate-fade-in">

      {/* Announcement strip */}
      <div className="bg-gradient-to-r from-[#1247D8] to-[#0d35b0] px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <p className="text-white/80 text-xs font-medium">🐋 ຕະຫຼາດດິຈິຕອລ ອັນດັບ 1 ລາວ</p>
          <p className="text-white/60 text-xs">ສົ່ງທົ່ວລາວ 🇱🇦</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 py-3 space-y-3">

        {/* Banner Slider */}
        <BannerSlider />

        {/* Categories */}
        <div className="bg-white rounded-2xl p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-black text-gray-800 text-sm">ໝວດໝູ່ສິນຄ້າ</h2>
            <Link href="/products" className="text-[#1247D8] text-xs font-bold hover:underline">ເບິ່ງທັງໝົດ →</Link>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {categories.map((c, i) => (
              <Link key={c.label} href={c.href}
                className="flex flex-col items-center gap-1.5 group animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}>
                <div className={`w-11 h-11 ${c.color} rounded-2xl flex items-center justify-center text-xl transition-all duration-200 group-hover:scale-110 group-hover:shadow-md group-active:scale-95`}>
                  {c.icon}
                </div>
                <span className="text-[10px] text-gray-600 font-medium text-center leading-tight group-hover:text-[#1247D8] transition-colors">{c.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-2xl px-4 py-3 shadow-[var(--shadow-card)]">
          <div className="flex justify-around">
            {services.map((s, i) => (
              <div key={s.label}
                className="flex flex-col items-center gap-0.5 animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}>
                <span className="text-xl">{s.icon}</span>
                <span className="text-[10px] text-gray-700 font-bold">{s.label}</span>
                <span className="text-[9px] text-gray-400">{s.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Flash Sale */}
        {flashSale.length > 0 && <FlashSaleSection products={flashSale} />}

        {/* Best Sellers */}
        {bestSellers.length > 0 && (
          <ProductRowSection
            title="ຂາຍດີທີ່ສຸດ"
            icon="🏆"
            products={bestSellers}
            accent="#EE4D2D"
          />
        )}

        {/* Featured Stores */}
        <FeaturedStoresSection />

        {/* New Arrivals */}
        {newArrivals.length > 0 && (
          <ProductRowSection
            title="ສິນຄ້າໃໝ່"
            icon="🆕"
            products={newArrivals}
            accent="#1247D8"
          />
        )}

        {/* Recently Viewed — client, reads localStorage */}
        <RecentlyViewedSection products={products} />

        {/* Recommended */}
        <div className="bg-white rounded-2xl p-4 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-[#1247D8] rounded-full" />
              <span className="text-lg">⭐</span>
              <h2 className="text-gray-800 font-black text-base">ສິນຄ້າແນະນຳ</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{recommended.length} ລາຍການ</span>
            </div>
            <Link href="/products" className="text-[#1247D8] text-sm font-bold hover:underline">ທັງໝົດ →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {recommended.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>

      </div>
    </div>
  )
}
