import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product, CartItem } from '@/lib/supabase'

type CartStore = {
  items: CartItem[]
  add: (product: Product) => void
  remove: (id: string) => void
  update: (id: string, qty: number) => void
  clear: () => void
  total: () => number
  count: () => number
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product) => {
        const existing = get().items.find(i => i.product.id === product.id)
        if (existing) {
          set({ items: get().items.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i) })
        } else {
          set({ items: [...get().items, { product, quantity: 1 }] })
        }
      },
      remove: (id) => set({ items: get().items.filter(i => i.product.id !== id) }),
      update: (id, qty) => {
        if (qty <= 0) { get().remove(id); return }
        set({ items: get().items.map(i => i.product.id === id ? { ...i, quantity: qty } : i) })
      },
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((s, i) => s + (i.product.discount_price ?? i.product.price) * i.quantity, 0),
      count: () => get().items.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'bw-cart' }
  )
)
