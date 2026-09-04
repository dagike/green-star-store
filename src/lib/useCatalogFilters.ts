import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface CatalogFilters {
  q: string | undefined
  category: string | undefined
  minPrice: number | undefined
  maxPrice: number | undefined
  minRating: number | undefined
  inStock: boolean
}

const CLEARABLE_KEYS = ['category', 'minPrice', 'maxPrice', 'minRating', 'inStock'] as const

interface UseCatalogFiltersResult {
  filters: CatalogFilters
  setFilter: (key: keyof CatalogFilters, value: string | number | boolean | undefined) => void
  clearFilters: () => void
  hasActiveFilters: boolean
}

/** Catalog filters live in the URL so they survive reload, back-nav and sharing a link. */
export function useCatalogFilters(): UseCatalogFiltersResult {
  const [searchParams, setSearchParams] = useSearchParams()
  // A stable primitive proxy for the params' content - the URLSearchParams instance
  // itself gets a new identity on every navigation, even when nothing relevant changed.
  const searchKey = searchParams.toString()

  const filters = useMemo<CatalogFilters>(() => {
    const minPriceRaw = searchParams.get('minPrice')
    const maxPriceRaw = searchParams.get('maxPrice')
    const minRatingRaw = searchParams.get('minRating')

    return {
      q: searchParams.get('q') || undefined,
      category: searchParams.get('category') || undefined,
      minPrice: minPriceRaw ? Number(minPriceRaw) : undefined,
      maxPrice: maxPriceRaw ? Number(maxPriceRaw) : undefined,
      minRating: minRatingRaw ? Number(minRatingRaw) : undefined,
      inStock: searchParams.get('inStock') === 'true',
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchKey])

  const setFilter = useCallback(
    (key: keyof CatalogFilters, value: string | number | boolean | undefined) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value === undefined || value === '' || value === false) {
            next.delete(key)
          } else {
            next.set(key, String(value))
          }
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const clearFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        for (const key of CLEARABLE_KEYS) {
          next.delete(key)
        }
        return next
      },
      { replace: true },
    )
  }, [setSearchParams])

  const hasActiveFilters =
    filters.category !== undefined ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.minRating !== undefined ||
    filters.inStock

  return { filters, setFilter, clearFilters, hasActiveFilters }
}
