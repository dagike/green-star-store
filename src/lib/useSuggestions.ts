import { useEffect, useState } from 'react'
import type { Suggestion } from '@/types'
import { getSuggestions } from './api'
import { useDebouncedValue } from './useDebouncedValue'

const MIN_QUERY_LENGTH = 2
const DEBOUNCE_MS = 200

export function useSuggestions(query: string): Suggestion[] {
  const debounced = useDebouncedValue(query.trim(), DEBOUNCE_MS)
  const [items, setItems] = useState<Suggestion[]>([])

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (debounced.length < MIN_QUERY_LENGTH) {
        setItems([])
        return
      }
      try {
        const res = await getSuggestions(debounced)
        if (!cancelled) setItems(res.items)
      } catch {
        if (!cancelled) setItems([])
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [debounced])

  return items
}
