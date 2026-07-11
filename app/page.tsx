import { getProducts, fmt, discountPct } from '@/lib/supabase'
import ProductCard from '@/components/product/ProductCard'
import Link from 'next/link'
import Image from 'next/image'

const banners = [
  { bg: 'from-[#1247D8] to-[#3B82F6]', tag: 'Flash Sale 🔥', title: 'ຫຼຸດສູງສຸດ 50%', sub: 'ສິນຄ້າເລືອກສັນ ລາຄາສຸດພິເສດ', btn: 'ຊື້ດ່ວນ' },
  { bg: 'from-[#7B2FBE] to-[#A855F7]', tag: 'ໃໝ່ເຂົ້າ 🆕', title: 'ສິນຄ້າໃໝ່ປະຈຳອາທິດ', sub: 'Update ທຸກວັນຈັນ', btn: 'ເບິ່ງທັງໝົດ' },
  { bg: 'from-[#EE4D2D] to-[#FF6B35]', tag: 'COD 💰', title: 'ຈ່າຍປາຍທາງໄດ້', sub: 'ທົ່ວນະຄອນ ວຽງຈັນ', btn: 'ສັ່ງຊື້ເລີຍ' },
]

const services = [
  { icon: '🚚', label: 'ສົ່ງຟຣີ' },
  { icon: '💳', label: 'BCEL One' },
  { icon: '💵', label: 'COD' },
  { icon: '🔄', label: 'ຄືນສິນຄ້າ' },
  { icon: '✅', label: 'ຮ້ານຢັ້ງຢືນ' },
]

export default async function Home() {
  const products = await getProducts()
  const flashSale = products.filter(p => p.discount_price).slice(0, 8)

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
      {/* Banners */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {banners.map((b, i) => (
          <div key={i} className={`bg-gradient-to-r ${b.bg} rounded-2xl p-6 text-white relative overflow-hidden`}>
            <div className="absolute right-0 top-0 w-32 h-32 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
            <span className="bg-white/20 text-xs font-bold px-3 py-1 rounded-full">{b.tag}</span>
            <h2 className="text-xl font-black mt-3">{b.title}</h2>
            <p className="text-white/80 text-sm mt-1">{b.sub}</p>
            <Link href="/products" className="inline-block mt-4 bg-white text-[#1247D8] font-bold px-5 py-2 rounded-xl text-sm hover:bg-gray-100 transition-colors">
              {b.btn} →
            </Link>
          </div>
        ))}
      </div>

      {/* Services */}
      <div className="bg-white rounded-2xl p-4 flex justify-around shadow-sm">
        {services.map(s => (
          <div key={s.label} className="flex flex-col items-center gap-1">
            <span className="text-2xl">{s.icon}</span>
            <span className="text-xs text-gray-600 font-medium">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Flash Sale */}
      {flashSale.length > 0 && (
        <div className="bg-[#0E1420] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-[#EE4D2D] text-xl">⚡</span>
              <h2 className="text-white font-black text-lg">Flash Sale</h2>
            </div>
            <Link href="/products" className="text-[#EE4D2D] text-sm font-bold hover:underline">ເບິ່ງທັງໝົດ →</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {flashSale.map(p => {
              const pct = discountPct(p)
              return (
                <Link key={p.id} href={`/products/${p.id}`}
                  className="shrink-0 w-36 bg-[#1A2540] rounded-xl overflow-hidden hover:scale-105 transition-transform">
                  <div className="relative w-full aspect-square">
                    {p.image_url && <Image src={p.image_url} alt={p.name} fill className="object-cover" unoptimized />}
                    {pct > 0 && <div className="absolute top-0 left-0 bg-[#EE4D2D] text-white text-xs font-black px-2 py-0.5 rounded-br-lg">-{pct}%</div>}
                  </div>
                  <div className="p-2">
                    <p className="text-white text-xs line-clamp-1">{p.name}</p>
                    <p className="text-[#EE4D2D] font-black text-sm">{fmt(p.discount_price ?? p.price)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Products grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-gray-800 font-black text-lg">🛒 ສິນຄ້າທັງໝົດ</h2>
          <Link href="/products" className="text-[#1247D8] text-sm font-bold hover:underline">ດູທັງໝົດ →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {products.map(p => <ProductCard key={p.id} p={p} />)}
        </div>
      </div>
    </div>
  )
}
