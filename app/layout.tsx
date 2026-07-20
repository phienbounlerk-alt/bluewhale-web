import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'
import { AuthProvider } from '@/lib/auth-context'
import { Noto_Sans_Lao } from 'next/font/google'

const notoSansLao = Noto_Sans_Lao({ subsets: ['lao'], weight: ['400', '500', '700', '900'], display: 'swap' })

export const metadata: Metadata = {
  title: 'BlueWhale — ຕະຫຼາດດິຈິຕອລລາວ',
  description: 'ຊື້ສິນຄ້າ ລາຄາດີ ສົ່ງໄວ ທົ່ວລາວ',
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/logo.png', sizes: '1024x1024', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-32.png',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lo">
      <body className={notoSansLao.className}>
        <AuthProvider>
        <Navbar />
        <main className="min-h-screen pb-20 md:pb-0">{children}</main>
        <BottomNav />
        <footer className="bg-[#1247D8] text-white mt-8 py-10 mb-16 md:mb-0">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="text-2xl mb-2">🐋 BlueWhale</div>
            <p className="text-white/70 text-sm">ຕະຫຼາດດິຈິຕອລ ອັນດັບ 1 ລາວ</p>
            <div className="flex justify-center gap-6 mt-4 text-sm text-white/60">
              <span>COD ຈ່າຍປາຍທາງ</span>
              <span>BCEL One</span>
              <span>ສົ່ງຟຣີ ≥ ₭200,000</span>
            </div>
          </div>
        </footer>
        </AuthProvider>
      </body>
    </html>
  )
}
