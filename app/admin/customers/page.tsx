'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Search, User } from 'lucide-react'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<any[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    supabase.from('profiles').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setCustomers(data ?? []))
  }, [])

  const filtered = customers.filter(c =>
    !q || (c.full_name ?? '').toLowerCase().includes(q.toLowerCase()) ||
    (c.phone ?? '').includes(q) || (c.email ?? '').includes(q))

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <Search size={16} className="mx-3 text-gray-400 shrink-0" />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="ຄົ້ນຫາຊື່, ເບີ, ອີເມວ..."
          className="flex-1 py-2.5 text-sm outline-none" />
      </div>

      <p className="text-sm text-gray-500">{filtered.length} ລູກຄ້າ</p>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 shadow-sm border border-gray-100">
          <User size={36} className="mx-auto mb-2 opacity-30" />
          <p>ບໍ່ມີລູກຄ້າ</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
          {filtered.map(c => (
            <div key={c.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 bg-[#1247D8]/10 rounded-xl flex items-center justify-center shrink-0">
                {c.avatar_url
                  ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover rounded-xl" />
                  : <span className="text-[#1247D8] font-black text-sm">{(c.full_name ?? 'U')[0].toUpperCase()}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-gray-800">{c.full_name ?? 'ບໍ່ລະບຸ'}</p>
                <p className="text-xs text-gray-400 truncate">{c.phone ?? c.email ?? '-'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">{c.created_at ? new Date(c.created_at).toLocaleDateString('lo-LA') : '-'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
