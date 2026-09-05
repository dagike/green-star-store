import { useEffect, useState } from 'react'
import type { Order } from '@/types'
import { getOrder, getOrdersByEmail } from './api'

interface UseOrderResult {
  data: Order | null
  loading: boolean
  error: string | null
}

export function useOrder(orderNumber: string | undefined): UseOrderResult {
  const [data, setData] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!orderNumber) {
        setData(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const res = await getOrder(orderNumber)
        if (!cancelled) setData(res)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load order')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [orderNumber])

  return { data, loading, error }
}

interface UseOrdersResult {
  data: Order[]
  loading: boolean
  error: string | null
}

export function useOrdersByEmail(email: string | null): UseOrdersResult {
  const [data, setData] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      if (!email) {
        setData([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)
      try {
        const res = await getOrdersByEmail(email)
        if (!cancelled) setData(res)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load orders')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [email])

  return { data, loading, error }
}
