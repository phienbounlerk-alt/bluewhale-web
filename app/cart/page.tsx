'use client'
import { useCart } from '@/store/cart'
import { fmt } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'

const FREE_SHIPPING = 200000
const SHIPPING = 20000

export default function CartPage() {
  const { items, remove, update, total, clear } = useCart()
  const subtotal = total()
  const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIPPING
  const grand = subtotal + shipping

  if (items.length === 0) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="text-6xl mb-4">🛒</div>
      <h2 className="text-xl font-black text-gray-700 mb-2">ກະຕ່າຫວ່າງ</h2>
      <p className="text-gray-400 mb-6">ເລີ່ມຊອບປິ້ງ ເພື່ອເພີ່ມສິນຄ້າ</p>
      <Link href="/products" className="bg-[#1247D8] text-white font-bold px-8 py-3 rounded-2xl hover:bg-[#0d35b0] transition-colors">
        ເລືອກຊື້ສິນຄ້າ
      </Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-2">
        <ShoppingBag className="text-[#1247D8]" /> ກະຕ່າສິນຄ້າ
      </h1>

      {/* Free shipping progress */}
      {subtotal < FREE_SHIPPING && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
          <p className="text-sm text-[#1247D8] font-medium mb-2">
            ຊື້ເພີ່ມ <strong>{fmt(FREE_SHIPPING - subtotal)}</strong> ເພື່ອໄດ້ສົ່ງຟຣີ 🚚
          </p>
          <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#1247D8] rounded-full transition-all"
              style={{ width: `${Math.min(100, subtotal / FREE_SHIPPING * 100)}%` }} />
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Items */}
        <div className="md:col-span-2 space-y-3">
          {items.map(({ product: p, quantity }) => (
            <div key={p.id} className="bg-white rounded-2xl p-4 flex gap-4 shadow-sm border border-gray-100">
              <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-gray-100">
                {p.image_url && <Image src={p.image_url} alt={p.name} fill className="object-cover" unoptimized />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm line-clamp-2">{p.name}</p>
                <p className="text-[#1247D8] font-black mt-1">{fmt(p.discount_price ?? p.price)}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button onClick={() => update(p.id, quantity - 1)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                    <Minus size={12} />
                  </button>
                  <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                  <button onClick={() => update(p.id, quantity + 1)} className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
                    <Plus size={12} />
                  </button>
                  <button onClick={() => remove(p.id)} className="ml-auto text-red-400 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-fit sticky top-24">
          <h2 className="font-black text-gray-800 mb-4">ສະຫຼຸບລາຄາ</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>ລາຄາສິນຄ້າ</span><span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>ຄ່າສົ່ງ</span>
              <span className={shipping === 0 ? 'text-green-500 font-bold' : ''}>{shipping === 0 ? 'ຟຣີ 🎉' : fmt(shipping)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-black text-lg">
              <span>ລວມທັງໝົດ</span><span className="text-[#1247D8]">{fmt(grand)}</span>
            </div>
          </div>
          <Link href="/checkout" className="block mt-5 bg-[#1247D8] text-white text-center font-black py-4 rounded-2xl hover:bg-[#0d35b0] transition-colors">
            ດຳເນີນການຊຳລະ →
          </Link>
          <button onClick={clear} className="block w-full mt-2 text-red-400 text-sm text-center hover:underline">
            ລ້າງກະຕ່າ
          </button>
        </div>
      </div>
    </div>
  )
}
