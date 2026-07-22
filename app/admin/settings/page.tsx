'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Upload } from 'lucide-react'

const DELIVERY_APPS = [
  { key: 'anousith',  label: 'ອານຸສິດ Express',  img: '/anousith.jpeg',   price: '₭15k–35k' },
  { key: 'rungaloun', label: 'ຮຸ່ງອາລຸນ Express', img: '/houngaloun.jpeg', price: '₭12k–30k' },
  { key: 'mixay',     label: 'ມີໄຊ Express',      img: '/mixay.jpeg',      price: '₭10k–28k' },
]

type DeliveryMap = Record<string, boolean>

export default function AdminSettings() {
  const [codEnabled, setCodEnabled] = useState(true)
  const [qrEnabled, setQrEnabled] = useState(false)
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
  const [delivery, setDelivery] = useState<DeliveryMap>({ anousith: true, rungaloun: false, mixay: false })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.from('payment_settings').select('*').eq('id', 1).single()
      .then(({ data }) => {
        if (data) {
          setCodEnabled(data.cod_enabled)
          setQrEnabled(data.qr_enabled)
          setQrImageUrl(data.qr_image_url)
          if (data.delivery_apps) setDelivery(data.delivery_apps)
        }
      })
  }, [])

  const uploadQr = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `qr/payment-qr.${ext}`
    const { error } = await supabase.storage.from('products').upload(path, file, { upsert: true })
    if (error) { setMsg('ອັບໂຫລດບໍ່ສຳເລັດ: ' + error.message); setUploading(false); return }
    const { data } = supabase.storage.from('products').getPublicUrl(path)
    setQrImageUrl(data.publicUrl)
    setQrEnabled(true)
    setUploading(false)
    setMsg('ອັບໂຫລດ QR ສຳເລັດ!')
  }

  const save = async () => {
    setSaving(true)
    const { error } = await supabase.from('payment_settings')
      .update({ cod_enabled: codEnabled, qr_enabled: qrEnabled, qr_image_url: qrImageUrl, delivery_apps: delivery })
      .eq('id', 1)
    setSaving(false)
    setMsg(error ? 'ບັນທຶກບໍ່ສຳເລັດ' : 'ບັນທຶກສຳເລັດ ✅')
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-black text-gray-800">⚙️ ຕັ້ງຄ່າການຊຳລະ</h1>

      {msg && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">{msg}</div>
      )}

      {/* COD */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-800">💵 COD — ຈ່າຍປາຍທາງ</p>
            <p className="text-sm text-gray-500 mt-0.5">ລູກຄ້າຈ່າຍເງີນເມື່ອໄດ້ຮັບສິນຄ້າ</p>
          </div>
          <button onClick={() => setCodEnabled(!codEnabled)}
            className={`relative w-12 h-6 rounded-full transition-colors ${codEnabled ? 'bg-[#1247D8]' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${codEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
        <p className={`text-xs mt-3 font-bold ${codEnabled ? 'text-green-600' : 'text-gray-400'}`}>
          {codEnabled ? '✅ ເປີດໃຊ້ງານ' : '⛔ ປິດໃຊ້ງານ'}
        </p>
      </div>

      {/* QR */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-800">📷 QR Code ຊຳລະ</p>
            <p className="text-sm text-gray-500 mt-0.5">ອັບໂຫລດ QR ເງີນໂອນຂອງທ່ານ</p>
          </div>
          <button onClick={() => setQrEnabled(!qrEnabled)} disabled={!qrImageUrl}
            className={`relative w-12 h-6 rounded-full transition-colors ${qrEnabled && qrImageUrl ? 'bg-[#1247D8]' : 'bg-gray-300'}`}>
            <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${qrEnabled && qrImageUrl ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* QR Preview */}
        {qrImageUrl ? (
          <div className="flex items-start gap-4">
            <img src={qrImageUrl} alt="QR" className="w-32 h-32 object-contain border border-gray-200 rounded-xl" />
            <button onClick={() => fileRef.current?.click()}
              className="text-sm text-[#1247D8] hover:underline mt-2">ປ່ຽນ QR</button>
          </div>
        ) : (
          <button onClick={() => fileRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-[#1247D8] transition-colors">
            <Upload size={24} className="text-gray-400" />
            <span className="text-sm text-gray-500">{uploading ? 'ກຳລັງອັບໂຫລດ...' : 'ກົດເພື່ອອັບໂຫລດ QR Code'}</span>
          </button>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) uploadQr(f) }} />

        <p className={`text-xs font-bold ${qrEnabled && qrImageUrl ? 'text-green-600' : 'text-gray-400'}`}>
          {!qrImageUrl ? '⚠️ ຍັງບໍ່ມີ QR — ອັບໂຫລດກ່ອນ' : qrEnabled ? '✅ ເປີດໃຊ້ງານ' : '⛔ ປິດໃຊ້ງານ'}
        </p>
      </div>

      {/* Delivery Apps */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <p className="font-bold text-gray-800">🚚 ແອັບຂົນສົ່ງ</p>
        <p className="text-sm text-gray-500 -mt-2">ເລືອກບໍລິການຂົນສົ່ງທີ່ຮ່ວມງານ</p>
        {DELIVERY_APPS.map(({ key, label, img, price }) => (
          <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div className="flex items-center gap-3">
              <img src={img} alt={label} className="w-10 h-10 rounded-xl object-cover" />
              <div>
                <p className="font-medium text-gray-700 text-sm">{label}</p>
                <p className="text-xs text-gray-400">{price}</p>
              </div>
            </div>
            <button onClick={() => setDelivery(d => ({ ...d, [key]: !d[key] }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${delivery[key] ? 'bg-[#1247D8]' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${delivery[key] ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        ))}
      </div>

      <button onClick={save} disabled={saving}
        className="w-full bg-[#1247D8] text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-[#0d35b0] transition-colors disabled:opacity-60">
        <Save size={18} />
        {saving ? 'ກຳລັງບັນທຶກ...' : 'ບັນທຶກການຕັ້ງຄ່າ'}
      </button>
    </div>
  )
}
