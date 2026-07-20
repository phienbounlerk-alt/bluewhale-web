'use client'
import { useEffect, useState } from 'react'
import { supabase, getProduct, fmt, type Product } from '@/lib/supabase'
import Image from 'next/image'
import Link from 'next/link'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { useCart } from '@/store/cart'

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const add = useCart(s => s.add)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setLoading(false); return }
      setUser(data.user)
      const { data: rows } = await supabase.from('wishlists').select('product_id').eq('user_id', data.user.id)
      if (!rows?.length) { setLoading(false); return }
      const items = await Promise.all(rows.map(r => getProduct(r.product_id)))
      setProducts(items.filter(Boolean) as Product[])
      setLoading(false)
    })
  }, [])

  const remove = async (productId: string) => {
    const { data: u } = await supabase.auth.getUser()
    if (!u.user) return
    await supabase.from('wishlists').delete().eq('user_id', u.user.id).eq('product_id', productId)
    setProducts(ps => ps.filter(p => p.id !== productId))
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-400">ກຳລັງໂຫຼດ...</div>

  if (!user) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <Heart size={48} className="text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 mb-4">ກະລຸນາເຂົ້າສູ່ລະບົບເພື່ອດູ Wishlist</p>
      <Link href="/login" className="bg-[#1247D8] text-white px-6 py-2.5 rounded-xl font-bold">ເຂົ້າສູ່ລະບົບ</Link>
    </div>
  )

  if (products.length === 0) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <Heart size={48} className="text-gray-300 mx-auto mb-4" />
      <h2 className="text-xl font-black text-gray-700 mb-2">Wishlist ຫວ່າງ</h2>
      <p className="text-gray-400 mb-6">ກົດ ❤️ ເທິງສິນຄ້າທີ່ຊອບ</p>
      <Link href="/products" className="bg-[#1247D8] text-white font-bold px-8 py-3 rounded-2xl">ເລືອກສິນຄ້າ</Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Heart size={22} className="text-red-500 fill-red-500" />
        <h1 className="text-xl font-black text-gray-800">Wishlist ຂອງຂ້ອຍ</h1>
        <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{products.length} ລາຍການ</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map(p => {
          const display = p.discount_price ?? p.price
          return (
            <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col">
              <Link href={`/products/${p.id}`} className="relative aspect-square bg-gray-100 block">
                {p.image_url
                  ? <Image src={p.image_url} alt={p.name} fill className="object-cover" unoptimized />
                  : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>}
              </Link>
              <div className="p-3 flex flex-col flex-1">
                <Link href={`/products/${p.id}`}>
                  <p className="text-sm font-medium text-gray-800 line-clamp-2">{p.name}</p>
                </Link>
                <p className="text-[#1247D8] font-black mt-1">{fmt(display)}</p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => add(p)}
                    className="flex-1 flex items-center justify-center gap-1 bg-[#1247D8] text-white text-xs font-bold py-2 rounded-xl hover:bg-[#0d35b0] transition-colors">
                    <ShoppingCart size={12} /> ໃສ່ກະຕ່າ
                  </button>
                  <button onClick={() => remove(p.id)}
                    className="w-9 h-9 flex items-center justify-center bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
