// Exercises the order-placement/lookup handler against a mocked _db module - no live
// database in CI, same approach as _products-query.test.ts but at the handler level since
// handleCreate's stock/promo/pricing branches aren't reachable through the pure query
// builder alone.
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSql } from '../_db.js'
import type { ApiRequest, ApiResponse } from '../_types.js'
import handler from './index.js'

vi.mock('../_db.js')

const queryMock = vi.fn()

function makeReq(method: string, options: { body?: unknown; query?: Record<string, string> } = {}) {
  return { method, body: options.body, query: options.query ?? {} } as unknown as ApiRequest
}

function makeRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(payload: unknown) {
      res.body = payload
    },
  }
  return res
}

const validAddress = {
  fullName: 'Jane Doe',
  address1: '1 Main St',
  city: 'Springfield',
  state: 'IL',
  postalCode: '62701',
  country: 'US',
  phone: '5551234567',
}

const insertedOrderRow = {
  order_number: 'GSS-ABC123',
  email: 'a@b.com',
  items: [],
  address: validAddress,
  subtotal_cents: 1000,
  discount_cents: 0,
  shipping_cents: 599,
  tax_cents: 80,
  total_cents: 1679,
  status: 'confirmed',
  estimated_delivery: '2026-01-01',
  created_at: '2026-01-01T00:00:00.000Z',
}

beforeEach(() => {
  queryMock.mockReset()
  vi.mocked(getSql).mockReturnValue({ query: queryMock } as unknown as ReturnType<typeof getSql>)
})

describe('POST /api/orders', () => {
  it('rejects an invalid email before touching the database', async () => {
    const res = makeRes()
    await handler(
      makeReq('POST', {
        body: {
          email: 'not-an-email',
          address: validAddress,
          items: [{ productId: 1, quantity: 1 }],
        },
      }),
      res as unknown as ApiResponse,
    )

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'Enter a valid email address' })
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('rejects an incomplete shipping address', async () => {
    const res = makeRes()
    await handler(
      makeReq('POST', {
        body: {
          email: 'a@b.com',
          address: { fullName: 'Jane' },
          items: [{ productId: 1, quantity: 1 }],
        },
      }),
      res as unknown as ApiResponse,
    )

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'A complete shipping address is required' })
  })

  it('rejects an empty cart', async () => {
    const res = makeRes()
    await handler(
      makeReq('POST', { body: { email: 'a@b.com', address: validAddress, items: [] } }),
      res as unknown as ApiResponse,
    )

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'Your cart is empty' })
  })

  it('rejects a product that no longer exists', async () => {
    queryMock.mockResolvedValueOnce([]) // product lookup finds nothing
    const res = makeRes()
    await handler(
      makeReq('POST', {
        body: { email: 'a@b.com', address: validAddress, items: [{ productId: 999, quantity: 1 }] },
      }),
      res as unknown as ApiResponse,
    )

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'One or more items are no longer available' })
  })

  it('rejects an out-of-stock product instead of placing the order', async () => {
    queryMock.mockResolvedValueOnce([
      { id: 1, slug: 'sold-out', name: 'Sold Out', price_cents: 1000, stock: 0, thumbnail: null },
    ])
    const res = makeRes()
    await handler(
      makeReq('POST', {
        body: { email: 'a@b.com', address: validAddress, items: [{ productId: 1, quantity: 1 }] },
      }),
      res as unknown as ApiResponse,
    )

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: 'One or more items are no longer available' })
    expect(queryMock).toHaveBeenCalledTimes(1) // never reaches the insert
  })

  it('clamps quantity to available stock rather than rejecting the whole order', async () => {
    queryMock
      .mockResolvedValueOnce([
        {
          id: 1,
          slug: 'low-stock',
          name: 'Low Stock',
          price_cents: 1000,
          stock: 2,
          thumbnail: null,
        },
      ])
      .mockResolvedValueOnce([insertedOrderRow])

    const res = makeRes()
    await handler(
      makeReq('POST', {
        body: { email: 'a@b.com', address: validAddress, items: [{ productId: 1, quantity: 5 }] },
      }),
      res as unknown as ApiResponse,
    )

    expect(res.statusCode).toBe(201)
    const [insertSql, insertValues] = queryMock.mock.calls[1] as [string, unknown[]]
    expect(insertSql).toContain('insert into orders')
    expect(JSON.parse(insertValues[2] as string)).toEqual([
      expect.objectContaining({ productId: 1, quantity: 2 }),
    ])
  })

  it('applies a valid percent promo code', async () => {
    queryMock
      .mockResolvedValueOnce([
        { id: 1, slug: 'widget', name: 'Widget', price_cents: 10000, stock: 5, thumbnail: null },
      ])
      .mockResolvedValueOnce([
        { code: 'GREEN10', kind: 'percent', value: 10, min_subtotal_cents: 0, active: true },
      ])
      .mockResolvedValueOnce([{ ...insertedOrderRow, discount_cents: 1000 }])

    const res = makeRes()
    await handler(
      makeReq('POST', {
        body: {
          email: 'a@b.com',
          address: validAddress,
          items: [{ productId: 1, quantity: 1 }],
          promoCode: 'green10',
        },
      }),
      res as unknown as ApiResponse,
    )

    expect(res.statusCode).toBe(201)
    const [, insertValues] = queryMock.mock.calls[2] as [string, unknown[]]
    expect(insertValues[5]).toBe(1000) // discount_cents param
  })

  it('rejects an invalid promo code', async () => {
    queryMock
      .mockResolvedValueOnce([
        { id: 1, slug: 'widget', name: 'Widget', price_cents: 10000, stock: 5, thumbnail: null },
      ])
      .mockResolvedValueOnce([]) // promo lookup finds nothing

    const res = makeRes()
    await handler(
      makeReq('POST', {
        body: {
          email: 'a@b.com',
          address: validAddress,
          items: [{ productId: 1, quantity: 1 }],
          promoCode: 'NOPE',
        },
      }),
      res as unknown as ApiResponse,
    )

    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ error: `"NOPE" isn't a valid promo code` })
  })
})

describe('GET /api/orders', () => {
  it('requires an email', async () => {
    const res = makeRes()
    await handler(makeReq('GET'), res as unknown as ApiResponse)

    expect(res.statusCode).toBe(400)
    expect(queryMock).not.toHaveBeenCalled()
  })

  it('returns orders for the given email', async () => {
    queryMock.mockResolvedValueOnce([insertedOrderRow])
    const res = makeRes()
    await handler(makeReq('GET', { query: { email: 'a@b.com' } }), res as unknown as ApiResponse)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual([expect.objectContaining({ orderNumber: 'GSS-ABC123' })])
  })
})

it('rejects unsupported methods', async () => {
  const res = makeRes()
  await handler(makeReq('DELETE'), res as unknown as ApiResponse)

  expect(res.statusCode).toBe(405)
})
