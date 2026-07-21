'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Clock, TrendingUp, X, Mic, ArrowUpLeft } from 'lucide-react'

const HISTORY_KEY = 'bw_searches'
const MAX_HISTORY = 10

const TRENDING: string[] = [
  'Nike', 'Samsung', 'ກາເຟລາວ', 'AirPods', 'ເສື້ອຍືດ', 'Laptop', 'ຄຣີມ', 'ໝໍ້ຫຸງເຂົ້າ',
]

// ── History helpers ───────────────────────────────────────────────────────────
function readHistory(): string[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') } catch { return [] }
}

export function pushHistory(q: string) {
  if (!q.trim()) return
  const prev = readHistory().filter(s => s !== q)
  localStorage.setItem(HISTORY_KEY, JSON.stringify([q, ...prev].slice(0, MAX_HISTORY)))
}

function clearHistory() {
  localStorage.setItem(HISTORY_KEY, '[]')
}

function removeHistory(item: string) {
  const updated = readHistory().filter(s => s !== item)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated))
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  /** existing value from parent */
  value: string
  onChange: (v: string) => void
  /** called when the user submits a search */
  onSearch: (q: string) => void
  /** pass product names for suggestions */
  productNames?: string[]
  placeholder?: string
  className?: string
  inputClassName?: string
  /** if true, the dropdown opens downward inside the navbar */
  navbarMode?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function SearchDropdown({
  value, onChange, onSearch,
  productNames = [],
  placeholder = 'ຄົ້ນຫາສິນຄ້າ...',
  className = '',
  inputClassName = '',
  navbarMode = false,
}: Props) {
  const [open, setOpen]         = useState(false)
  const [history, setHistory]   = useState<string[]>([])
  const [activeIdx, setActive]  = useState(-1)
  const wrapRef  = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()

  // Load history on mount and whenever dropdown opens
  useEffect(() => {
    if (open) setHistory(readHistory())
  }, [open])

  // Outside click closes dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false); setActive(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Suggestions from product names ──
  const suggestions = value.trim().length >= 1
    ? productNames
        .filter(n => n.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 6)
    : []

  // ── All items for keyboard nav ──
  const allItems: string[] = value.trim()
    ? suggestions
    : [...history, ...TRENDING.filter(t => !history.includes(t))].slice(0, 8)

  const doSearch = useCallback((q: string) => {
    if (!q.trim()) return
    pushHistory(q)
    setHistory(readHistory())
    onChange(q)
    onSearch(q)
    setOpen(false)
    setActive(-1)
  }, [onChange, onSearch])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) { if (e.key === 'ArrowDown') setOpen(true); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, allItems.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(i => Math.max(i - 1, -1)) }
    else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeIdx >= 0 && allItems[activeIdx]) doSearch(allItems[activeIdx])
      else doSearch(value)
    }
    else if (e.key === 'Escape') { setOpen(false); setActive(-1); inputRef.current?.blur() }
  }

  const handleClearOne = (e: React.MouseEvent, item: string) => {
    e.stopPropagation()
    removeHistory(item)
    setHistory(readHistory())
  }

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation()
    clearHistory()
    setHistory([])
  }

  const showDropdown = open && (history.length > 0 || value.trim().length > 0 || true) // always show on focus

  // ── Voice search (Web Speech API placeholder) ──
  const handleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('ໂທລະສັບ / browser ຂອງທ່ານບໍ່ຮອງຮັບ Voice Search')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'lo-LA'
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      onChange(transcript)
      doSearch(transcript)
    }
    recognition.start()
  }

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      {/* ── Input row ── */}
      <div className={`flex items-center bg-white rounded-xl overflow-hidden ${navbarMode ? 'rounded-lg' : 'border border-gray-200 shadow-sm'}`}>
        <span className="pl-3 text-gray-400 shrink-0"><Search size={16} /></span>
        <input
          ref={inputRef}
          value={value}
          onChange={e => { onChange(e.target.value); setOpen(true); setActive(-1) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`flex-1 px-3 py-2.5 text-sm text-gray-800 outline-none bg-transparent ${inputClassName}`}
          autoComplete="off"
          spellCheck={false}
        />
        {value && (
          <button type="button" onClick={() => { onChange(''); inputRef.current?.focus() }}
            className="px-2 text-gray-300 hover:text-gray-500 transition-colors shrink-0">
            <X size={14} />
          </button>
        )}
        {/* Voice search */}
        <button type="button" onClick={handleVoice}
          className={`shrink-0 px-2.5 text-gray-400 hover:text-[#1247D8] transition-colors ${navbarMode ? '' : 'border-l border-gray-100'}`}
          title="Voice Search">
          <Mic size={15} />
        </button>
        {/* Submit */}
        <button type="submit"
          className={`shrink-0 flex items-center justify-center bg-[#EE4D2D] text-white transition-colors hover:bg-[#d63d1f] ${navbarMode ? 'h-8 px-2.5' : 'h-10 px-3'}`}>
          <Search size={navbarMode ? 14 : 16} />
        </button>
      </div>

      {/* ── Dropdown ── */}
      {showDropdown && (
        <div className={`absolute left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[200] ${navbarMode ? 'top-full' : 'top-full'}`}>

          {/* Suggestions while typing */}
          {value.trim().length >= 1 && suggestions.length > 0 && (
            <div>
              <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                <Search size={11} className="text-gray-400" />
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">ສິນຄ້າທີ່ກ່ຽວຂ້ອງ</span>
              </div>
              {suggestions.map((s, i) => (
                <button key={s} type="button"
                  onMouseDown={() => doSearch(s)}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${activeIdx === i ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  <ArrowUpLeft size={13} className="text-gray-300 shrink-0" />
                  <span className="text-sm text-gray-700 flex-1"
                    dangerouslySetInnerHTML={{ __html: s.replace(new RegExp(`(${value.trim()})`, 'gi'), '<strong class="text-[#1247D8]">$1</strong>') }} />
                </button>
              ))}
            </div>
          )}

          {/* No typing — show history + trending */}
          {value.trim().length < 1 && (
            <>
              {/* Recent searches */}
              {history.length > 0 && (
                <div>
                  <div className="px-4 pt-3 pb-1 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock size={11} className="text-gray-400" />
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">ຄົ້ນຫາລ່າສຸດ</span>
                    </div>
                    <button type="button" onMouseDown={handleClearAll}
                      className="text-[10px] text-red-400 hover:text-red-600 font-bold">
                      ລ້າງທັງໝົດ
                    </button>
                  </div>
                  {history.slice(0, 5).map((item, i) => (
                    <div key={item}
                      onMouseEnter={() => setActive(i)}
                      className={`flex items-center gap-3 px-4 py-2.5 transition-colors cursor-pointer group ${activeIdx === i ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                      onMouseDown={() => doSearch(item)}>
                      <Clock size={13} className="text-gray-300 shrink-0" />
                      <span className="text-sm text-gray-700 flex-1">{item}</span>
                      <button type="button"
                        onMouseDown={e => handleClearOne(e, item)}
                        className="text-gray-300 hover:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Trending */}
              <div>
                <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                  <TrendingUp size={11} className="text-[#EE4D2D]" />
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">ຄົ້ນຫາຍອດນິຍົມ</span>
                </div>
                <div className="px-4 pb-3 flex flex-wrap gap-2 pt-1">
                  {TRENDING.map((t, i) => (
                    <button key={t} type="button"
                      onMouseDown={() => doSearch(t)}
                      className="flex items-center gap-1.5 bg-gray-50 hover:bg-blue-50 hover:text-[#1247D8] border border-gray-200 hover:border-[#1247D8]/30 px-3 py-1.5 rounded-xl text-xs text-gray-600 font-medium transition-colors">
                      <span className="text-[#EE4D2D] font-black text-[10px]">{i + 1}</span>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* No suggestions state */}
          {value.trim().length >= 1 && suggestions.length === 0 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-gray-400">ກົດ Enter ເພື່ອຄົ້ນຫາ "<span className="font-bold text-gray-700">{value}</span>"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
