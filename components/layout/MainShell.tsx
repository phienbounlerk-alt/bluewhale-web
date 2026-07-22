'use client'
import { usePathname } from 'next/navigation'
import Navbar from './Navbar'
import BottomNav from './BottomNav'

export default function MainShell({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  const path = usePathname()
  const isAdmin = path.startsWith('/admin')

  if (isAdmin) return <>{children}</>

  return (
    <>
      <Navbar />
      <main className="min-h-screen pb-20 md:pb-0">{children}</main>
      <BottomNav />
      {footer}
    </>
  )
}
