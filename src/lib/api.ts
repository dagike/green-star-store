// Typed fetch client for the /api routes. Requests are relative (`/api/...`) so they
// go through the Vite dev proxy locally and hit the same origin in production.
import type {
  CategoriesResponse,
  ProductDetailResponse,
  ProductListParams,
  ProductListResponse,
  SuggestResponse,
} from '@/types'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(path)

  if (!res.ok) {
    const body: unknown = await res.json().catch(() => null)
    const message =
      typeof body === 'object' && body !== null && 'error' in body && typeof body.error === 'string'
        ? body.error
        : `Request failed with status ${res.status}`
    throw new ApiError(res.status, message)
  }

  return res.json() as Promise<T>
}

type QueryValue = string | number | boolean | undefined | null

function buildQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }

  const qs = search.toString()
  return qs ? `?${qs}` : ''
}

export function getProducts(params: ProductListParams = {}): Promise<ProductListResponse> {
  const qs = buildQuery({
    q: params.q,
    category: params.category,
    minPrice: params.minPrice,
    maxPrice: params.maxPrice,
    minRating: params.minRating,
    inStock: params.inStock,
    sort: params.sort,
    cursor: params.cursor,
    limit: params.limit,
  })
  return request<ProductListResponse>(`/api/products${qs}`)
}

export function getProduct(slug: string): Promise<ProductDetailResponse> {
  return request<ProductDetailResponse>(`/api/products/${encodeURIComponent(slug)}`)
}

export function getCategories(): Promise<CategoriesResponse> {
  return request<CategoriesResponse>('/api/categories')
}

export function getSuggestions(q: string): Promise<SuggestResponse> {
  return request<SuggestResponse>(`/api/suggest${buildQuery({ q })}`)
}
