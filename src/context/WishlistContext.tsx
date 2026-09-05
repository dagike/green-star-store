import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { usePersistedReducer } from '@/lib/usePersistedReducer'
import type { WishlistItem } from '@/types'

type WishlistState = WishlistItem[]

type WishlistAction =
  { type: 'add'; item: WishlistItem } | { type: 'remove'; productId: number } | { type: 'clear' }

function wishlistReducer(state: WishlistState, action: WishlistAction): WishlistState {
  switch (action.type) {
    case 'add':
      if (state.some((item) => item.productId === action.item.productId)) return state
      return [...state, action.item]
    case 'remove':
      return state.filter((item) => item.productId !== action.productId)
    case 'clear':
      return []
    default:
      return state
  }
}

interface WishlistContextValue {
  items: WishlistItem[]
  count: number
  has: (productId: number) => boolean
  add: (item: WishlistItem) => void
  remove: (productId: number) => void
  toggle: (item: WishlistItem) => void
  clear: () => void
}

const WishlistContext = createContext<WishlistContextValue | null>(null)

const STORAGE_KEY = 'gss:wishlist'

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = usePersistedReducer<WishlistState, WishlistAction>(
    STORAGE_KEY,
    wishlistReducer,
    [],
  )

  const value = useMemo<WishlistContextValue>(() => {
    const has = (productId: number) => items.some((item) => item.productId === productId)

    return {
      items,
      count: items.length,
      has,
      add: (item) => dispatch({ type: 'add', item }),
      remove: (productId) => dispatch({ type: 'remove', productId }),
      toggle: (item) =>
        dispatch(
          has(item.productId)
            ? { type: 'remove', productId: item.productId }
            : { type: 'add', item },
        ),
      clear: () => dispatch({ type: 'clear' }),
    }
  }, [items, dispatch])

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook live together by convention
export function useWishlist() {
  const context = useContext(WishlistContext)
  if (!context) throw new Error('useWishlist must be used within a WishlistProvider')
  return context
}
