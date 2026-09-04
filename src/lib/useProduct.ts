import { useEffect, useState } from 'react'
import type { ProductDetailResponse } from '@/types'
import { getProduct } from './api'

interface UseProductResult {
  data: ProductDetailResponse | null
  loading: boolean
  error: string | null
}

export function useProduct(slug: string | undefined): UseProductResult {
  const [data, setData] = useState<ProductDetailResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!slug) {
        setData(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const res = await getProduct(slug)
        if (!cancelled) setData(res)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load product')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [slug])

  return { data, loading, error }
}
