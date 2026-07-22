'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Lock, Mail, Eye, EyeOff } from 'lucide-react'
import { useTheme } from '@/lib/theme-context'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { theme, toggle } = useTheme()
  const router = useRouter()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError('ອີເມວ ຫຼື ລະຫັດຜ່ານ ບໍ່ຖືກຕ້ອງ'); setLoading(false) }
    else router.replace('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      {/* Dark mode toggle top-right */}
      <button onClick={toggle}
        className="fixed top-4 right-4 w-9 h-9 bg-white rounded-full shadow-md flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors border border-gray-100">
        {theme === 'dark'
          ? <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
          : <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>}
      </button>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1247D8] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-blue-200">🐋</div>
          <h1 className="text-gray-800 font-black text-2xl">BlueWhale Admin</h1>
          <p className="text-gray-400 text-sm mt-1">ເຂົ້າສູ່ລະບົບຫຼັງບ້ານ</p>
        </div>

        <form onSubmit={submit} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div>
            <label className="text-gray-700 text-xs font-bold mb-2 block">ອີເມວ</label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#1247D8] focus-within:bg-white transition-colors">
              <Mail size={16} className="mx-3 text-gray-400 shrink-0" />
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
                placeholder="admin@bluewhale.la"
                className="flex-1 py-3 pr-4 bg-transparent text-gray-800 text-sm outline-none placeholder:text-gray-300" />
            </div>
          </div>

          <div>
            <label className="text-gray-700 text-xs font-bold mb-2 block">ລະຫັດຜ່ານ</label>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#1247D8] focus-within:bg-white transition-colors">
              <Lock size={16} className="mx-3 text-gray-400 shrink-0" />
              <input value={password} onChange={e => setPassword(e.target.value)} type={showPw ? 'text' : 'password'} required
                placeholder="••••••••"
                className="flex-1 py-3 bg-transparent text-gray-800 text-sm outline-none placeholder:text-gray-300" />
              <button type="button" onClick={() => setShowPw(v => !v)}
                className="mx-3 text-gray-400 hover:text-gray-600 transition-colors shrink-0">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-500 text-sm">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-[#1247D8] text-white font-black py-4 rounded-xl hover:bg-[#0d35b0] transition-colors disabled:opacity-60 shadow-md shadow-blue-200">
            {loading ? 'ກຳລັງໂຫຼດ...' : 'ເຂົ້າສູ່ລະບົບ'}
          </button>
        </form>
      </div>
    </div>
  )
}
