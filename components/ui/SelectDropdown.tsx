'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
  disabled?: boolean
  icon?: React.ReactNode
}

export default function SelectDropdown({ value, onChange, options, placeholder, disabled, icon }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full flex items-center border border-gray-200 rounded-xl overflow-hidden text-sm text-left transition-colors ${open ? 'border-[#1247D8]' : ''} ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
      >
        {icon && <span className="mx-3 text-gray-400 shrink-0">{icon}</span>}
        <span className={`flex-1 py-3 ${value ? 'text-gray-800' : 'text-gray-400'}`}>
          {value || placeholder}
        </span>
        <ChevronDown size={14} className={`mr-3 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors ${value === opt ? 'text-[#1247D8] font-bold bg-blue-50' : 'text-gray-700'}`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
