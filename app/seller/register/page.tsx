'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Mail, Phone, Store } from 'lucide-react'

export default function SellerRegister() {
  const [form, setForm] = useState({ shopName: '', email: '', phone: '', password: '', confirm: '', description: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('ລະຫັດຜ່ານບໍ່ຕົງກັນ'); return }
    if (form.password.length < 6) { setError('ລະຫັດຜ່ານຕ້ອງຢ່າງໜ້ອຍ 6 ຕົວ'); return }
    setLoading(true)

    // Create auth user
    const { data, error: authErr } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (authErr) { setError(authErr.message); setLoading(false); return }

    // Insert seller record
    const { error: selErr } = await supabase.from('sellers').insert({
      user_id: data.user!.id,
      shop_name: form.shopName.trim(),
      phone: form.phone.trim(),
      description: form.description.trim(),
      is_approved: false,
    })
    if (selErr) { setError(selErr.message); setLoading(false); return }

    await supabase.auth.signOut()
    setDone(true)
    setLoading(false)
  }

  if (done) return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-white font-black text-xl mb-2">ລົງທະບຽນສຳເລັດ!</h2>
        <p className="text-blue-300 text-sm mb-6">ລໍຖ້າ Admin ອະນຸມັດຮ້ານຂອງທ່ານ ແລ້ວຈຶ່ງ login ໄດ້</p>
        <Link href="/seller/login"
          className="inline-block bg-[#1247D8] text-white font-black px-8 py-3 rounded-xl hover:bg-[#0d35b0] transition-colors">
          ໄປໜ້າ Login
        </Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1247D8] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xl shadow-blue-900/60">🏪</div>
          <h1 className="text-white font-black text-2xl">ລົງທະບຽນຮ້ານຄ້າ</h1>
          <p className="text-blue-400 text-sm mt-1">ສ້າງ Seller Account ໃໝ່</p>
        </div>

        <form onSubmit={submit} className="bg-[#112240] rounded-2xl p-6 border border-white/10 shadow-2xl space-y-4">
          {[
            { label: 'ຊື່ຮ້ານ *', key: 'shopName', type: 'text', icon: Store, placeholder: 'ຮ້ານ ABC' },
            { label: 'ອີເມວ *', key: 'email', type: 'email', icon: Mail, placeholder: 'shop@example.com' },
            { label: 'ເບີໂທ', key: 'phone', type: 'tel', icon: Phone, placeholder: '020 xxxx xxxx' },
            { label: 'ລະຫັດຜ່ານ *', key: 'password', type: 'password', icon: Lock, placeholder: '••••••••' },
            { label: 'ຢືນຢັນລະຫັດ *', key: 'confirm', type: 'password', icon: Lock, placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-blue-300 text-xs font-bold mb-2 block">{f.label}</label>
              <div className="flex items-center bg-[#0A1628] border border-white/10 rounded-xl overflow-hidden focus-within:border-[#1247D8] transition-colors">
                <f.icon size={16} className="mx-3 text-blue-400 shrink-0" />
                <input value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)}
                  type={f.type} required={f.label.includes('*')} placeholder={f.placeholder}
                  className="flex-1 py-3 pr-4 bg-transparent text-white text-sm outline-none placeholder:text-white/30" />
              </div>
            </div>
          ))}

          <div>
            <label className="text-blue-300 text-xs font-bold mb-2 block">ກ່ຽວກັບຮ້ານ</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2}
              placeholder="ຮ້ານຂາຍຫຍັງ, ສ່ວນໃດ..."
              className="w-full bg-[#0A1628] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none placeholder:text-white/30 focus:border-[#1247D8] transition-colors resize-none" />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-[#1247D8] text-white font-black py-4 rounded-xl hover:bg-[#0d35b0] transition-colors disabled:opacity-60 shadow-lg shadow-blue-900/40">
            {loading ? 'ກຳລັງສ້າງ...' : 'ລົງທະບຽນ'}
          </button>
        </form>

        <p className="text-center text-blue-400/70 text-sm mt-6">
          ມີບັນຊີຢູ່ແລ້ວ?{' '}
          <Link href="/seller/login" className="text-[#5A9FFF] font-bold hover:underline">ເຂົ້າສູ່ລະບົບ</Link>
        </p>
      </div>
    </div>
  )
}
