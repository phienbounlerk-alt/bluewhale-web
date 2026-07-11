'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Mail } from 'lucide-react'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError('ອີເມວ ຫຼື ລະຫັດຜ່ານ ບໍ່ຖືກຕ້ອງ'); setLoading(false) }
    else router.replace('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1247D8] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-2xl shadow-blue-900/60">🐋</div>
          <h1 className="text-white font-black text-2xl">BlueWhale Admin</h1>
          <p className="text-blue-400 text-sm mt-1">ເຂົ້າສູ່ລະບົບຫຼັງບ້ານ</p>
        </div>

        <form onSubmit={submit} className="bg-[#112240] rounded-2xl p-6 border border-white/10 shadow-2xl space-y-4">
          <div>
            <label className="text-blue-300 text-xs font-bold mb-2 block">ອີເມວ</label>
            <div className="flex items-center bg-[#0A1628] border border-white/10 rounded-xl overflow-hidden focus-within:border-[#1247D8] transition-colors">
              <Mail size={16} className="mx-3 text-blue-400 shrink-0" />
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
                placeholder="admin@bluewhale.la"
                className="flex-1 py-3 pr-4 bg-transparent text-white text-sm outline-none placeholder:text-white/30" />
            </div>
          </div>

          <div>
            <label className="text-blue-300 text-xs font-bold mb-2 block">ລະຫັດຜ່ານ</label>
            <div className="flex items-center bg-[#0A1628] border border-white/10 rounded-xl overflow-hidden focus-within:border-[#1247D8] transition-colors">
              <Lock size={16} className="mx-3 text-blue-400 shrink-0" />
              <input value={password} onChange={e => setPassword(e.target.value)} type="password" required
                placeholder="••••••••"
                className="flex-1 py-3 pr-4 bg-transparent text-white text-sm outline-none placeholder:text-white/30" />
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-[#1247D8] text-white font-black py-4 rounded-xl hover:bg-[#0d35b0] transition-colors disabled:opacity-60 shadow-lg shadow-blue-900/40">
            {loading ? 'ກຳລັງໂຫຼດ...' : 'ເຂົ້າສູ່ລະບົບ'}
          </button>
        </form>
      </div>
    </div>
  )
}
