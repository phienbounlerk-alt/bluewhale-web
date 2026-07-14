'use client'
import { useCart } from '@/store/cart'
import { fmt, supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CheckCircle, MapPin, Phone, User } from 'lucide-react'

const FREE = 200000, SHIP = 20000

export default function CheckoutPage() {
  const { items, total, clear } = useCart()
  const subtotal = total()
  const shipping = subtotal >= FREE ? 0 : SHIP
  const grand = subtotal + shipping
  const [method, setMethod] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [settings, setSettings] = useState({ cod_enabled: true, qr_enabled: false, qr_image_url: null as string | null })

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  useEffect(() => {
    supabase.from('payment_settings').select('*').eq('id', 1).single()
      .then(({ data }) => {
        if (data) {
          setSettings(data)
          // set default method
          if (data.cod_enabled) setMethod('cod')
          else if (data.qr_enabled) setMethod('qr')
        }
      })
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.phone || !form.address || !method) return
    setLoading(true)
    await supabase.from('orders').insert({
      customer_name: form.name,
      customer_phone: form.phone,
      address: form.address,
      payment_method: method,
      items: items.map(i => ({ id: i.product.id, name: i.product.name, qty: i.quantity, price: i.product.discount_price ?? i.product.price })),
      total: grand,
      status: 'pending',
    })
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

              {/* QR Image */}
              {method === 'qr' && settings.qr_image_url && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600 mb-2">ສະແກນ QR ນີ້ເພື່ອໂອນເງິນ</p>
                  <img src={settings.qr_image_url} alt="QR Payment" className="w-48 h-48 object-contain mx-auto border border-gray-200 rounded-xl" />
                  <p className="text-xs text-gray-400 mt-2">ຈຳນວນ: {fmt(grand)}</p>
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
          <button type="submit" disabled={loading || !method}
            className="block w-full mt-5 bg-[#1247D8] text-white text-center font-black py-4 rounded-2xl hover:bg-[#0d35b0] transition-colors disabled:opacity-60">
            {loading ? 'ກຳລັງສົ່ງ...' : 'ຢືນຢັນການສັ່ງຊື້ ✓'}
          </button>
          <Link href="/cart" className="block w-full mt-2 text-gray-400 text-sm text-center hover:underline">ກັບໄປກະຕ່າ</Link>
        </div>
      </form>
    </div>
  )
}
