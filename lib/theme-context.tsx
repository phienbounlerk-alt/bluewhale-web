'use client'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
const ThemeCtx = createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} })

const DARK_VARS: Record<string, string> = {
  '--bg-page':   '#0f172a',
  '--bg-card':   '#1e293b',
  '--bg-card2':  '#162032',
  '--bg-input':  '#0f172a',
  '--text-1':    '#f1f5f9',
  '--text-2':    '#94a3b8',
  '--text-3':    '#64748b',
  '--border-1':  '#334155',
  '--border-2':  '#1e293b',
}
const LIGHT_VARS: Record<string, string> = {
  '--bg-page':   '#F4F5F8',
  '--bg-card':   '#ffffff',
  '--bg-card2':  '#f9fafb',
  '--bg-input':  '#f3f4f6',
  '--text-1':    '#1f2937',
  '--text-2':    '#6b7280',
  '--text-3':    '#9ca3af',
  '--border-1':  '#e5e7eb',
  '--border-2':  '#f3f4f6',
}

const DARK_CSS = `
  body { background:#0f172a!important; color:#f1f5f9!important; }
  /* Cards */
  [class*="bg-white"]:not(nav[class*="bg-\[#1247D8\]"]):not([class*="bg-white/1"]):not([class*="bg-white/2"]) { background-color:#1e293b!important; }
  [class*="bg-gray-50"] { background-color:#162032!important; }
  [class*="bg-gray-100"] { background-color:#334155!important; }
  [class*="bg-gray-200"] { background-color:#475569!important; }
  /* Borders */
  [class*="border-gray-100"],[class*="border-gray-200"],[class*="border-gray-300"] { border-color:#334155!important; }
  [class*="divide-gray-50"]>*+* { border-color:#334155!important; }
  /* Text */
  [class*="text-gray-800"],[class*="text-gray-900"] { color:#f1f5f9!important; }
  [class*="text-gray-700"] { color:#e2e8f0!important; }
  [class*="text-gray-600"] { color:#cbd5e1!important; }
  [class*="text-gray-500"] { color:#94a3b8!important; }
  [class*="text-gray-400"] { color:#64748b!important; }
  /* Inputs */
  input:not([type="range"]),textarea,select { background-color:#0f172a!important; color:#f1f5f9!important; border-color:#334155!important; }
  input::placeholder,textarea::placeholder { color:#475569!important; }
  /* Bottom nav */
  nav.fixed.bottom-0 { background-color:rgba(15,23,42,0.97)!important; border-color:#334155!important; }
  nav.fixed.bottom-0 [class*="text-gray-400"] { color:rgba(255,255,255,0.65)!important; }
  nav.fixed.bottom-0 [class*="text-gray-200"] { color:rgba(255,255,255,0.5)!important; }
  nav.fixed.bottom-0 [class*="bg-gray-200"] { background-color:rgba(255,255,255,0.15)!important; }
  nav.fixed.bottom-0 [class*="text-gray-500"] { color:rgba(255,255,255,0.5)!important; }
  nav.fixed.bottom-0 [class*="border-gray-300"] { border-color:rgba(255,255,255,0.3)!important; }
  /* Tinted bg */
  [class*="bg-blue-50"] { background-color:rgba(18,71,216,.15)!important; }
  [class*="bg-orange-50"] { background-color:rgba(234,88,12,.12)!important; }
  [class*="bg-green-50"] { background-color:rgba(22,163,74,.12)!important; }
  [class*="bg-purple-50"] { background-color:rgba(147,51,234,.12)!important; }
  [class*="bg-red-50"] { background-color:rgba(238,77,45,.12)!important; }
  [class*="bg-yellow-50"] { background-color:rgba(202,138,4,.12)!important; }
  /* Hover */
  [class*="hover:bg-gray-50"]:hover { background-color:#1e2d42!important; }
  [class*="hover:bg-gray-100"]:hover { background-color:#334155!important; }
  [class*="hover:bg-blue-50"]:hover { background-color:rgba(18,71,216,.2)!important; }
  [class*="hover:bg-blue-100"]:hover { background-color:rgba(18,71,216,.3)!important; }
  [class*="hover:bg-red-50"]:hover { background-color:rgba(238,77,45,.12)!important; }
  [class*="hover:bg-red-100"]:hover { background-color:rgba(238,77,45,.2)!important; }
  /* Gradient bg (price box etc.) */
  [class*="from-blue-50"],[class*="from-indigo-50"],[class*="from-gray-50"] { --tw-gradient-from:#162032!important; }
  [class*="to-indigo-50"],[class*="to-blue-50"],[class*="to-gray-50"] { --tw-gradient-to:#1e293b!important; }
  [class*="bg-gradient-to"][class*="from-blue-50"] { background:#162032!important; }
  [class*="bg-gradient-to"][class*="from-indigo-50"] { background:#162032!important; }
  /* Disabled button */
  [class*="bg-gray-300"] { background-color:#334155!important; }
  /* Border blue/indigo light */
  [class*="border-blue-100"],[class*="border-indigo-100"] { border-color:#1e3a5f!important; }
  /* Skeleton */
  .skeleton { background:linear-gradient(90deg,#1e293b 25%,#334155 50%,#1e293b 75%)!important; background-size:200% 100%!important; }
`

function applyTheme(theme: Theme) {
  const el = document.documentElement
  el.classList.toggle('dark', theme === 'dark')

  // Inject/remove dark style tag
  const existing = document.getElementById('bw-dark-style')
  if (theme === 'dark') {
    if (!existing) {
      const style = document.createElement('style')
      style.id = 'bw-dark-style'
      style.textContent = DARK_CSS
      document.head.appendChild(style)
    }
  } else {
    existing?.remove()
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = localStorage.getItem('bw_theme') as Theme | null
    const pref = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    const initial: Theme = stored ?? pref
    setTheme(initial)
    applyTheme(initial)
  }, [])

  const toggle = () => {
    setTheme(t => {
      const next: Theme = t === 'light' ? 'dark' : 'light'
      localStorage.setItem('bw_theme', next)
      applyTheme(next)
      return next
    })
  }

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}

export const useTheme = () => useContext(ThemeCtx)
