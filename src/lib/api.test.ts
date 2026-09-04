import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, getCategories, getProduct, getProducts, getSuggestions } from './api'

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response
}

describe('api client', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('builds a query string from the given filters and omits empty values', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { items: [], nextCursor: null }))
    vi.stubGlobal('fetch', fetchMock)

    await getProducts({
      q: 'watch',
      category: 'electronics',
      minPrice: 1000,
      maxPrice: undefined,
      inStock: true,
      sort: 'price_asc',
    })

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toBe(
      '/api/products?q=watch&category=electronics&minPrice=1000&inStock=true&sort=price_asc',
    )
  })

  it('requests no query string when called with no params', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { items: [], nextCursor: null }))
    vi.stubGlobal('fetch', fetchMock)

    await getProducts()

    expect(fetchMock).toHaveBeenCalledWith('/api/products')
  })

  it('encodes the slug when fetching a single product', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { product: {}, images: [], reviews: [], related: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await getProduct('a slug/with-chars')

    expect(fetchMock).toHaveBeenCalledWith('/api/products/a%20slug%2Fwith-chars')
  })

  it('fetches categories without a query string', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse(200, { categories: [], priceRange: { min: 0, max: 0 } }))
    vi.stubGlobal('fetch', fetchMock)

    await getCategories()

    expect(fetchMock).toHaveBeenCalledWith('/api/categories')
  })

  it('fetches suggestions with the search term', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(200, { items: [] }))
    vi.stubGlobal('fetch', fetchMock)

    await getSuggestions('watch')

    expect(fetchMock).toHaveBeenCalledWith('/api/suggest?q=watch')
  })

  it('throws an ApiError with the server message on a non-ok response', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(404, { error: 'Product not found' }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getProduct('missing')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Product not found',
    })
  })

  it('falls back to a generic message when the error body cannot be parsed', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('not json')),
    } as unknown as Response)
    vi.stubGlobal('fetch', fetchMock)

    await expect(getProducts()).rejects.toBeInstanceOf(ApiError)
  })
})
