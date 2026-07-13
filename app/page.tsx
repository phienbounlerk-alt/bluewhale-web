import { getProducts, fmt, discountPct } from '@/lib/supabase'
import ProductCard from '@/components/product/ProductCard'
import FlashSaleSection from '@/components/home/FlashSaleSection'
import BannerSlider from '@/components/home/BannerSlider'
import Link from 'next/link'

const shortcuts = [
  { icon: '🏷️', label: 'ຊຸດດ', href: '/products?tag=sale' },
  { icon: '🚚', label: 'ສົ່ງຟຣີ', href: '/products?tag=freeship' },
  { icon: '⚡', label: 'Flash Sale', href: '/products?tag=flash' },
  { icon: '🆕', label: 'ສິນຄ້າໃໝ່', href: '/products?tag=new' },
  { icon: '💳', label: 'ເຕີມຊຶ', href: '/products?tag=topup' },
]

const services = [
  { icon: '🚚', label: 'ສົ່ງຟຣີ' },
  { icon: '🏦', label: 'BCEL One' },
  { icon: '💵', label: 'COD' },
  { icon: '🔄', label: 'ຄືນສິນຄ້າ' },
  { icon: '✅', label: 'ຮ້ານຢັ້ງຢືນ' },
]

export default async function Home() {
  const products = await getProducts()
  const flashSale = products.filter(p => p.discount_price).slice(0, 8)
  const recommended = products.slice(0, 12)

  return (
    <div className="bg-gray-100 min-h-screen">

      {/* Shortcut icons */}
      <div className="bg-white px-4 py-3 flex justify-around border-b border-gray-100">
        {shortcuts.map(s => (
          <Link key={s.label} href={s.href} className="flex flex-col items-center gap-1 group">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl group-hover:bg-blue-100 transition-colors">
              {s.icon}
            </div>
            <span className="text-xs text-gray-600 font-medium">{s.label}</span>
          </Link>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-3 py-3 space-y-3">

        {/* Banner Slider */}
        <BannerSlider />

        {/* Services strip */}
        <div className="bg-white rounded-2xl p-4 flex justify-around shadow-sm">
          {services.map(s => (
            <div key={s.label} className="flex flex-col items-center gap-1">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-xs text-gray-600 font-medium">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Flash Sale with countdown */}
        {flashSale.length > 0 && (
          <FlashSaleSection products={flashSale} />
        )}

        {/* Recommended Products */}
        <div className="bg-white rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-1 h-5 bg-[#1247D8] rounded-full" />
              <h2 className="text-gray-800 font-black text-base">ສິນຄ້າແນະນຳ</h2>
            </div>
            <Link href="/products" className="text-[#1247D8] text-sm font-bold hover:underline">ເບີ່ງທັງໝົດ →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {recommended.map(p => <ProductCard key={p.id} p={p} />)}
          </div>
        </div>

      </div>
    </div>
  )
}
