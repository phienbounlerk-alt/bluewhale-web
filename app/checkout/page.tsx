'use client'
import { useCart } from '@/store/cart'
import { fmt, supabase } from '@/lib/supabase'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CheckCircle, MapPin, Phone, User, Upload, Image } from 'lucide-react'

const FREE = 200000, SHIP = 20000

export default function CheckoutPage() {
  const { items, total, clear } = useCart()
  const router = useRouter()
  const subtotal = total()
  const shipping = subtotal >= FREE ? 0 : SHIP
  const grand = subtotal + shipping
  const [method, setMethod] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [settings, setSettings] = useState({ cod_enabled: true, qr_enabled: false, qr_image_url: null as string | null })
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/login?redirect=/checkout')
      } else {
        setAuthChecked(true)
      }
    })
    supabase.from('payment_settings').select('*').eq('id', 1).single()
      .then(({ data }) => {
        if (data) {
          setSettings(data)
          if (data.cod_enabled) setMethod('cod')
          else if (data.qr_enabled) setMethod('qr')
        }
      })
  }, [])

  const uploadReceipt = async (file: File) => {
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `receipts/${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('products').upload(path, file, { upsert: true })
    if (!error) {
      const { data } = supabase.storage.from('products').getPublicUrl(path)
      setReceiptUrl(data.publicUrl)
    }
    setUploading(false)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.address || !method) return
    if (method === 'qr' && !receiptUrl) {
      alert('ກະລຸນາ upload ສະລິບໂອນເງິນກ່ອນ')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('orders').insert({
      user_id: user?.id ?? null,
      customer_email: user?.email ?? null,
      address: `${form.name} · ${form.phone} · ${form.address}`,
      payment_method: method,
      receipt_url: receiptUrl ?? '',
      items: items.map(i => ({ product_id: i.product.id, product_name: i.product.name, quantity: i.quantity, price: i.product.discount_price ?? i.product.price })),
      total_amount: grand,
      status: 'pending',
    })
    if (error) { console.error('Order error:', error); setLoading(false); alert('ສັ່ງຊື້ລົ້ມເຫລວ: ' + error.message); return }
    setLoading(false)
    setDone(true)
    clear()
  }

  if (done) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
      <h2 className="text-2xl font-black text-gray-800 mb-2">ສັ່ງຊື້ສຳເລັດ! 🎉</h2>
      <p className="text-gray-500 mb-6">ພວກເຮົາຈະຕິດຕໍ່ທ່ານໃນໄວໆນີ້ ເພື່ອຢືນຢັນການສັ່ງຊື້</p>
      <Link href="/" className="bg-[#1247D8] text-white font-bold px-8 py-3 rounded-2xl hover:bg-[#0d35b0] transition-colors">
        ກັບໜ້າຫຼັກ
      </Link>
    </div>
  )

  if (!authChecked) return <div className="flex items-center justify-center py-20 text-gray-400">ກຳລັງກວດສອບ...</div>

  if (items.length === 0) return (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <p className="text-gray-400 mb-4">ກະຕ່າຫວ່າງ</p>
      <Link href="/products" className="text-[#1247D8] underline">ເລືອກຊື້ສິນຄ້າ</Link>
    </div>
  )

  const methods = [
    settings.cod_enabled && { id: 'cod', label: 'COD — ຈ່າຍປາຍທາງ', icon: '💵', desc: 'ຈ່າຍເມື່ອໄດ້ຮັບສິນຄ້າ' },
    settings.qr_enabled && settings.qr_image_url && { id: 'qr', label: 'ໂອນເງິນ QR', icon: '📷', desc: 'ສະແກນ QR Code ຊຳລະ' },
  ].filter(Boolean) as { id: string; label: string; icon: string; desc: string }[]

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-black text-gray-800 mb-6">💳 ຊຳລະເງີນ</h1>

      <form onSubmit={submit} className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Delivery info */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-black text-gray-800 mb-4 flex items-center gap-2"><MapPin size={16} className="text-[#1247D8]" /> ທີ່ຢູ່ຈັດສົ່ງ</h2>
            <div className="space-y-3">
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <User size={16} className="mx-3 text-gray-400 shrink-0" />
                <input value={form.name} onChange={e => set('name', e.target.value)} required
                  placeholder="ຊື່ຜູ້ຮັບ" className="flex-1 py-3 pr-4 outline-none text-sm" />
              </div>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <Phone size={16} className="mx-3 text-gray-400 shrink-0" />
                <input value={form.phone} onChange={e => set('phone', e.target.value)} required
                  placeholder="ເບີໂທ" type="tel" className="flex-1 py-3 pr-4 outline-none text-sm" />
              </div>
              <textarea value={form.address} onChange={e => set('address', e.target.value)} required
                placeholder="ທີ່ຢູ່ລະອຽດ (ບ້ານ, ເມືອງ, ແຂວງ)" rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 outline-none text-sm resize-none" />
            </div>
          </div>

          {/* Payment method */}
          {methods.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h2 className="font-black text-gray-800 mb-4">💳 ວິທີຊຳລະ</h2>
              <div className="space-y-2">
                {methods.map(m => (
                  <label key={m.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${method === m.id ? 'border-[#1247D8] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="method" value={m.id} checked={method === m.id} onChange={() => setMethod(m.id)} className="text-[#1247D8]" />
                    <span className="text-xl">{m.icon}</span>
                    <div>
                      <div className="font-bold text-sm">{m.label}</div>
                      <div className="text-xs text-gray-500">{m.desc}</div>
                    </div>
                  </label>
                ))}
              </div>

              {/* QR + Upload slip */}
              {method === 'qr' && settings.qr_image_url && (
                <div className="mt-4 space-y-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-2">ສະແກນ QR ນີ້ເພື່ອໂອນເງິນ</p>
                    <img src={settings.qr_image_url} alt="QR Payment" className="w-48 h-48 object-contain mx-auto border border-gray-200 rounded-xl" />
                    <p className="text-sm font-black text-[#1247D8] mt-2">ຈຳນວນ: {fmt(grand)}</p>
                  </div>

                  {/* Upload receipt */}
                  <div className="border-t pt-4">
                    <p className="text-sm font-bold text-gray-700 mb-2">📎 ອັບໂຫລດສະລິບໂອນເງິນ <span className="text-red-500">*</span></p>
                    {receiptUrl ? (
                      <div className="relative">
                        <img src={receiptUrl} alt="Receipt" className="w-full max-h-48 object-contain border border-green-200 rounded-xl bg-green-50" />
                        <button type="button" onClick={() => fileRef.current?.click()}
                          className="mt-2 text-xs text-[#1247D8] hover:underline">ປ່ຽນຮູບ</button>
                        <p className="text-xs text-green-600 font-bold mt-1">✅ ອັບໂຫລດສຳເລັດ</p>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRef.current?.click()}
                        className="w-full border-2 border-dashed border-gray-300 rounded-xl py-6 flex flex-col items-center gap-2 hover:border-[#1247D8] transition-colors">
                        <Upload size={20} className="text-gray-400" />
                        <span className="text-sm text-gray-500">{uploading ? 'ກຳລັງອັບໂຫລດ...' : 'ກົດເພື່ອອັບໂຫລດສະລິບ'}</span>
                      </button>
                    )}
                    <input ref={fileRef} type="file" accept="image/*" className="hidden"
                      onChange={e => { const f = e.target.files?.[0]; if (f) uploadReceipt(f) }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Items summary */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h2 className="font-black text-gray-800 mb-3">🛒 ລາຍການສິນຄ້າ</h2>
            <div className="space-y-2">
              {items.map(({ product: p, quantity }) => (
                <div key={p.id} className="flex justify-between text-sm text-gray-600">
                  <span className="line-clamp-1 flex-1 mr-4">{p.name} × {quantity}</span>
                  <span className="font-bold shrink-0">{fmt((p.discount_price ?? p.price) * quantity)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-fit sticky top-24">
          <h2 className="font-black text-gray-800 mb-4">ສະຫຼຸບ</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>ສິນຄ້າ</span><span>{fmt(subtotal)}</span></div>
            <div className="flex justify-between text-gray-600">
              <span>ຄ່າສົ່ງ</span>
              <span className={shipping === 0 ? 'text-green-500 font-bold' : ''}>{shipping === 0 ? 'ຟຣີ 🎉' : fmt(shipping)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-black text-lg">
              <span>ລວມ</span><span className="text-[#1247D8]">{fmt(grand)}</span>
            </div>
          </div>
          <button type="submit" disabled={loading || !method || uploading}
            className="block w-full mt-5 bg-[#1247D8] text-white text-center font-black py-4 rounded-2xl hover:bg-[#0d35b0] transition-colors disabled:opacity-60">
            {loading ? 'ກຳລັງສົ່ງ...' : 'ຢືນຢັນການສັ່ງຊື້ ✓'}
          </button>
          <Link href="/cart" className="block w-full mt-2 text-gray-400 text-sm text-center hover:underline">ກັບໄປກະຕ່າ</Link>
        </div>
      </form>
    </div>
  )
}
