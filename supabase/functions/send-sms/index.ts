import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const INFOBIP_API_KEY = Deno.env.get('INFOBIP_API_KEY')!
const INFOBIP_BASE_URL = Deno.env.get('INFOBIP_BASE_URL')! // z451e3.api.infobip.com

serve(async (req) => {
  const body = await req.json()
  console.log('Hook payload:', JSON.stringify(body))
  // Supabase Auth Hook wraps payload under different keys
  const phone = body.phone ?? body.user?.phone ?? body.record?.phone
  const otp = body.otp ?? body.token ?? body.record?.token

  const res = await fetch(`https://${INFOBIP_BASE_URL}/sms/2/text/advanced`, {
    method: 'POST',
    headers: {
      'Authorization': `App ${INFOBIP_API_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      messages: [{
        destinations: [{ to: phone.replace('+', '') }],
        from: 'BlueWhale',
        text: `BlueWhale: ລະຫັດ OTP ຂອງທ່ານ ${otp} (ໃຊ້ໄດ້ 5 ນາທີ)`,
      }],
    }),
  })

  const data = await res.json()
  console.log('Infobip response:', JSON.stringify(data))

  return new Response(JSON.stringify({ success: res.ok }), {
    headers: { 'Content-Type': 'application/json' },
    status: res.ok ? 200 : 500,
  })
})
