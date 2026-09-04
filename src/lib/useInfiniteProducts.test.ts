import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductSummary } from '@/types'
import * as api from './api'
import { useInfiniteProducts } from './useInfiniteProducts'

vi.mock('./api')

function summary(id: number): ProductSummary {
  return {
    id,
    slug: `product-${id}`,
    name: `Product ${id}`,
    brand: 'Brand',
    category: 'electronics',
    priceCents: 1000 + id,
    compareAtCents: null,
    stock: 10,
    avgRating: 4,
    reviewCount: 1,
    thumbnail: null,
  }
}

describe('useInfiniteProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads the first page on mount', async () => {
    vi.mocked(api.getProducts).mockResolvedValue({
      items: [summary(1), summary(2)],
      nextCursor: 'abc',
    })

    const { result } = renderHook(() => useInfiniteProducts({ sort: 'newest', limit: 2 }))
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.items.map((item) => item.id)).toEqual([1, 2])
    expect(result.current.hasMore).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('appends items and advances the cursor on loadMore', async () => {
    vi.mocked(api.getProducts)
      .mockResolvedValueOnce({ items: [summary(1)], nextCursor: 'page2' })
      .mockResolvedValueOnce({ items: [summary(2)], nextCursor: null })

    const { result } = renderHook(() => useInfiniteProducts({ limit: 1 }))
    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.loadMore()
    })

    await waitFor(() => expect(result.current.loadingMore).toBe(false))

    expect(result.current.items.map((item) => item.id)).toEqual([1, 2])
    expect(result.current.hasMore).toBe(false)
    expect(api.getProducts).toHaveBeenLastCalledWith(expect.objectContaining({ cursor: 'page2' }))
  })

  it('ignores loadMore while a page is already loading or none remain', async () => {
    vi.mocked(api.getProducts).mockResolvedValue({ items: [summary(1)], nextCursor: null })

    const { result } = renderHook(() => useInfiniteProducts({}))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.hasMore).toBe(false)

    act(() => {
      result.current.loadMore()
    })

    // No cursor/hasMore, so no second call should have been made.
    expect(api.getProducts).toHaveBeenCalledTimes(1)
  })

  it('surfaces an error message when the initial fetch fails', async () => {
    vi.mocked(api.getProducts).mockRejectedValue(new Error('network down'))

    const { result } = renderHook(() => useInfiniteProducts({}))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('network down')
    expect(result.current.items).toEqual([])
  })
})
