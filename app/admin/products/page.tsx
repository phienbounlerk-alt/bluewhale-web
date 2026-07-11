'use client'
import { useEffect, useState } from 'react'
import { supabase, getProducts, fmt, type Product } from '@/lib/supabase'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Search, X } from 'lucide-react'

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Partial<Product> | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => { getProducts().then(setProducts) }, [])

  const filtered = products.filter(p =>
    !q || p.name.toLowerCase().includes(q.toLowerCase()) || p.category.includes(q))

  const openNew = () => setEditing({ name: '', description: '', price: 0, category: 'ເສື້ອຜ້າ', stock: 0, image_url: '' })
  const openEdit = (p: Product) => setEditing({ ...p })

  const save = async () => {
    if (!editing?.name || !editing.price) return
    setSaving(true)
    if (editing.id && !editing.id.startsWith('s')) {
      await supabase.from('products').update({
        name: editing.name, description: editing.description,
        price: editing.price, discount_price: editing.discount_price,
        category: editing.category, stock: editing.stock, image_url: editing.image_url,
      }).eq('id', editing.id)
    } else {
      await supabase.from('products').insert({
        name: editing.name, description: editing.description,
        price: editing.price, discount_price: editing.discount_price || null,
        category: editing.category, stock: editing.stock, image_url: editing.image_url || null,
        rating: 4.5, review_count: 0, images: [],
      })
    }
    const fresh = await getProducts()
    setProducts(fresh)
    setEditing(null)
    setSaving(false)
  }

  const del = async (id: string) => {
    if (!confirm('ລຶບສິນຄ້ານີ້?')) return
    if (!id.startsWith('s')) await supabase.from('products').delete().eq('id', id)
    setProducts(ps => ps.filter(p => p.id !== id))
  }

  const set = (k: keyof Product, v: any) => setEditing(e => ({ ...e, [k]: v }))

  const cats = ['ເສື້ອຜ້າ', 'ອີເລັກໂທຣນິກ', 'ອາຫານ & ເຄື່ອງດື່ມ', 'ຄວາມງາມ', 'ຂອງໃຊ້ໃນບ້ານ', 'ອື່ນໆ']

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <Search size={16} className="mx-3 text-gray-400 shrink-0" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="ຄົ້ນຫາສິນຄ້າ..."
            className="flex-1 py-2.5 text-sm outline-none" />
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 bg-[#1247D8] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#0d35b0] transition-colors shadow-sm">
          <Plus size={16} /> ເພີ່ມສິນຄ້າ
        </button>
      </div>

      <p className="text-sm text-gray-500">{filtered.length} ລາຍການ</p>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="relative aspect-square bg-gray-50">
              {p.image_url
                ? <Image src={p.image_url} alt={p.name} fill className="object-cover" unoptimized />
                : <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>}
              {p.discount_price && (
                <div className="absolute top-2 left-2 bg-[#EE4D2D] text-white text-xs font-black px-2 py-0.5 rounded-lg">
                  -{Math.round((1 - p.discount_price / p.price) * 100)}%
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="font-bold text-sm text-gray-800 line-clamp-1">{p.name}</p>
              <p className="text-[#1247D8] font-black text-sm mt-1">{fmt(p.discount_price ?? p.price)}</p>
              <p className="text-xs text-gray-400 mt-0.5">ສາງ: {p.stock} | {p.category}</p>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEdit(p)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-blue-50 text-[#1247D8] text-xs font-bold hover:bg-blue-100 transition-colors">
                  <Pencil size={12} /> ແກ້ໄຂ
                </button>
                <button onClick={() => del(p.id)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-bold hover:bg-red-100 transition-colors">
                  <Trash2 size={12} /> ລຶບ
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-black text-gray-800">{editing.id ? 'ແກ້ໄຂສິນຄ້າ' : 'ສິນຄ້າໃໝ່'}</h2>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              {[
                { label: 'ຊື່ສິນຄ້າ', key: 'name', type: 'text' },
                { label: 'ລາຄາ (₭)', key: 'price', type: 'number' },
                { label: 'ລາຄາຫຼຸດ (₭)', key: 'discount_price', type: 'number' },
                { label: 'ສາງ', key: 'stock', type: 'number' },
                { label: 'URL ຮູບ', key: 'image_url', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">{f.label}</label>
                  <input type={f.type} value={(editing as any)[f.key] ?? ''}
                    onChange={e => set(f.key as keyof Product, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1247D8] transition-colors" />
                </div>
              ))}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">ໝວດ</label>
                <select value={editing.category ?? ''} onChange={e => set('category', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1247D8]">
                  {cats.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">ລາຍລະອຽດ</label>
                <textarea rows={3} value={editing.description ?? ''}
                  onChange={e => set('description', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1247D8] resize-none" />
              </div>
              {/* Preview */}
              {editing.image_url && (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-gray-100">
                  <Image src={editing.image_url} alt="" fill className="object-cover" unoptimized />
                </div>
              )}
            </div>
            <div className="flex gap-3 p-5 border-t">
              <button onClick={() => setEditing(null)}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50">
                ຍົກເລີກ
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-[#1247D8] text-white font-bold text-sm hover:bg-[#0d35b0] disabled:opacity-60">
                {saving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
