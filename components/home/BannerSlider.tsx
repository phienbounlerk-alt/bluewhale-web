'use client'
import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'

const banners = [
  {
    bg: '#1247D8',
    textColor: '#fff',
    watermark: 'SALE',
    tag: '⚡ Flash Deal',
    title: 'ຫຼຸດ\nສູງສຸດ',
    value: '70%',
    sub: 'ສິນຄ້າຄຸນນະພາບ ລາຄາສຸດພິເສດ',
    btn: 'ຊື້ດ່ວນ →',
    href: '/products',
    emoji: '🛍️',
  },
  {
    bg: '#EE4D2D',
    textColor: '#fff',
    watermark: 'NEW',
    tag: '✨ ສິນຄ້າໃໝ່',
    title: 'ອາໄລໄລ\nໃໝ່',
    value: '100%',
    sub: 'Update ສິນຄ້າໃໝ່ທຸກອາທິດ',
    btn: 'ເບິ່ງສິນຄ້າ →',
    href: '/products',
    emoji: '📦',
  },
  {
    bg: '#F59E0B',
    textColor: '#1a1a1a',
    watermark: 'FREE',
    tag: '🚚 ໂປໂມຊັ່ນ',
    title: 'ສົ່ງຟຣີ\nທົ່ວລາວ',
    value: '₭200k+',
    sub: 'ຊື້ຄົບ ₭200,000 ສົ່ງຟຣີ COD ໄດ້',
    btn: 'ສັ່ງດ່ວນ →',
    href: '/products',
    emoji: '🎁',
  },
]

export default function BannerSlider() {
  const [current, setCurrent] = useState(0)
  const [prev, setPrev] = useState<number | null>(null)
  const [animating, setAnimating] = useState(false)
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const goTo = useCallback((next: number) => {
    if (animating || next === current) return
    setAnimating(true)
    setPrev(current)
    setTimeout(() => {
      setCurrent(next)
      setPrev(null)
      setAnimating(false)
    }, 380)
  }, [animating, current])

  const goNext = useCallback(() => goTo((current + 1) % banners.length), [current, goTo])
  const goPrev = () => goTo((current - 1 + banners.length) % banners.length)

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(goNext, 4500)
  }, [goNext])

  useEffect(() => { resetTimer(); return () => { if (timerRef.current) clearInterval(timerRef.current) } }, [resetTimer])

  const b = banners[current]

  return (
    <div
      className="relative overflow-hidden select-none"
      style={{ background: b.bg, transition: 'background 0.5s ease', height: 'min(72vw, 340px)' }}
      onTouchStart={e => setTouchStart(e.touches[0].clientX)}
      onTouchEnd={e => {
        if (touchStart === null) return
        const dx = e.changedTouches[0].clientX - touchStart
        if (Math.abs(dx) > 40) { dx < 0 ? goNext() : goPrev(); resetTimer() }
        setTouchStart(null)
      }}
    >
      {/* Watermark text */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden"
        style={{ opacity: 0.08 }}
      >
        <span
          className="font-black"
          style={{
            fontSize: 'clamp(80px, 28vw, 160px)',
            color: b.textColor === '#fff' ? '#fff' : '#000',
            letterSpacing: '-6px',
            lineHeight: 1,
            whiteSpace: 'nowrap',
          }}
        >
          {b.watermark}
        </span>
      </div>

      {/* Main layout: emoji center, text bottom-left */}
      <div
        className="absolute inset-0 flex flex-col"
        style={{
          opacity: animating ? 0 : 1,
          transform: animating ? 'scale(0.96)' : 'scale(1)',
          transition: 'opacity 0.38s ease, transform 0.38s ease',
        }}
      >
        {/* Top: tag */}
        <div className="px-5 pt-4">
          <span
            className="inline-flex items-center gap-1 text-[11px] font-black px-3 py-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.22)', color: b.textColor, backdropFilter: 'blur(6px)' }}
          >
            {b.tag}
          </span>
        </div>

        {/* Middle: big emoji */}
        <div className="flex-1 flex items-center justify-center">
          <span
            style={{
              fontSize: 'clamp(80px, 25vw, 130px)',
              lineHeight: 1,
              filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.25))',
            }}
          >
            {b.emoji}
          </span>
        </div>

        {/* Bottom: title + cta side by side */}
        <div className="px-5 pb-5 flex items-end justify-between gap-3">
          <div>
            <p
              className="font-black leading-none whitespace-pre-line"
              style={{ fontSize: 'clamp(22px, 7vw, 32px)', color: b.textColor, textShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
            >
              {b.title}
            </p>
            <p
              className="font-black"
              style={{ fontSize: 'clamp(30px, 11vw, 52px)', color: b.textColor, lineHeight: 1, letterSpacing: '-1px' }}
            >
              {b.value}
            </p>
            <p className="text-[11px] mt-1" style={{ color: b.textColor, opacity: 0.7 }}>{b.sub}</p>
          </div>
          <Link
            href={b.href}
            className="shrink-0 font-black text-sm px-4 py-2.5 rounded-2xl active:scale-95 transition-transform whitespace-nowrap"
            style={{ background: b.textColor === '#fff' ? '#fff' : '#1a1a1a', color: b.bg }}
          >
            {b.btn}
          </Link>
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
        {banners.map((_, i) => (
          <button
            key={i}
            onClick={() => { goTo(i); resetTimer() }}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === current ? 20 : 6,
              height: 6,
              background: i === current ? b.textColor : (b.textColor === '#fff' ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.25)'),
            }}
          />
        ))}
      </div>
    </div>
  )
}
