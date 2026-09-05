import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { WishlistItem } from '@/types'
import { WishlistProvider, useWishlist } from './WishlistContext'

function wrapper({ children }: { children: ReactNode }) {
  return <WishlistProvider>{children}</WishlistProvider>
}

function item(overrides: Partial<WishlistItem> = {}): WishlistItem {
  return {
    productId: 1,
    slug: 'widget',
    name: 'Widget',
    brand: 'Acme',
    thumbnail: null,
    priceCents: 1000,
    compareAtCents: null,
    stock: 5,
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
})

describe('WishlistContext', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useWishlist(), { wrapper })
    expect(result.current.items).toEqual([])
    expect(result.current.count).toBe(0)
  })

  it('adds an item', () => {
    const { result } = renderHook(() => useWishlist(), { wrapper })

    act(() => {
      result.current.add(item())
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.count).toBe(1)
    expect(result.current.has(1)).toBe(true)
  })

  it('does not duplicate an item already on the list', () => {
    const { result } = renderHook(() => useWishlist(), { wrapper })

    act(() => {
      result.current.add(item())
    })
    act(() => {
      result.current.add(item())
    })

    expect(result.current.items).toHaveLength(1)
  })

  it('removes an item', () => {
    const { result } = renderHook(() => useWishlist(), { wrapper })

    act(() => {
      result.current.add(item({ productId: 1 }))
      result.current.add(item({ productId: 2 }))
    })
    act(() => {
      result.current.remove(1)
    })

    expect(result.current.items.map((line) => line.productId)).toEqual([2])
    expect(result.current.has(1)).toBe(false)
  })

  it('toggle adds when absent and removes when present', () => {
    const { result } = renderHook(() => useWishlist(), { wrapper })

    act(() => {
      result.current.toggle(item())
    })
    expect(result.current.has(1)).toBe(true)

    act(() => {
      result.current.toggle(item())
    })
    expect(result.current.has(1)).toBe(false)
    expect(result.current.items).toEqual([])
  })

  it('clear empties the list', () => {
    const { result } = renderHook(() => useWishlist(), { wrapper })

    act(() => {
      result.current.add(item({ productId: 1 }))
      result.current.add(item({ productId: 2 }))
    })
    act(() => {
      result.current.clear()
    })

    expect(result.current.items).toEqual([])
    expect(result.current.count).toBe(0)
  })

  it('persists across a remount via localStorage', () => {
    const first = renderHook(() => useWishlist(), { wrapper })
    act(() => {
      first.result.current.add(item())
    })

    const second = renderHook(() => useWishlist(), { wrapper })
    expect(second.result.current.items).toHaveLength(1)
    expect(second.result.current.has(1)).toBe(true)
  })
})
