'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
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
    else router.push('/')
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-lg p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🐋</div>
          <h1 className="text-2xl font-black text-gray-800">BlueWhale</h1>
          <p className="text-gray-400 text-sm mt-1">ເຂົ້າສູ່ລະບົບ</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-bold text-gray-600 mb-1 block">ອີເມວ</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
              placeholder="your@email.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1247D8] transition-colors" />
          </div>
          <div>
            <label className="text-sm font-bold text-gray-600 mb-1 block">ລະຫັດຜ່ານ</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1247D8] transition-colors" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-[#1247D8] text-white font-black py-4 rounded-2xl hover:bg-[#0d35b0] transition-colors disabled:opacity-60">
            {loading ? 'ກຳລັງໂຫຼດ...' : 'ເຂົ້າສູ່ລະບົບ'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          ຍັງບໍ່ມີບັນຊີ?{' '}
          <Link href="/register" className="text-[#1247D8] font-bold hover:underline">ສ້າງບັນຊີ</Link>
        </p>
      </div>
    </div>
  )
}
