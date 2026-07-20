'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
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

export default function BannerSlider() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrent(i => (i + 1) % banners.length), 4500)
    return () => clearInterval(t)
  }, [])

  const prev = () => setCurrent(i => (i - 1 + banners.length) % banners.length)
  const next = () => setCurrent(i => (i + 1) % banners.length)
  const b = banners[current]

  return (
    <div className="relative group">
      <div className={`bg-gradient-to-br ${b.bg} rounded-2xl text-white relative overflow-hidden`}
        style={{ minHeight: 200 }}>

        {/* Decorative blobs */}
        <div className="absolute -right-8 -top-8 w-56 h-56 rounded-full bg-white/10" />
        <div className="absolute right-20 -bottom-10 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -left-4 -bottom-4 w-28 h-28 rounded-full bg-black/10" />

        {/* Big emoji decoration */}
        <div className="absolute right-6 bottom-4 text-7xl opacity-20 select-none">{b.emoji}</div>

        <div className="relative p-6 pb-5">
          <span className="inline-block bg-white/25 backdrop-blur-sm text-xs font-black px-3 py-1 rounded-full mb-3">
            {b.tag}
          </span>
          <h2 className="text-2xl md:text-3xl font-black leading-tight whitespace-pre-line drop-shadow">
            {b.title}
          </h2>
          <p className="text-white/80 text-xs mt-2 max-w-xs">{b.sub}</p>
          <Link href={b.href}
            className="inline-flex items-center gap-1 mt-4 bg-white text-gray-800 font-black px-5 py-2.5 rounded-xl text-sm hover:bg-gray-100 transition-all shadow-lg">
            {b.btn} →
          </Link>
        </div>
      </div>

      {/* Prev/Next arrows */}
      <button onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronLeft size={16} />
      </button>
      <button onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight size={16} />
      </button>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-2.5">
        {banners.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`rounded-full transition-all duration-300 ${i === current ? 'w-6 h-2 bg-[#1247D8]' : 'w-2 h-2 bg-gray-300'}`} />
        ))}
      </div>
    </div>
  )
}
