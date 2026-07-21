'use client'
import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const banners = [
  {
    bg: 'from-[#EE4D2D] via-[#ff6347] to-[#FF8C00]',
    tag: '🔥 Flash Deal',
    title: 'ຫຼຸດສູງສຸດ 70%',
    sub: 'ສິນຄ້າຄຸນນະພາບ ລາຄາສຸດພິເສດ ສົ່ງທົ່ວລາວ',
    btn: 'ຊື້ດ່ວນເລີຍ',
    href: '/products',
    emoji: '🛍️',
  },
  {
    bg: 'from-[#1247D8] via-[#1565C0] to-[#0D47A1]',
    tag: '⚡ ສິນຄ້າໃໝ່',
    title: 'ອາໄລໄລ ຫຼາຍສິ່ງ\nໃໝ່ຫຼ້າສຸດ',
    sub: 'Update ສິນຄ້າໃໝ່ທຸກອາທິດ ຮ້ານຢັ້ງຢືນ 100%',
    btn: 'ເບິ່ງສິນຄ້າ',
    href: '/products',
    emoji: '✨',
  },
  {
    bg: 'from-[#6A1B9A] via-[#7B1FA2] to-[#4A148C]',
    tag: '🎁 ໂປໂມຊັ່ນ',
    title: 'ຊື້ຫຼາຍ\nປະຫຍັດຫຼາຍ',
    sub: 'ຊື້ຄົບ ₭200,000 ສົ່ງຟຣີ | ຈ່າຍປາຍທາງ COD',
    btn: 'ສັ່ງດ່ວນ',
    href: '/products',
    emoji: '💜',
  },
]

const INTERVAL = 4500

export default function BannerSlider() {
  const [current, setCurrent] = useState(0)
  const [progress, setProgress] = useState(0)
  const [animating, setAnimating] = useState(false)
  const [dir, setDir] = useState<'left' | 'right'>('right')

  const goTo = useCallback((next: number, direction: 'left' | 'right' = 'right') => {
    if (animating) return
    setDir(direction)
    setAnimating(true)
    setProgress(0)
    setTimeout(() => {
      setCurrent(next)
      setAnimating(false)
    }, 350)
  }, [animating])

  const prev = () => goTo((current - 1 + banners.length) % banners.length, 'left')
  const next = useCallback(() => goTo((current + 1) % banners.length, 'right'), [current, goTo])

  useEffect(() => {
    const tick = setInterval(() => setProgress(p => {
      if (p >= 100) { next(); return 0 }
      return p + (100 / (INTERVAL / 100))
    }), 100)
    return () => clearInterval(tick)
  }, [next])

  const b = banners[current]

  return (
    <div className="relative select-none">
      {/* Slide */}
      <div className="overflow-hidden rounded-2xl">
        <div
          className={`bg-gradient-to-br ${b.bg} text-white relative overflow-hidden transition-transform`}
          style={{
            minHeight: 200,
            transform: animating
              ? `translateX(${dir === 'right' ? '-4%' : '4%'})`
              : 'translateX(0)',
            opacity: animating ? 0 : 1,
            transition: 'transform 350ms cubic-bezier(.4,0,.2,1), opacity 350ms ease',
          }}
        >
          {/* Decorative blobs */}
          <div className="absolute -right-8 -top-8 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-20 -bottom-10 w-40 h-40 rounded-full bg-white/5 pointer-events-none" />
          <div className="absolute -left-4 -bottom-4 w-28 h-28 rounded-full bg-black/10 pointer-events-none" />
          <div className="absolute right-6 bottom-4 text-8xl opacity-20 pointer-events-none select-none"
            style={{ transform: animating ? 'scale(0.8)' : 'scale(1)', transition: 'transform 350ms ease' }}>
            {b.emoji}
          </div>

          <div className="relative p-5 pb-6 md:p-8">
            <span className="inline-block bg-white/25 backdrop-blur-sm text-xs font-black px-3 py-1 rounded-full mb-3">
              {b.tag}
            </span>
            <h2 className="text-2xl md:text-3xl font-black leading-tight whitespace-pre-line drop-shadow">
              {b.title}
            </h2>
            <p className="text-white/80 text-xs mt-2 max-w-xs">{b.sub}</p>
            <Link href={b.href}
              className="inline-flex items-center gap-1.5 mt-4 bg-white text-gray-800 font-black px-5 py-2.5 rounded-xl text-sm hover:bg-gray-100 active:scale-95 transition-all shadow-lg">
              {b.btn} →
            </Link>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-gray-200 rounded-full mt-2.5 overflow-hidden">
        <div
          className="h-full bg-[#1247D8] rounded-full transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Arrows — always visible on mobile */}
      <button onClick={prev}
        className="absolute left-2 top-[45%] -translate-y-1/2 w-8 h-8 bg-black/25 hover:bg-black/45 active:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm">
        <ChevronLeft size={16} />
      </button>
      <button onClick={next}
        className="absolute right-2 top-[45%] -translate-y-1/2 w-8 h-8 bg-black/25 hover:bg-black/45 active:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm">
        <ChevronRight size={16} />
      </button>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-2">
        {banners.map((_, i) => (
          <button key={i} onClick={() => goTo(i, i > current ? 'right' : 'left')}
            className={`rounded-full transition-all duration-300 ${i === current ? 'w-6 h-2 bg-[#1247D8]' : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'}`} />
        ))}
      </div>
    </div>
  )
}
