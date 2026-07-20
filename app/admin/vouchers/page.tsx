'use client'
import { useEffect, useState } from 'react'
import { supabase, fmt } from '@/lib/supabase'
import { Plus, Trash2, ToggleLeft, ToggleRight, Tag } from 'lucide-react'

type Voucher = {
  id: string; code: string; discount_type: 'percent' | 'fixed'
  discount_value: number; min_order: number; max_discount: number | null
  uses_left: number; expires_at: string | null; is_active: boolean; created_at: string
}

const blank = { code: '', discount_type: 'percent' as const, discount_value: 10, min_order: 0, max_discount: '', uses_left: 100, expires_at: '' }

export default function VouchersAdmin() {
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [form, setForm] = useState(blank)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = async () => {
    const { data } = await supabase.from('vouchers').select('*').order('created_at', { ascending: false })
    setVouchers(data ?? [])
  }

  useEffect(() => { load() }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await supabase.from('vouchers').insert({
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order: Number(form.min_order),
      max_discount: form.max_discount ? Number(form.max_discount) : null,
      uses_left: Number(form.uses_left),
      expires_at: form.expires_at || null,
      is_active: true,
    })
    setForm(blank); setAdding(false); setSaving(false); load()
  }

  const toggle = async (v: Voucher) => {
    await supabase.from('vouchers').update({ is_active: !v.is_active }).eq('id', v.id)
    load()
  }

  const del = async (id: string) => {
    if (!confirm('ລຶບໂຄດນີ້?')) return
    await supabase.from('vouchers').delete().eq('id', id)
    load()
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Tag className="text-[#1247D8]" size={22} />
          <h1 className="text-xl font-black text-gray-800">ໂຄດສ່ວນຫຼຸດ</h1>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{vouchers.length} ໂຄດ</span>
        </div>
        <button onClick={() => setAdding(a => !a)}
          className="flex items-center gap-2 bg-[#1247D8] text-white px-4 py-2 rounded-xl font-bold hover:bg-[#0d35b0] transition-colors text-sm">
          <Plus size={16} /> ເພີ່ມໂຄດ
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <form onSubmit={save} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 space-y-4">
          <h2 className="font-black text-gray-700">ໂຄດໃໝ່</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">ໂຄດ *</label>
              <input required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="WELCOME10"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1247D8] font-mono" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">ປະເພດ</label>
              <select value={form.discount_type} onChange={e => setForm(f => ({ ...f, discount_type: e.target.value as any }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1247D8]">
                <option value="percent">ເປີເຊັນ (%)</option>
                <option value="fixed">ລາຄາຄົງທີ່ (₭)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">
                ສ່ວນຫຼຸດ {form.discount_type === 'percent' ? '(%)' : '(₭)'}
              </label>
              <input type="number" required min={1} value={form.discount_value}
                onChange={e => setForm(f => ({ ...f, discount_value: +e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1247D8]" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">ຊື້ຂັ້ນຕ່ຳ (₭)</label>
              <input type="number" min={0} value={form.min_order}
                onChange={e => setForm(f => ({ ...f, min_order: +e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1247D8]" />
            </div>
            {form.discount_type === 'percent' && (
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">ສ່ວນຫຼຸດສູງສຸດ (₭)</label>
                <input type="number" min={0} value={form.max_discount}
                  onChange={e => setForm(f => ({ ...f, max_discount: e.target.value }))}
                  placeholder="ບໍ່ຈຳກັດ"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1247D8]" />
              </div>
            )}
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">ຈຳນວນໃຊ້ໄດ້</label>
              <input type="number" min={1} value={form.uses_left}
                onChange={e => setForm(f => ({ ...f, uses_left: +e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1247D8]" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-600 block mb-1">ໝົດອາຍຸ</label>
              <input type="datetime-local" value={form.expires_at}
                onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1247D8]" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={saving}
              className="bg-[#1247D8] text-white font-bold px-6 py-2.5 rounded-xl hover:bg-[#0d35b0] transition-colors text-sm disabled:opacity-60">
              {saving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
            </button>
            <button type="button" onClick={() => setAdding(false)}
              className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50">
              ຍົກເລີກ
            </button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 font-bold text-gray-600 text-xs">ໂຄດ</th>
                <th className="text-left px-4 py-3 font-bold text-gray-600 text-xs">ສ່ວນຫຼຸດ</th>
                <th className="text-left px-4 py-3 font-bold text-gray-600 text-xs">ຊື້ຂັ້ນຕ່ຳ</th>
                <th className="text-left px-4 py-3 font-bold text-gray-600 text-xs">ໃຊ້ໄດ້</th>
                <th className="text-left px-4 py-3 font-bold text-gray-600 text-xs">ໝົດອາຍຸ</th>
                <th className="text-left px-4 py-3 font-bold text-gray-600 text-xs">ສະຖານະ</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {vouchers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">ຍັງບໍ່ມີໂຄດ</td></tr>
              ) : vouchers.map(v => (
                <tr key={v.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono font-black text-[#1247D8] bg-blue-50 px-2 py-1 rounded-lg text-xs">{v.code}</span>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-800">
                    {v.discount_type === 'percent' ? `-${v.discount_value}%` : `-${fmt(v.discount_value)}`}
                    {v.max_discount && <span className="text-gray-400 font-normal text-xs ml-1">(≤{fmt(v.max_discount)})</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{v.min_order > 0 ? fmt(v.min_order) : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${v.uses_left === 0 ? 'text-red-500' : 'text-green-600'}`}>{v.uses_left}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {v.expires_at ? new Date(v.expires_at).toLocaleDateString('lo-LA') : '∞'}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggle(v)}>
                      {v.is_active
                        ? <ToggleRight size={22} className="text-green-500" />
                        : <ToggleLeft size={22} className="text-gray-300" />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => del(v.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
