'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase, fmt, type Product } from '@/lib/supabase'
import Image from 'next/image'
import { Plus, Pencil, Trash2, Search, X, Upload, Link as LinkIcon } from 'lucide-react'

type VariantRow = { options: Record<string, string>; stock: number; price?: number }

function cartesian(opts: Record<string, string[]>): Record<string, string>[] {
  const keys = Object.keys(opts)
  if (!keys.length) return []
  return keys.reduce((acc: Record<string, string>[], key) => {
    const vals = opts[key]
    if (!acc.length) return vals.map(v => ({ [key]: v }))
    return acc.flatMap(combo => vals.map(v => ({ ...combo, [key]: v })))
  }, [])
}

const CATS = ['ເສື້ອຜ້າ', 'ອີເລັກໂທຣນິກ', 'ອາຫານ & ເຄື່ອງດື່ມ', 'ຄວາມງາມ', 'ຂອງໃຊ້ໃນບ້ານ', 'ອື່ນໆ']

export default function SellerProducts() {
  const [sellerId, setSellerId] = useState<string | null>(null)
  const [isApproved, setIsApproved] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<Partial<Product> | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [newImageUrl, setNewImageUrl] = useState('')
  const [variants, setVariants] = useState<VariantRow[]>([])
  const [newOptName, setNewOptName] = useState('')
  const [newOptValues, setNewOptValues] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const { data: s } = await supabase.from('sellers').select('id,is_approved').eq('user_id', data.session.user.id).single()
      if (!s) return
      setSellerId(s.id)
      setIsApproved(s.is_approved)
      if (s.is_approved) loadProducts(s.id)
    })
  }, [])

  const loadProducts = async (sid: string) => {
    const { data } = await supabase.from('products').select('*').eq('seller_id', sid).order('created_at', { ascending: false })
    setProducts(data ?? [])
  }

  const filtered = products.filter(p => !q || p.name.toLowerCase().includes(q.toLowerCase()))

  const openNew = () => {
    setEditing({ name: '', description: '', price: 0, category: 'ເສື້ອຜ້າ', stock: 0, image_url: '', images: [], variant_options: {} })
    setVariants([]); setNewOptName(''); setNewOptValues('')
  }

  const openEdit = async (p: Product) => {
    setEditing({ ...p, images: p.images ?? [], variant_options: p.variant_options ?? {} })
    const { data } = await supabase.from('product_variants').select('*').eq('product_id', p.id).order('created_at')
    setVariants((data ?? []).map((v: any) => ({ options: v.options, stock: v.stock, price: v.price })))
    setNewOptName(''); setNewOptValues('')
  }

  const save = async () => {
    if (!editing?.name || !editing.price || !sellerId) return
    setSaving(true)
    const payload = {
      name: editing.name, description: editing.description,
      price: editing.price, discount_price: editing.discount_price || null,
      category: editing.category, stock: editing.stock,
      image_url: editing.image_url || (editing.images?.[0] ?? null),
      images: editing.images ?? [],
      variant_options: editing.variant_options ?? {},
      seller_id: sellerId,
      rating: 4.5, review_count: 0,
    }
    let productId = editing.id
    if (editing.id) {
      await supabase.from('products').update(payload).eq('id', editing.id)
    } else {
      const { data } = await supabase.from('products').insert(payload).select().single()
      productId = data?.id
    }
    if (productId && variants.length > 0) {
      await supabase.from('product_variants').delete().eq('product_id', productId)
      await supabase.from('product_variants').insert(variants.map(v => ({ product_id: productId, options: v.options, stock: v.stock, price: v.price ?? null })))
    }
    await loadProducts(sellerId)
    setEditing(null); setVariants([]); setSaving(false); setNewImageUrl('')
  }

  const del = async (id: string) => {
    if (!confirm('ລຶບສິນຄ້ານີ້?') || !sellerId) return
    await supabase.from('product_variants').delete().eq('product_id', id)
    await supabase.from('products').delete().eq('id', id).eq('seller_id', sellerId)
    setProducts(ps => ps.filter(p => p.id !== id))
  }

  const setField = (k: keyof Product, v: any) => setEditing(e => ({ ...e, [k]: v }))

  const uploadFile = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('products').upload(path, file, { upsert: true })
    if (error) { alert('Upload error: ' + error.message); setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(path)
    addImage(publicUrl); setUploading(false)
  }

  const addImage = (url: string) => {
    if (!url.trim()) return
    setEditing(e => { const imgs = [...(e?.images ?? []), url.trim()]; return { ...e, images: imgs, image_url: e?.image_url || imgs[0] } })
    setNewImageUrl('')
  }

  const removeImage = (idx: number) => {
    setEditing(e => { const imgs = (e?.images ?? []).filter((_, i) => i !== idx); return { ...e, images: imgs, image_url: imgs[0] ?? '' } })
  }

  const addOptionGroup = () => {
    if (!newOptName.trim() || !newOptValues.trim()) return
    const values = newOptValues.split(',').map(v => v.trim()).filter(Boolean)
    setEditing(e => ({ ...e, variant_options: { ...(e?.variant_options ?? {}), [newOptName.trim()]: values } }))
    setNewOptName(''); setNewOptValues('')
  }

  const generateVariants = () => {
    const combos = cartesian(editing?.variant_options ?? {})
    setVariants(combos.map(options => ({ options, stock: 10, price: undefined })))
  }

  if (!isApproved) return (
    <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
      <div className="text-5xl mb-4">⏳</div>
      <p className="font-bold text-gray-600 text-lg">ລໍຖ້າການອະນຸມັດ</p>
      <p className="text-sm mt-2">ຫຼັງຈາກ Admin ອະນຸມັດຮ້ານ ຈຶ່ງສາມາດ upload ສິນຄ້າໄດ້</p>
    </div>
  )

  return (
    <div className="space-y-4">
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

      {filtered.length === 0 && !editing && (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          <div className="text-5xl mb-4">📦</div>
          <p className="font-bold text-gray-600">ຍັງບໍ່ມີສິນຄ້າ</p>
          <p className="text-sm mt-1">ກົດ "ເພີ່ມສິນຄ້າ" ເພື່ອເລີ່ມຂາຍ</p>
        </div>
      )}

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
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white z-10">
              <h2 className="font-black text-gray-800">{editing.id ? 'ແກ້ໄຂສິນຄ້າ' : 'ສິນຄ້າໃໝ່'}</h2>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-gray-100 rounded-lg"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-4">
              {([
                { label: 'ຊື່ສິນຄ້າ *', key: 'name', type: 'text' },
                { label: 'ລາຄາ (₭) *', key: 'price', type: 'number' },
                { label: 'ລາຄາຫຼຸດ (₭)', key: 'discount_price', type: 'number' },
                { label: 'ສາງ', key: 'stock', type: 'number' },
              ] as const).map(f => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-gray-600 mb-1 block">{f.label}</label>
                  <input type={f.type} value={(editing as any)[f.key] ?? ''}
                    onChange={e => setField(f.key as keyof Product, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1247D8]" />
                </div>
              ))}

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">ໝວດ</label>
                <select value={editing.category ?? ''} onChange={e => setField('category', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1247D8]">
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 mb-1 block">ລາຍລະອຽດ</label>
                <textarea rows={3} value={editing.description ?? ''} onChange={e => setField('description', e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1247D8] resize-none" />
              </div>

              {/* Images */}
              <div>
                <label className="text-xs font-bold text-gray-600 mb-2 block">📷 ຮູບສິນຄ້າ ({editing.images?.length ?? 0} ຮູບ)</label>
                {(editing.images?.length ?? 0) > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {editing.images!.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-gray-200 group">
                        <Image src={img} alt="" fill className="object-cover" unoptimized />
                        {i === 0 && <div className="absolute bottom-0 left-0 right-0 bg-[#1247D8] text-white text-[10px] text-center font-bold">ຫຼັກ</div>}
                        <button onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={async e => { for (const f of Array.from(e.target.files ?? [])) await uploadFile(f); e.target.value = '' }} />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm text-gray-500 hover:border-[#1247D8] hover:text-[#1247D8] transition-colors disabled:opacity-60 mb-2">
                  <Upload size={16} />{uploading ? 'ກຳລັງ upload...' : 'Upload ຮູບ'}
                </button>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center border border-gray-200 rounded-xl overflow-hidden">
                    <LinkIcon size={14} className="mx-2 text-gray-400 shrink-0" />
                    <input value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder="ວາງ URL ຮູບ..."
                      onKeyDown={e => e.key === 'Enter' && addImage(newImageUrl)}
                      className="flex-1 py-2.5 pr-3 text-sm outline-none" />
                  </div>
                  <button onClick={() => addImage(newImageUrl)} className="px-4 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold">ເພີ່ມ</button>
                </div>
              </div>

              {/* Variants */}
              <div className="border-t pt-4">
                <label className="text-xs font-bold text-gray-600 mb-3 block">🎛️ ຕົວເລືອກ (Variants)</label>
                {Object.entries(editing.variant_options ?? {}).map(([key, vals]) => (
                  <div key={key} className="flex items-center gap-2 mb-2 bg-purple-50 rounded-xl px-3 py-2">
                    <span className="font-bold text-sm text-purple-700 w-12 shrink-0">{key}:</span>
                    <div className="flex flex-wrap gap-1 flex-1">
                      {(vals as string[]).map(v => <span key={v} className="bg-white border border-purple-200 text-purple-700 text-xs px-2 py-0.5 rounded-lg font-bold">{v}</span>)}
                    </div>
                    <button onClick={() => { const vo = { ...(editing.variant_options ?? {}) }; delete vo[key]; setField('variant_options', vo); setVariants([]) }}><X size={14} className="text-red-400" /></button>
                  </div>
                ))}
                <div className="flex gap-2 mb-3">
                  <input value={newOptName} onChange={e => setNewOptName(e.target.value)} placeholder="ຊື່ (ເບີ, ສີ)"
                    className="w-20 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1247D8]" />
                  <input value={newOptValues} onChange={e => setNewOptValues(e.target.value)} placeholder="ຄ່າ: 38,39,40"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1247D8]" />
                  <button onClick={addOptionGroup} className="px-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold">ເພີ່ມ</button>
                </div>
                {Object.keys(editing.variant_options ?? {}).length > 0 && (
                  <button onClick={generateVariants} className="w-full py-2.5 bg-purple-50 text-purple-700 font-bold text-sm rounded-xl hover:bg-purple-100 mb-3">
                    ⚡ ສ້າງ variants ອັດຕະໂນມັດ
                  </button>
                )}
                {variants.length > 0 && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-3 py-2 flex text-xs font-bold text-gray-500">
                      <span className="flex-1">ຕົວເລືອກ</span>
                      <span className="w-16 text-center">ສາງ</span>
                      <span className="w-24 text-center">ລາຄາ (₭)</span>
                    </div>
                    {variants.map((v, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 border-t border-gray-100">
                        <div className="flex-1 text-xs text-gray-700">
                          {Object.entries(v.options).map(([k, val]) => <span key={k} className="inline-block bg-gray-100 rounded px-1.5 py-0.5 mr-1 font-medium">{k}: {val}</span>)}
                        </div>
                        <input type="number" value={v.stock} onChange={e => setVariants(vs => vs.map((x, j) => j === i ? { ...x, stock: Number(e.target.value) } : x))}
                          className="w-16 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center outline-none" />
                        <input type="number" value={v.price ?? ''} placeholder="ຄືກັນ" onChange={e => setVariants(vs => vs.map((x, j) => j === i ? { ...x, price: e.target.value ? Number(e.target.value) : undefined } : x))}
                          className="w-24 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center outline-none" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 p-5 border-t sticky bottom-0 bg-white">
              <button onClick={() => setEditing(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50">ຍົກເລີກ</button>
              <button onClick={save} disabled={saving} className="flex-1 py-3 rounded-xl bg-[#1247D8] text-white font-bold text-sm hover:bg-[#0d35b0] disabled:opacity-60">
                {saving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
