import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useCatalogFilters } from './useCatalogFilters'

function makeWrapper(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
  }
}

describe('useCatalogFilters', () => {
  it('defaults to no filters and the newest sort when the URL is bare', () => {
    const { result } = renderHook(() => useCatalogFilters(), {
      wrapper: makeWrapper('/products'),
    })

    expect(result.current.filters).toEqual({
      q: undefined,
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      inStock: false,
      sort: 'newest',
    })
    expect(result.current.hasActiveFilters).toBe(false)
  })

  it('parses every filter and the query out of the URL', () => {
    const { result } = renderHook(() => useCatalogFilters(), {
      wrapper: makeWrapper(
        '/products?q=lamp&category=home&minPrice=1000&maxPrice=5000&minRating=4&inStock=true&sort=price_asc',
      ),
    })

    expect(result.current.filters).toEqual({
      q: 'lamp',
      category: 'home',
      minPrice: 1000,
      maxPrice: 5000,
      minRating: 4,
      inStock: true,
      sort: 'price_asc',
    })
    expect(result.current.hasActiveFilters).toBe(true)
  })

  it('falls back to the default sort for an invalid sort value', () => {
    const { result } = renderHook(() => useCatalogFilters(), {
      wrapper: makeWrapper('/products?sort=bogus'),
    })

    expect(result.current.filters.sort).toBe('newest')
  })

  it('setFilter writes a param without disturbing the others', () => {
    const { result } = renderHook(() => useCatalogFilters(), {
      wrapper: makeWrapper('/products?category=home&sort=top_rated'),
    })

    act(() => {
      result.current.setFilter('minRating', 4)
    })

    expect(result.current.filters.minRating).toBe(4)
    expect(result.current.filters.category).toBe('home')
    expect(result.current.filters.sort).toBe('top_rated')
  })

  it('setFilter removes the param for undefined, empty string or false', () => {
    const { result } = renderHook(() => useCatalogFilters(), {
      wrapper: makeWrapper('/products?category=home&inStock=true'),
    })

    act(() => {
      result.current.setFilter('category', undefined)
    })
    act(() => {
      result.current.setFilter('inStock', false)
    })

    expect(result.current.filters.category).toBeUndefined()
    expect(result.current.filters.inStock).toBe(false)
  })

  it('clearFilters removes only the clearable keys, keeping q and sort', () => {
    const { result } = renderHook(() => useCatalogFilters(), {
      wrapper: makeWrapper(
        '/products?q=lamp&category=home&minPrice=1000&maxPrice=5000&minRating=4&inStock=true&sort=price_asc',
      ),
    })

    act(() => {
      result.current.clearFilters()
    })

    expect(result.current.filters).toEqual({
      q: 'lamp',
      category: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      inStock: false,
      sort: 'price_asc',
    })
    expect(result.current.hasActiveFilters).toBe(false)
  })
})
