import type { Metadata, Viewport } from 'next'
import './globals.css'
import Navbar from '@/components/layout/Navbar'
import BottomNav from '@/components/layout/BottomNav'
import { AuthProvider } from '@/lib/auth-context'
import { Noto_Sans_Lao } from 'next/font/google'
import PwaRegister from '@/components/PwaRegister'

const notoSansLao = Noto_Sans_Lao({ subsets: ['lao'], weight: ['400', '500', '700', '900'], display: 'swap' })

export const metadata: Metadata = {
  title: 'BlueWhale — ຕະຫຼາດດິຈິຕອລລາວ',
  description: 'ຊື້ສິນຄ້າ ລາຄາດີ ສົ່ງໄວ ທົ່ວລາວ',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BlueWhale',
    startupImage: '/apple-touch-icon.png',
  },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192.png',   sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png',   sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon-32.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#1247D8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lo">
      <body className={notoSansLao.className}>
        <AuthProvider>
        <PwaRegister />
        <Navbar />
        <main className="min-h-screen pb-20 md:pb-0">{children}</main>
        <BottomNav />
        <footer className="bg-[#0a1a3e] text-white mt-8 mb-16 md:mb-0">
          {/* Main footer links */}
          <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {/* Col 1 */}
              <div>
                <p className="font-black text-sm mb-4 text-white">ກ່ຽວກັບ BlueWhale</p>
                <ul className="space-y-2 text-sm text-white/60">
                  <li><a href="#" className="hover:text-white transition-colors">BlueWhale ແມ່ນຫຍັງ</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">ທີມງານ</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">ສະໝັກງານ</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">ຂ່າວສານ</a></li>
                </ul>
              </div>
              {/* Col 2 */}
              <div>
                <p className="font-black text-sm mb-4 text-white">ນະໂຍບາຍ & ກົດລະບຽບ</p>
                <ul className="space-y-2 text-sm text-white/60">
                  <li><a href="#" className="hover:text-white transition-colors">ນະໂຍບາຍຄວາມເປັນສ່ວນຕົວ</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">ເງື່ອນໄຂການໃຊ້ງານ</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">ນະໂຍບາຍການສົ່ງຄືນ</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">ນະໂຍບາຍການຊຳລະເງິນ</a></li>
                </ul>
              </div>
              {/* Col 3 */}
              <div>
                <p className="font-black text-sm mb-4 text-white">ສູນຊ່ວຍເຫຼືອ</p>
                <ul className="space-y-2 text-sm text-white/60">
                  <li><a href="#" className="hover:text-white transition-colors">ວິທີການສັ່ງຊື້</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">ຕິດຕາມພັດສະດຸ</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">ຄຳຖາມທີ່ພົບເລື້ອຍ</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">ລາຍງານບັນຫາ</a></li>
                </ul>
              </div>
              {/* Col 4 */}
              <div>
                <p className="font-black text-sm mb-4 text-white">ຕິດຕໍ່ພວກເຮົາ</p>
                <ul className="space-y-2 text-sm text-white/60">
                  <li>📍 ວຽງຈັນ, ລາວ</li>
                  <li>📞 020 9269 9612</li>
                  <li>✉️ hello@bluewhalelao.com</li>
                </ul>
                {/* Social icons */}
                <div className="flex gap-3 mt-4">
                  <a href="https://facebook.com/BlueWhalelao" target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#1877F2] flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                  </a>
                  <a href="https://tiktok.com/@BlueWhalelao" target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-black flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z"/></svg>
                  </a>
                  <a href="https://instagram.com/BlueWhalelao" target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#E1306C] flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                  </a>
                  <a href="https://youtube.com/@BlueWhalelao" target="_blank" rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#FF0000] flex items-center justify-center transition-colors">
                    <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Payment methods */}
          <div className="border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 py-5 flex flex-wrap items-center gap-4">
              <p className="text-xs text-white/50 shrink-0">ຮັບຊຳລະ:</p>
              <div className="flex flex-wrap items-center gap-3">
                {/* BCEL One - real logo */}
                <div className="bg-white rounded-lg px-2 py-1 h-9 flex items-center">
                  <img src="/bcel-one.webp" alt="BCEL One" className="h-7 w-auto object-contain" />
                </div>
                {/* JDB - real logo */}
                <div className="bg-white rounded-lg px-2 py-1 h-9 flex items-center">
                  <img src="/jdb.png" alt="JDB" className="h-7 w-auto object-contain" />
                </div>
                {/* LDB - real logo */}
                <div className="bg-white rounded-lg px-2 py-1 h-9 flex items-center">
                  <img src="/ldb.jpg" alt="LDB" className="h-7 w-auto object-contain" />
                </div>
                {/* COD - ສີຂຽວ */}
                <div className="bg-green-600 rounded-lg px-3 h-9 flex items-center">
                  <span className="text-white font-black text-xs">COD <span className="text-[10px] font-normal">ຈ່າຍປາຍທາງ</span></span>
                </div>
              </div>
              <p className="text-xs text-white/30 ml-auto hidden md:block">ສົ່ງຟຣີ ເມື່ອຊື້ຄົບ ₭200,000</p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10">
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-2">
              <p className="text-xs text-white/40">© 2026 BlueWhale. ສະຫງວນລິຂະສິດ.</p>
              <div className="flex gap-4 text-xs text-white/40">
                <a href="#" className="hover:text-white/70">ນະໂຍບາຍ</a>
                <a href="#" className="hover:text-white/70">ເງື່ອນໄຂ</a>
                <a href="#" className="hover:text-white/70">ຄຸກກີ</a>
              </div>
            </div>
          </div>
        </footer>
        </AuthProvider>
      </body>
    </html>
  )
}
