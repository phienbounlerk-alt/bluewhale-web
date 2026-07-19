'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

function phoneToEmail(phone: string) {
  const digits = phone.replace(/\D/g, '').replace(/^0/, '')
  const normalized = digits.startsWith('856') ? digits : `856${digits}`
  return `${normalized}@phone.bluewhale.app`
}

type Tab = 'phone' | 'email'

export default function RegisterPage() {
  const [tab, setTab] = useState<Tab>('phone')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const reset = () => { setError(''); setLoading(false) }

  const registerPhone = async (e: React.FormEvent) => {
    e.preventDefault(); reset()
    if (password.length < 6) { setError('ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວ'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.signUp({
      email: phoneToEmail(phone),
      password,
      options: { data: { full_name: name, phone } },
    })
    if (err) {
      if (err.message.includes('already registered')) setError('ເບີນີ້ສ້າງບັນຊີແລ້ວ ກະລຸນາເຂົ້າລະບົບ')
      else setError(err.message)
      setLoading(false)
    } else router.push('/')
  }

  const registerEmail = async (e: React.FormEvent) => {
    e.preventDefault(); reset()
    if (password.length < 6) { setError('ລະຫັດຜ່ານຕ້ອງມີຢ່າງໜ້ອຍ 6 ຕົວ'); return }
    setLoading(true)
    const { error: err } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: name } },
    })
    if (err) { setError(err.message); setLoading(false) }
    else router.push('/')
  }

  const loginGoogle = async () => {
    reset(); setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const loginFacebook = async () => {
    reset(); setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-3xl shadow-lg w-full max-w-sm overflow-hidden">
        <div className="bg-[#1247D8] px-8 pt-8 pb-6 text-white text-center">
          <div className="text-4xl mb-2">🐋</div>
          <h1 className="text-2xl font-black">ສ້າງບັນຊີໃໝ່</h1>
          <p className="text-white/70 text-sm mt-1">ຮ່ວມກັບ BlueWhale ວັນນີ້</p>
        </div>

        {/* Social buttons */}
        <div className="px-6 pt-5 space-y-3">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">{error}</div>
          )}
          <button onClick={loginGoogle} disabled={loading}
            className="w-full flex items-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-2xl transition-colors disabled:opacity-60 border-2 border-gray-200 px-4">
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="flex-1 text-center text-sm">{loading ? 'ກຳລັງໂຫຼດ...' : 'ສືບຕໍ່ດ້ວຍ Google'}</span>
          </button>
          <button onClick={loginFacebook} disabled={loading}
            className="w-full flex items-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold py-3 rounded-2xl transition-colors disabled:opacity-60 px-4">
            <svg className="w-5 h-5 fill-white shrink-0" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span className="flex-1 text-center text-sm">{loading ? 'ກຳລັງໂຫຼດ...' : 'ສືບຕໍ່ດ້ວຍ Facebook'}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 px-6 py-3">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">ຫຼື</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Tabs */}
        <div className="flex mx-6 bg-gray-100 rounded-2xl p-1 mb-4">
          <button onClick={() => { setTab('phone'); setError('') }}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'phone' ? 'bg-white text-[#1247D8] shadow-sm' : 'text-gray-500'}`}>
            📱 ເບີໂທ
          </button>
          <button onClick={() => { setTab('email'); setError('') }}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${tab === 'email' ? 'bg-white text-[#1247D8] shadow-sm' : 'text-gray-500'}`}>
            ✉️ ອີເມວ
          </button>
        </div>

        <div className="px-6 pb-6 space-y-3">
          {tab === 'phone' ? (
            <form onSubmit={registerPhone} className="space-y-3">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#1247D8] transition-colors">
                <svg className="w-4 h-4 mx-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input value={name} onChange={e => setName(e.target.value)} required
                  placeholder="ຊື່ຂອງທ່ານ"
                  className="flex-1 py-3 pr-4 outline-none text-sm" />
              </div>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#1247D8] transition-colors">
                <span className="px-3 text-sm text-gray-500 font-bold shrink-0">🇱🇦 +856</span>
                <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" required
                  placeholder="20 xxxx xxxx"
                  className="flex-1 py-3 pr-4 outline-none text-sm" />
              </div>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#1247D8] transition-colors">
                <svg className="w-4 h-4 mx-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" required
                  placeholder="ລະຫັດຜ່ານ (ຢ່າງໜ້ອຍ 6 ຕົວ)"
                  className="flex-1 py-3 pr-4 outline-none text-sm" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#1247D8] text-white font-black py-3.5 rounded-2xl hover:bg-[#0d35b0] transition-colors disabled:opacity-60">
                {loading ? 'ກຳລັງສ້າງ...' : 'ສ້າງບັນຊີ'}
              </button>
            </form>
          ) : (
            <form onSubmit={registerEmail} className="space-y-3">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#1247D8] transition-colors">
                <svg className="w-4 h-4 mx-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <input value={name} onChange={e => setName(e.target.value)} required
                  placeholder="ຊື່ຂອງທ່ານ"
                  className="flex-1 py-3 pr-4 outline-none text-sm" />
              </div>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#1247D8] transition-colors">
                <svg className="w-4 h-4 mx-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
                  placeholder="ອີເມວ"
                  className="flex-1 py-3 pr-4 outline-none text-sm" />
              </div>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden focus-within:border-[#1247D8] transition-colors">
                <svg className="w-4 h-4 mx-3 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" required
                  placeholder="ລະຫັດຜ່ານ (ຢ່າງໜ້ອຍ 6 ຕົວ)"
                  className="flex-1 py-3 pr-4 outline-none text-sm" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#1247D8] text-white font-black py-3.5 rounded-2xl hover:bg-[#0d35b0] transition-colors disabled:opacity-60">
                {loading ? 'ກຳລັງສ້າງ...' : 'ສ້າງບັນຊີ'}
              </button>
            </form>
          )}

          <div className="border-t border-gray-100 pt-3 text-center">
            <p className="text-sm text-gray-500">
              ມີບັນຊີແລ້ວ?{' '}
              <Link href="/login" className="text-[#1247D8] font-bold hover:underline">ເຂົ້າສູ່ລະບົບ</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
