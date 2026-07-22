'use client'
import { useEffect, useState } from 'react'

export default function SplashScreen() {
  const [phase, setPhase] = useState<'show' | 'fadeout' | 'done'>('show')

  useEffect(() => {
    const fresh = new URLSearchParams(window.location.search).get('fresh')
    if (fresh) sessionStorage.removeItem('bw_splash')
    if (sessionStorage.getItem('bw_splash')) { setPhase('done'); return }
    const t1 = setTimeout(() => setPhase('fadeout'), 2200)
    const t2 = setTimeout(() => { setPhase('done'); sessionStorage.setItem('bw_splash', '1') }, 2800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (phase === 'done') return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #1247D8 0%, #0a2fa8 60%, #061d7a 100%)',
        opacity: phase === 'fadeout' ? 0 : 1,
        transition: 'opacity 0.6s ease',
        pointerEvents: phase === 'fadeout' ? 'none' : 'all',
      }}
    >
      {/* Floating bubbles */}
      {[
        { size: 180, left: '-10%', delay: '0s',   dur: '7s',  opacity: 0.10 },
        { size: 120, left: '60%',  delay: '1s',   dur: '9s',  opacity: 0.07 },
        { size: 80,  left: '20%',  delay: '2s',   dur: '6s',  opacity: 0.12 },
        { size: 220, left: '75%',  delay: '0.5s', dur: '11s', opacity: 0.05 },
        { size: 60,  left: '40%',  delay: '3s',   dur: '8s',  opacity: 0.10 },
        { size: 140, left: '-5%',  delay: '1.5s', dur: '10s', opacity: 0.06 },
      ].map((b, i) => (
        <div key={i} className="absolute rounded-full" style={{
          width: b.size, height: b.size, left: b.left, bottom: '-20%',
          background: 'radial-gradient(circle at 30% 30%, #5b8df6, #1247D8)',
          opacity: b.opacity,
          animation: `bw-float ${b.dur} ease-in-out ${b.delay} infinite`,
        }} />
      ))}

      {/* Logo */}
      <div
        className="flex flex-col items-center gap-4 relative z-10"
        style={{ animation: 'bw-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.2s both' }}
      >
        <div className="relative">
          <div className="w-24 h-24 rounded-[32px] bg-white/15 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/20 overflow-hidden">
            <img src="/logo.png" alt="BlueWhale" className="w-full h-full object-cover" />
          </div>
          <div className="absolute top-2 left-3 w-6 h-2 bg-white/30 rounded-full blur-sm" />
        </div>
        <div className="text-center">
          <p className="text-white font-black text-4xl tracking-tight" style={{ letterSpacing: '-1px' }}>
            BlueWhale
          </p>
          <p className="text-white/50 text-sm font-medium mt-1 tracking-widest uppercase">
            ຕະຫຼາດດິຈິຕອລລາວ
          </p>
        </div>
      </div>

      {/* Loading dots */}
      <div className="absolute bottom-20 flex gap-2 z-10" style={{ animation: 'bw-fadein 0.4s ease 0.8s both' }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40"
            style={{ animation: `bw-bounce 0.9s ease ${i * 0.2}s infinite` }} />
        ))}
      </div>

      <style>{`
        @keyframes bw-pop {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes bw-fadein { from { opacity: 0; } to { opacity: 1; } }
        @keyframes bw-bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%            { transform: translateY(-6px); opacity: 1; }
        }
        @keyframes bw-float {
          0%   { transform: translateY(0) scale(1); }
          50%  { transform: translateY(-120vh) scale(1.1); }
          100% { transform: translateY(-140vh) scale(0.9); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
