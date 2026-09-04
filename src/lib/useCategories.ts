import { useEffect, useState } from 'react'
import type { CategoryFacet } from '@/types'
import { getCategories } from './api'

interface UseCategoriesResult {
  categories: CategoryFacet[]
  priceRange: { min: number; max: number }
  loading: boolean
}

export function useCategories(): UseCategoriesResult {
  const [categories, setCategories] = useState<CategoryFacet[]>([])
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const res = await getCategories()
        if (cancelled) return
        setCategories(res.categories)
        setPriceRange(res.priceRange)
      } catch {
        // Facets are a progressive enhancement for the filter panel; fail quietly
        // and leave the panel with empty options rather than blocking the page.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return { categories, priceRange, loading }
}
