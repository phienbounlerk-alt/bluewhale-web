'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Upload } from 'lucide-react'
import Image from 'next/image'

export default function SellerProfile() {
  const [sellerId, setSellerId] = useState<string | null>(null)
  const [form, setForm] = useState({ shop_name: '', phone: '', description: '', logo_url: '' })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) return
      const { data: s } = await supabase.from('sellers').select('*').eq('user_id', data.session.user.id).single()
      if (!s) return
      setSellerId(s.id)
      setForm({ shop_name: s.shop_name ?? '', phone: s.phone ?? '', description: s.description ?? '', logo_url: s.logo_url ?? '' })
    })
  }, [])

  const uploadLogo = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `logos/${sellerId}.${ext}`
    const { error } = await supabase.storage.from('products').upload(path, file, { upsert: true })
    if (error) { setMsg('Upload ບໍ່ສຳເລັດ'); setUploading(false); return }
    const { data } = supabase.storage.from('products').getPublicUrl(path)
    setForm(f => ({ ...f, logo_url: data.publicUrl }))
    setUploading(false)
  }

  const save = async () => {
    if (!sellerId) return
    setSaving(true)
    const { error } = await supabase.from('sellers').update({
      shop_name: form.shop_name.trim(),
      phone: form.phone.trim(),
      description: form.description.trim(),
      logo_url: form.logo_url,
    }).eq('id', sellerId)
    setSaving(false)
    setMsg(error ? 'ບໍ່ສຳເລັດ: ' + error.message : 'ບັນທຶກສຳເລັດ ✅')
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="max-w-lg space-y-6">
      {msg && <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">{msg}</div>}

      {/* Logo */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <p className="font-bold text-gray-800 mb-4">ໂລໂກ້ຮ້ານ</p>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center text-4xl shrink-0">
            {form.logo_url
              ? <Image src={form.logo_url} alt="logo" width={80} height={80} className="object-cover w-full h-full" unoptimized />
              : '🏪'}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadLogo(f) }} />
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
              <Upload size={14} />{uploading ? 'ກຳລັງ upload...' : 'ປ່ຽນໂລໂກ້'}
            </button>
            <p className="text-xs text-gray-400 mt-1">JPG, PNG ຂະໜາດໜ້ອຍກວ່າ 2MB</p>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <p className="font-bold text-gray-800">ຂໍ້ມູນຮ້ານ</p>
        {[
          { label: 'ຊື່ຮ້ານ', key: 'shop_name', type: 'text' },
          { label: 'ເບີໂທ', key: 'phone', type: 'tel' },
        ].map(f => (
          <div key={f.key}>
            <label className="text-xs font-bold text-gray-600 mb-1 block">{f.label}</label>
            <input type={f.type} value={(form as any)[f.key]} onChange={e => setForm(fm => ({ ...fm, [f.key]: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1247D8] transition-colors" />
          </div>
        ))}
        <div>
          <label className="text-xs font-bold text-gray-600 mb-1 block">ກ່ຽວກັບຮ້ານ</label>
          <textarea rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1247D8] resize-none transition-colors" />
        </div>
      </div>

      <button onClick={save} disabled={saving}
        className="w-full bg-[#1247D8] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#0d35b0] transition-colors disabled:opacity-60">
        <Save size={18} />{saving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກ'}
      </button>
    </div>
  )
}
