import { useCallback, useEffect, useState } from 'react'
import type { ProductListParams, ProductSummary } from '@/types'
import { getProducts } from './api'

interface UseInfiniteProductsResult {
  items: ProductSummary[]
  loading: boolean
  loadingMore: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
}

export function useInfiniteProducts(params: ProductListParams): UseInfiniteProductsResult {
  // Callers typically pass a fresh object literal each render, and this hook's own state
  // updates cause re-renders too, so depending on `params` itself would refetch on every
  // settled load. A content-based key keeps the effect tied to what actually changed.
  const key = JSON.stringify(params)

  const [items, setItems] = useState<ProductSummary[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await getProducts(params)
        if (cancelled) return
        setItems(res.items)
        setCursor(res.nextCursor)
        setHasMore(res.nextCursor !== null)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load products')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- key is the intended proxy for params
  }, [key])

  const loadMore = useCallback(() => {
    if (loadingMore || loading || !hasMore || !cursor) return

    setLoadingMore(true)
    getProducts({ ...params, cursor })
      .then((res) => {
        setItems((prev) => [...prev, ...res.items])
        setCursor(res.nextCursor)
        setHasMore(res.nextCursor !== null)
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load more products')
      })
      .finally(() => setLoadingMore(false))
  }, [cursor, hasMore, loading, loadingMore, params])

  return { items, loading, loadingMore, error, hasMore, loadMore }
}
