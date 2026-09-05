import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { usePersistedReducer } from '@/lib/usePersistedReducer'
import type { CartItem } from '@/types'

type CartState = CartItem[]

type CartAction =
  | { type: 'add'; item: Omit<CartItem, 'quantity'>; quantity: number }
  | { type: 'remove'; productId: number }
  | { type: 'setQty'; productId: number; quantity: number }
  | { type: 'clear' }
  | { type: 'merge'; items: CartItem[] }

function clampQty(quantity: number, stock: number): number {
  return Math.min(Math.max(quantity, 1), Math.max(stock, 1))
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'add': {
      const existing = state.find((line) => line.productId === action.item.productId)
      if (existing) {
        return state.map((line) =>
          line.productId === action.item.productId
            ? { ...line, quantity: clampQty(line.quantity + action.quantity, line.stock) }
            : line,
        )
      }
      return [...state, { ...action.item, quantity: clampQty(action.quantity, action.item.stock) }]
    }
    case 'remove':
      return state.filter((line) => line.productId !== action.productId)
    case 'setQty':
      return state.map((line) =>
        line.productId === action.productId
          ? { ...line, quantity: clampQty(action.quantity, line.stock) }
          : line,
      )
    case 'clear':
      return []
    case 'merge': {
      const merged = [...state]
      for (const incoming of action.items) {
        const index = merged.findIndex((line) => line.productId === incoming.productId)
        if (index === -1) {
          merged.push({ ...incoming, quantity: clampQty(incoming.quantity, incoming.stock) })
        } else {
          merged[index] = {
            ...merged[index],
            quantity: clampQty(merged[index].quantity + incoming.quantity, merged[index].stock),
          }
        }
      }
      return merged
    }
    default:
      return state
  }
}

interface CartContextValue {
  items: CartItem[]
  count: number
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void
  remove: (productId: number) => void
  setQty: (productId: number, quantity: number) => void
  clear: () => void
  merge: (items: CartItem[]) => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'gss:cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = usePersistedReducer<CartState, CartAction>(STORAGE_KEY, cartReducer, [])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((sum, line) => sum + line.quantity, 0),
      add: (item, quantity = 1) => dispatch({ type: 'add', item, quantity }),
      remove: (productId) => dispatch({ type: 'remove', productId }),
      setQty: (productId, quantity) => dispatch({ type: 'setQty', productId, quantity }),
      clear: () => dispatch({ type: 'clear' }),
      merge: (mergeItems) => dispatch({ type: 'merge', items: mergeItems }),
    }),
    [items, dispatch],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook live together by convention
export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within a CartProvider')
  return context
}
