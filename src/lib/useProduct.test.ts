import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ProductDetailResponse } from '@/types'
import * as api from './api'
import { useProduct } from './useProduct'

vi.mock('./api')

function buildDetail(slug: string): ProductDetailResponse {
  return {
    product: {
      id: 1,
      slug,
      name: 'Test Product',
      brand: 'Brand',
      description: 'A product.',
      category: 'electronics',
      priceCents: 1999,
      compareAtCents: null,
      stock: 5,
      avgRating: 4.5,
      reviewCount: 2,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    images: [{ url: 'https://example.com/a.jpg', alt: 'Test Product', position: 0 }],
    reviews: [],
    related: [],
  }
}

describe('useProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('has no data and is not loading when there is no slug', () => {
    const { result } = renderHook(() => useProduct(undefined))

    expect(result.current.loading).toBe(false)
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
    expect(api.getProduct).not.toHaveBeenCalled()
  })

  it('loads product data for a given slug', async () => {
    const detail = buildDetail('foo')
    vi.mocked(api.getProduct).mockResolvedValue(detail)

    const { result } = renderHook(() => useProduct('foo'))
    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data).toEqual(detail)
    expect(result.current.error).toBeNull()
    expect(api.getProduct).toHaveBeenCalledWith('foo')
  })

  it('surfaces an error message when the fetch fails', async () => {
    vi.mocked(api.getProduct).mockRejectedValue(new Error('boom'))

    const { result } = renderHook(() => useProduct('foo'))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('boom')
    expect(result.current.data).toBeNull()
  })

  it('refetches when the slug changes', async () => {
    vi.mocked(api.getProduct).mockResolvedValueOnce(buildDetail('foo'))
    vi.mocked(api.getProduct).mockResolvedValueOnce(buildDetail('bar'))

    const { result, rerender } = renderHook(({ slug }) => useProduct(slug), {
      initialProps: { slug: 'foo' },
    })

    await waitFor(() => expect(result.current.data?.product.slug).toBe('foo'))

    rerender({ slug: 'bar' })

    await waitFor(() => expect(result.current.data?.product.slug).toBe('bar'))
    expect(api.getProduct).toHaveBeenCalledTimes(2)
  })
})
