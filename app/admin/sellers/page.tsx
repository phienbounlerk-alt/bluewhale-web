'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { CheckCircle, XCircle, Store, Phone, Search } from 'lucide-react'

type Seller = {
  id: string; user_id: string; shop_name: string; phone: string
  description: string; logo_url: string; is_approved: boolean; created_at: string
  product_count?: number
}

export default function AdminSellers() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [updating, setUpdating] = useState<string | null>(null)

  const load = async () => {
    const { data } = await supabase.from('sellers').select('*').order('created_at', { ascending: false })
    if (!data) return

    // Get product count per seller
    const withCounts = await Promise.all((data ?? []).map(async (s: Seller) => {
      const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('seller_id', s.id)
      return { ...s, product_count: count ?? 0 }
    }))
    setSellers(withCounts)
  }

  useEffect(() => { load() }, [])

  const approve = async (id: string, val: boolean) => {
    setUpdating(id)
    await supabase.from('sellers').update({ is_approved: val }).eq('id', id)
    setSellers(ss => ss.map(s => s.id === id ? { ...s, is_approved: val } : s))
    setUpdating(null)
  }

  const filtered = sellers.filter(s => {
    const matchQ = !q || (s.shop_name ?? '').toLowerCase().includes(q.toLowerCase()) || (s.phone ?? '').includes(q)
    const matchF = filter === 'all' || (filter === 'pending' ? !s.is_approved : s.is_approved)
    return matchQ && matchF
  })

  const pending = sellers.filter(s => !s.is_approved).length
  const approved = sellers.filter(s => s.is_approved).length

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'ທັງໝົດ', value: sellers.length, color: 'bg-blue-500' },
          { label: 'ລໍຖ້າ', value: pending, color: 'bg-yellow-500' },
          { label: 'ອະນຸມັດ', value: approved, color: 'bg-green-500' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
            <div className={`${c.color} w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center`}>
              <Store size={16} className="text-white" />
            </div>
            <div className="text-2xl font-black text-gray-800">{c.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <Search size={16} className="mx-3 text-gray-400 shrink-0" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="ຄົ້ນຫາຮ້ານ..."
            className="flex-1 py-2.5 text-sm outline-none" />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value as any)}
          className="bg-white border border-gray-200 rounded-xl px-3 text-sm outline-none shadow-sm">
          <option value="all">ທັງໝົດ</option>
          <option value="pending">ລໍຖ້າ</option>
          <option value="approved">ອະນຸມັດ</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          <Store size={36} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">ບໍ່ມີຮ້ານຄ້າ</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(s => (
            <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
              <div className="flex items-start gap-4">
                {/* Logo */}
                <div className="w-14 h-14 bg-gray-100 rounded-2xl overflow-hidden flex items-center justify-center text-2xl shrink-0">
                  {s.logo_url ? <img src={s.logo_url} alt="" className="w-full h-full object-cover" /> : '🏪'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-gray-800">{s.shop_name}</p>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.is_approved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {s.is_approved ? '✅ ອະນຸມັດ' : '⏳ ລໍຖ້າ'}
                    </span>
                  </div>
                  {s.phone && <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5"><Phone size={12} />{s.phone}</p>}
                  {s.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{s.description}</p>}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>📦 {s.product_count} ສິນຄ້າ</span>
                    <span>📅 {new Date(s.created_at).toLocaleDateString('lo-LA')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  {!s.is_approved ? (
                    <button onClick={() => approve(s.id, true)} disabled={updating === s.id}
                      className="flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-green-600 transition-colors disabled:opacity-60">
                      <CheckCircle size={14} />ອະນຸມັດ
                    </button>
                  ) : (
                    <button onClick={() => approve(s.id, false)} disabled={updating === s.id}
                      className="flex items-center gap-1 bg-red-50 text-red-500 text-xs font-bold px-3 py-2 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-60">
                      <XCircle size={14} />ຍົກເລີກ
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
