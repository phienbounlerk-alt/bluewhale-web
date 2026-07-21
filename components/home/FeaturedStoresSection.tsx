import Link from 'next/link'

const stores = [
  { id: 1, name: 'BlueWhale Official', category: 'ສິນຄ້າທົ່ວໄປ', emoji: '🐋', followers: '12.4k', verified: true, color: 'from-[#1247D8] to-[#0d35b0]' },
  { id: 2, name: 'Lao Fashion House', category: 'ເສື້ອຜ້າ & ແຟຊັ່ນ', emoji: '👗', followers: '8.2k', verified: true, color: 'from-pink-500 to-rose-500' },
  { id: 3, name: 'Tech Zone Laos', category: 'ອີເລັກໂທຣນິກ', emoji: '📱', followers: '6.7k', verified: true, color: 'from-slate-700 to-slate-900' },
  { id: 4, name: 'Beauty Corner', category: 'ຄວາມງາມ & ສຸຂະພາບ', emoji: '💄', followers: '5.1k', verified: false, color: 'from-purple-500 to-pink-500' },
  { id: 5, name: 'Home & Living', category: 'ຂອງໃຊ້ໃນບ້ານ', emoji: '🏠', followers: '4.3k', verified: false, color: 'from-emerald-500 to-teal-600' },
  { id: 6, name: 'Lao Fresh Market', category: 'ອາຫານ & ເຄື່ອງດື່ມ', emoji: '🛒', followers: '9.8k', verified: true, color: 'from-orange-500 to-amber-500' },
]

export default function FeaturedStoresSection() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-[#1247D8] rounded-full" />
          <span className="text-lg">🏪</span>
          <h2 className="font-black text-gray-800 text-base">ຮ້ານແນະນຳ</h2>
        </div>
        <Link href="/products" className="text-xs font-bold text-[#1247D8] px-3 py-1 rounded-full border border-[#1247D8]/30 hover:bg-[#1247D8] hover:text-white transition-colors">
          ທັງໝົດ →
        </Link>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 py-3 pb-4 scrollbar-hide snap-x">
        {stores.map(store => (
          <Link key={store.id} href="/products"
            className="shrink-0 w-32 snap-start group">
            {/* Store avatar */}
            <div className={`w-32 h-20 bg-gradient-to-br ${store.color} rounded-xl flex items-center justify-center mb-2 relative overflow-hidden group-hover:scale-[1.03] transition-transform`}>
              <span className="text-4xl drop-shadow">{store.emoji}</span>
              {store.verified && (
                <div className="absolute top-1.5 right-1.5 bg-white/90 rounded-full w-5 h-5 flex items-center justify-center">
                  <span className="text-[10px]">✓</span>
                </div>
              )}
            </div>
            <p className="text-gray-800 text-xs font-bold line-clamp-1">{store.name}</p>
            <p className="text-gray-400 text-[10px] line-clamp-1">{store.category}</p>
            <p className="text-[#1247D8] text-[10px] font-bold mt-0.5">👥 {store.followers}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
