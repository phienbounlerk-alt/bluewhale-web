'use client'
import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

type Tab = 'email' | 'phone' | 'facebook' | 'google'

export default function LoginPage() {
  const [tab, setTab] = useState<Tab>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? '/'

  const reset = () => { setError(''); setLoading(false) }

  /* ---- Email login ---- */
  const loginEmail = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) { setError('ອີເມວ ຫຼື ລະຫັດຜ່ານ ບໍ່ຖືກຕ້ອງ'); setLoading(false) }
    else router.push(redirectTo)
  }

  /* ---- Phone: send OTP ---- */
  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setLoading(true)
    const formatted = phone.startsWith('+') ? phone : `+856${phone.replace(/^0/, '')}`
    const { error: err } = await supabase.auth.signInWithOtp({ phone: formatted })
    if (err) { setError('ສົ່ງ OTP ບໍ່ສຳເລັດ: ' + err.message); setLoading(false) }
    else { setOtpSent(true); setLoading(false) }
  }

  /* ---- Phone: verify OTP ---- */
  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault(); reset(); setLoading(true)
    const formatted = phone.startsWith('+') ? phone : `+856${phone.replace(/^0/, '')}`
    const { error: err } = await supabase.auth.verifyOtp({ phone: formatted, token: otp, type: 'sms' })
    if (err) { setError('ລະຫັດ OTP ບໍ່ຖືກຕ້ອງ'); setLoading(false) }
    else router.push(redirectTo)
  }

  /* ---- Facebook OAuth ---- */
  const loginFacebook = async () => {
    reset(); setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  /* ---- Google OAuth ---- */
  const loginGoogle = async () => {
    reset(); setLoading(true)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'email', label: 'ອີເມວ', icon: '✉️' },
    { key: 'phone', label: 'ເບີໂທ', icon: '📱' },
    { key: 'facebook', label: 'Facebook', icon: '🔵' },
    { key: 'google', label: 'Google', icon: '🔴' },
  ]

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-3xl shadow-lg w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="bg-[#1247D8] px-8 pt-8 pb-6 text-white text-center">
          <div className="text-4xl mb-2">🐋</div>
          <h1 className="text-2xl font-black">BlueWhale</h1>
          <p className="text-white/70 text-sm mt-1">ເຂົ້າສູ່ລະບົບ</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          {tabs.map(t => (
            <button key={t.key} onClick={() => { setTab(t.key); setError(''); setOtpSent(false) }}
              className={`flex-1 py-3 text-sm font-bold flex flex-col items-center gap-0.5 transition-colors
                ${tab === t.key ? 'text-[#1247D8] border-b-2 border-[#1247D8]' : 'text-gray-400 hover:text-gray-600'}`}>
              <span className="text-base">{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* Email tab */}
          {tab === 'email' && (
            <form onSubmit={loginEmail} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wide">ອີເມວ</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
                  placeholder="your@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1247D8] transition-colors" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wide">ລະຫັດຜ່ານ</label>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password" required
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1247D8] transition-colors" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-[#1247D8] text-white font-black py-4 rounded-2xl hover:bg-[#0d35b0] transition-colors disabled:opacity-60 text-base">
                {loading ? 'ກຳລັງໂຫຼດ...' : 'ເຂົ້າສູ່ລະບົບ'}
              </button>
            </form>
          )}

          {/* Phone tab */}
          {tab === 'phone' && (
            <>
              {!otpSent ? (
                <form onSubmit={sendOtp} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wide">ເບີໂທ</label>
                    <div className="flex gap-2">
                      <div className="bg-gray-100 rounded-xl px-3 py-3 text-sm font-bold text-gray-600 flex items-center shrink-0">
                        🇱🇦 +856
                      </div>
                      <input value={phone} onChange={e => setPhone(e.target.value)} type="tel" required
                        placeholder="20 xxxx xxxx"
                        className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1247D8] transition-colors" />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">ໃສ່ເບີ ລາວ ເຊັ່ນ: 20 5555 5555</p>
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-[#1247D8] text-white font-black py-4 rounded-2xl hover:bg-[#0d35b0] transition-colors disabled:opacity-60 text-base">
                    {loading ? 'ກຳລັງສົ່ງ...' : 'ສົ່ງລະຫັດ OTP'}
                  </button>
                </form>
              ) : (
                <form onSubmit={verifyOtp} className="space-y-4">
                  <div className="text-center py-2">
                    <p className="text-sm text-gray-600">ສົ່ງລະຫັດໄປທີ່</p>
                    <p className="font-black text-[#1247D8]">{phone}</p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block uppercase tracking-wide">ລະຫັດ OTP 6 ຕົວ</label>
                    <input value={otp} onChange={e => setOtp(e.target.value)} type="text"
                      inputMode="numeric" maxLength={6} required placeholder="_ _ _ _ _ _"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1247D8] transition-colors text-center text-2xl tracking-widest font-black" />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full bg-[#1247D8] text-white font-black py-4 rounded-2xl hover:bg-[#0d35b0] transition-colors disabled:opacity-60 text-base">
                    {loading ? 'ກຳລັງກວດ...' : 'ຢືນຢັນ OTP'}
                  </button>
                  <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setError('') }}
                    className="w-full text-gray-400 text-sm hover:text-gray-600 py-1">
                    ← ປ່ຽນເບີໂທ
                  </button>
                </form>
              )}
            </>
          )}

          {/* Facebook tab */}
          {tab === 'facebook' && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-gray-500 text-center">ເຂົ້າລະບົບດ້ວຍບັນຊີ Facebook ຂອງທ່ານ</p>
              <button onClick={loginFacebook} disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-black py-4 rounded-2xl transition-colors disabled:opacity-60 text-base">
                <svg className="w-6 h-6 fill-white" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                {loading ? 'ກຳລັງໂຫຼດ...' : 'ເຂົ້າລະບົບດ້ວຍ Facebook'}
              </button>
              <p className="text-xs text-gray-400 text-center">
                ລະບົບຈະພາທ່ານໄປຢືນຢັນໃນ Facebook
              </p>
            </div>
          )}

          {/* Google tab */}
          {tab === 'google' && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-gray-500 text-center">ເຂົ້າລະບົບດ້ວຍບັນຊີ Google ຂອງທ່ານ</p>
              <button onClick={loginGoogle} disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-700 font-black py-4 rounded-2xl transition-colors disabled:opacity-60 text-base border-2 border-gray-200">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {loading ? 'ກຳລັງໂຫຼດ...' : 'ເຂົ້າລະບົບດ້ວຍ Google'}
              </button>
              <p className="text-xs text-gray-400 text-center">
                ລະບົບຈະພາທ່ານໄປຢືນຢັນໃນ Google
              </p>
            </div>
          )}

          <div className="border-t border-gray-100 pt-4 text-center">
            <p className="text-sm text-gray-500">
              ຍັງບໍ່ມີບັນຊີ?{' '}
              <Link href="/register" className="text-[#1247D8] font-bold hover:underline">ສ້າງບັນຊີ</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
