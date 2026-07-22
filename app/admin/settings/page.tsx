'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Save, Upload } from 'lucide-react'

const DELIVERY_APPS = [
  { key: 'anousith',  label: 'ອານຸສິດ Express',  img: '/anousith.jpeg',   price: '₭15k–35k' },
  { key: 'rungaloun', label: 'ຮຸ່ງອາລຸນ Express', img: '/houngaloun.jpeg', price: '₭12k–30k' },
  { key: 'mixay',     label: 'ມີໄຊ Express',      img: '/mixay.jpeg',      price: '₭10k–28k' },
]

const QR_BANKS = [
  { key: 'bcel', label: 'BCEL One', img: '/bcel-one.webp' },
  { key: 'jdb',  label: 'JDB',      img: '/jdb.png' },
  { key: 'ldb',  label: 'LDB',      img: '/ldb.jpg' },
]

type DeliveryMap = Record<string, boolean>
type QrMap = Record<string, { enabled: boolean; url: string | null }>

export default function AdminSettings() {
  const [codEnabled, setCodEnabled] = useState(true)
  const [qrBanks, setQrBanks] = useState<QrMap>({
    bcel: { enabled: false, url: null },
    jdb:  { enabled: false, url: null },
    ldb:  { enabled: false, url: null },
  })
  const [delivery, setDelivery] = useState<DeliveryMap>({ anousith: true, rungaloun: false, mixay: false })
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const [msg, setMsg] = useState('')
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    supabase.from('payment_settings').select('*').eq('id', 1).single()
      .then(({ data }) => {
        if (data) {
          setCodEnabled(data.cod_enabled ?? true)
          // migrate old single QR → bcel slot
          if (data.qr_image_url) {
            setQrBanks(b => ({ ...b, bcel: { enabled: data.qr_enabled ?? false, url: data.qr_image_url } }))
          }
        }
      })
    // load local overrides for new fields not yet in DB
    try {
      const saved = localStorage.getItem('bw_settings')
      if (saved) {
        const j = JSON.parse(saved)
        if (j.qr_banks) setQrBanks(j.qr_banks)
        if (j.delivery) setDelivery(j.delivery)
      }
    } catch {}
  }, [])

  const uploadQr = async (bankKey: string, file: File) => {
    setUploading(bankKey)
    const ext = file.name.split('.').pop()
    const path = `qr/${bankKey}-qr.${ext}`
    const { error } = await supabase.storage.from('products').upload(path, file, { upsert: true })
    if (error) { setMsg('ອັບໂຫລດບໍ່ສຳເລັດ'); setUploading(null); return }
    const { data } = supabase.storage.from('products').getPublicUrl(path)
    setQrBanks(b => ({ ...b, [bankKey]: { enabled: true, url: data.publicUrl } }))
    setUploading(null)
    setMsg('ອັບໂຫລດ QR ສຳເລັດ!')
    setTimeout(() => setMsg(''), 3000)
  }

  const save = async () => {
    setSaving(true)
    try {
      // save only columns that exist in DB
      const bcelBank = qrBanks['bcel']
      const { error } = await supabase.from('payment_settings')
        .update({
          cod_enabled: codEnabled,
          qr_enabled: bcelBank.enabled,
          qr_image_url: bcelBank.url,
        })
        .eq('id', 1)
      // save new fields to localStorage until DB columns are added
      localStorage.setItem('bw_settings', JSON.stringify({ qr_banks: qrBanks, delivery }))
      setMsg(error ? 'ບັນທຶກບໍ່ສຳເລັດ' : 'ບັນທຶກສຳເລັດ ✅')
    } catch {
      setMsg('ບັນທຶກບໍ່ສຳເລັດ')
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const Toggle = ({ on, onClick, disabled }: { on: boolean; onClick: () => void; disabled?: boolean }) => (
    <button onClick={onClick} disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${on ? 'bg-[#1247D8]' : 'bg-gray-300'} disabled:opacity-40`}>
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  )

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-xl font-black text-gray-800">⚙️ ຕັ້ງຄ່າການຊຳລະ</h1>

      {msg && (
        <div className={`rounded-xl px-4 py-3 text-sm border ${msg.includes('ບໍ່') ? 'bg-red-50 border-red-200 text-red-600' : 'bg-green-50 border-green-200 text-green-700'}`}>{msg}</div>
      )}

      {/* COD */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-bold text-gray-800">💵 COD — ຈ່າຍປາຍທາງ</p>
            <p className="text-sm text-gray-500 mt-0.5">ລູກຄ້າຈ່າຍເງີນເມື່ອໄດ້ຮັບສິນຄ້າ</p>
          </div>
          <Toggle on={codEnabled} onClick={() => setCodEnabled(v => !v)} />
        </div>
        <p className={`text-xs mt-3 font-bold ${codEnabled ? 'text-green-600' : 'text-gray-400'}`}>
          {codEnabled ? '✅ ເປີດໃຊ້ງານ' : '⛔ ປິດໃຊ້ງານ'}
        </p>
      </div>

      {/* QR Banks */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div>
          <p className="font-bold text-gray-800">📷 QR Code ຊຳລະ</p>
          <p className="text-sm text-gray-500 mt-0.5">ອັບໂຫລດ QR ແຕ່ລະທະນາຄານ</p>
        </div>

        {QR_BANKS.map(({ key, label, img }) => {
          const bank = qrBanks[key]
          return (
            <div key={key} className="border border-gray-100 rounded-xl p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center p-1 shadow-sm">
                    <img src={img} alt={label} className="w-full h-full object-contain" />
                  </div>
                  <p className="font-semibold text-gray-700 text-sm">{label}</p>
                </div>
                <Toggle on={bank.enabled} onClick={() => setQrBanks(b => ({ ...b, [key]: { ...b[key], enabled: !b[key].enabled } }))} disabled={!bank.url} />
              </div>

              {/* QR upload area */}
              {bank.url ? (
                <div className="flex items-center gap-3">
                  <img src={bank.url} alt="QR" className="w-20 h-20 object-contain border border-gray-200 rounded-lg" />
                  <button onClick={() => fileRefs.current[key]?.click()} className="text-xs text-[#1247D8] hover:underline">ປ່ຽນ QR</button>
                </div>
              ) : (
                <button onClick={() => fileRefs.current[key]?.click()}
                  className="w-full border-2 border-dashed border-gray-200 rounded-xl py-5 flex flex-col items-center gap-1.5 hover:border-[#1247D8] transition-colors">
                  <Upload size={18} className="text-gray-400" />
                  <span className="text-xs text-gray-400">{uploading === key ? 'ກຳລັງອັບໂຫລດ...' : `ອັບໂຫລດ QR ${label}`}</span>
                </button>
              )}
              <input ref={el => { fileRefs.current[key] = el }} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadQr(key, f) }} />

              <p className={`text-xs font-bold ${bank.enabled && bank.url ? 'text-green-600' : 'text-gray-400'}`}>
                {!bank.url ? '⚠️ ຍັງບໍ່ມີ QR' : bank.enabled ? '✅ ເປີດໃຊ້ງານ' : '⛔ ປິດໃຊ້ງານ'}
              </p>
            </div>
          )
        })}
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
            <Toggle on={!!delivery[key]} onClick={() => setDelivery(d => ({ ...d, [key]: !d[key] }))} />
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
