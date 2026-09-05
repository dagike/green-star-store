import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { CartItem } from '@/types'
import { CartProvider, useCart } from './CartContext'

function wrapper({ children }: { children: ReactNode }) {
  return <CartProvider>{children}</CartProvider>
}

function item(overrides: Partial<Omit<CartItem, 'quantity'>> = {}): Omit<CartItem, 'quantity'> {
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

describe('CartContext', () => {
  it('starts empty', () => {
    const { result } = renderHook(() => useCart(), { wrapper })
    expect(result.current.items).toEqual([])
    expect(result.current.count).toBe(0)
  })

  it('adds a new item at the given quantity', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.add(item(), 2)
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(2)
    expect(result.current.count).toBe(2)
  })

  it('defaults to a quantity of 1 when none is given', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.add(item())
    })

    expect(result.current.items[0].quantity).toBe(1)
  })

  it('clamps a zero or negative quantity up to 1', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.add(item(), 0)
    })

    expect(result.current.items[0].quantity).toBe(1)
  })

  it('clamps quantity to available stock', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.add(item({ stock: 3 }), 10)
    })

    expect(result.current.items[0].quantity).toBe(3)
  })

  it('increments quantity when adding an item already in the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.add(item({ stock: 10 }), 2)
    })
    act(() => {
      result.current.add(item({ stock: 10 }), 3)
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(5)
  })

  it('clamps the incremented quantity to stock', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.add(item({ stock: 4 }), 3)
    })
    act(() => {
      result.current.add(item({ stock: 4 }), 3)
    })

    expect(result.current.items[0].quantity).toBe(4)
  })

  it('setQty clamps between 1 and stock', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.add(item({ stock: 5 }), 1)
    })
    act(() => {
      result.current.setQty(1, 0)
    })
    expect(result.current.items[0].quantity).toBe(1)

    act(() => {
      result.current.setQty(1, 99)
    })
    expect(result.current.items[0].quantity).toBe(5)

    act(() => {
      result.current.setQty(1, 3)
    })
    expect(result.current.items[0].quantity).toBe(3)
  })

  it('remove drops the matching line and leaves the rest', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.add(item({ productId: 1 }))
      result.current.add(item({ productId: 2 }))
    })
    act(() => {
      result.current.remove(1)
    })

    expect(result.current.items.map((line) => line.productId)).toEqual([2])
  })

  it('clear empties the cart', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.add(item())
    })
    act(() => {
      result.current.clear()
    })

    expect(result.current.items).toEqual([])
    expect(result.current.count).toBe(0)
  })

  it('merge adds lines that are not already present, clamped to stock', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.merge([{ ...item({ stock: 3 }), quantity: 10 }])
    })

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].quantity).toBe(3)
  })

  it('merge sums quantities for lines already in the cart, clamped to stock', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.add(item({ stock: 10 }), 4)
    })
    act(() => {
      result.current.merge([{ ...item({ stock: 10 }), quantity: 4 }])
    })

    expect(result.current.items[0].quantity).toBe(8)
  })

  it('count sums quantity across every line', () => {
    const { result } = renderHook(() => useCart(), { wrapper })

    act(() => {
      result.current.add(item({ productId: 1, stock: 10 }), 2)
      result.current.add(item({ productId: 2, stock: 10 }), 3)
    })

    expect(result.current.count).toBe(5)
  })

  it('persists across a remount via localStorage', () => {
    const first = renderHook(() => useCart(), { wrapper })
    act(() => {
      first.result.current.add(item(), 2)
    })

    const second = renderHook(() => useCart(), { wrapper })
    expect(second.result.current.items).toHaveLength(1)
    expect(second.result.current.items[0].quantity).toBe(2)
  })
})
