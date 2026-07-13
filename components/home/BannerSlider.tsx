'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const banners = [
  {
    bg: 'from-[#EE4D2D] to-[#FF6B35]',
    tag: 'ສ່ວນຫຼຸດ 🔥',
    title: 'ສ່ວນທຸດ ສູງເຖິງ 70%',
    sub: 'ສິນຄ້າຄັດສັນ ຫຼຸດທຸກໂໝດ',
    btn: 'ຊື້ດ່ວນ',
    href: '/products',
  },
  {
    bg: 'from-[#1247D8] to-[#3B82F6]',
    tag: 'Flash Sale ⚡',
    title: 'ຫຼຸດສູງສຸດ 50%',
    sub: 'ສິນຄ້າເລືອກສັນ ລາຄາສຸດພິເສດ',
    btn: 'ເບິ່ງທັງໝົດ',
    href: '/products',
  },
  {
    bg: 'from-[#7B2FBE] to-[#A855F7]',
    tag: 'ໃໝ່ 🆕',
    title: 'ສິນຄ້າໃໝ່ປະຈຳອາທິດ',
    sub: 'Update ທຸກວັນຈັນ',
    btn: 'ສັ່ງຊື້ເລີຍ',
    href: '/products',
  },
]

export default function BannerSlider() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCurrent(i => (i + 1) % banners.length), 4000)
    return () => clearInterval(t)
  }, [])

  const b = banners[current]

  return (
    <div className="relative">
      <div className={`bg-gradient-to-r ${b.bg} rounded-2xl p-6 text-white relative overflow-hidden min-h-[160px] transition-all duration-500`}>
        {/* Decorative circles */}
        <div className="absolute right-0 top-0 w-48 h-48 rounded-full bg-white/10 -translate-y-16 translate-x-16" />
        <div className="absolute right-16 bottom-0 w-32 h-32 rounded-full bg-white/5 translate-y-8" />

        <span className="bg-white/20 text-xs font-bold px-3 py-1 rounded-full">{b.tag}</span>
        <h2 className="text-3xl font-black mt-3 leading-tight">{b.title}</h2>
        <p className="text-white/80 text-sm mt-1">{b.sub}</p>
        <Link href={b.href}
          className="inline-block mt-4 bg-white/20 border border-white/40 text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-white/30 transition-colors">
          {b.btn} →
        </Link>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-2">
        {banners.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={`rounded-full transition-all ${i === current ? 'w-6 h-2 bg-[#1247D8]' : 'w-2 h-2 bg-gray-300'}`} />
        ))}
      </div>
    </div>
  )
}
