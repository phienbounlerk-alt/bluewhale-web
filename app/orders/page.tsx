import Link from 'next/link'
import { ClipboardList } from 'lucide-react'

export default function OrdersPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-xl font-black text-gray-800 mb-6">ການສັ່ງຊື້ຂອງຂ້ອຍ</h1>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-6">
        {['ທັງໝົດ', 'ລໍຖ້າ', 'ຊຳລະແລ້ວ', 'ກຳລັງກຽມ', 'ກຳລັງສົ່ງ', 'ສຳເລັດ'].map((t, i) => (
          <button key={t}
            className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${i === 0 ? 'bg-[#1247D8] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
          <ClipboardList size={36} className="text-[#1247D8]" />
        </div>
        <p className="text-gray-500 font-medium">ຍັງບໍ່ມີການສັ່ງຊື້</p>
        <p className="text-gray-400 text-sm">ລາຍການສັ່ງຊື້ຈະສະແດງຢູ່ທີ່ນີ້</p>
        <Link href="/products"
          className="mt-2 bg-[#1247D8] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#0d35b0] transition-colors">
          ເລືອກຊື້ສິນຄ້າ
        </Link>
      </div>
    </div>
  )
}
