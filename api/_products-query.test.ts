import { describe, expect, it } from 'vitest'
import { buildProductsQuery, sortValueForRow } from './_products-query.js'

describe('buildProductsQuery', () => {
  it('builds a query with no filters', () => {
    const { text, values } = buildProductsQuery({ sort: 'newest', limit: 24 })

    expect(text).not.toMatch(/from products\s+where/)
    expect(text).toContain('order by created_at desc, id desc')
    expect(text).toContain('limit $1')
    expect(values).toEqual([24])
  })

  it('adds a search clause matching name or brand, reusing one placeholder', () => {
    const { text, values } = buildProductsQuery({ sort: 'newest', limit: 10, q: 'watch' })

    expect(text).toContain('(name ilike $1 or brand ilike $1)')
    expect(values).toEqual(['%watch%', 10])
  })

  it('adds a category clause', () => {
    const { text, values } = buildProductsQuery({
      sort: 'newest',
      limit: 10,
      category: 'electronics',
    })

    expect(text).toContain('category = $1')
    expect(values).toEqual(['electronics', 10])
  })

  it('adds min and max price clauses', () => {
    const { text, values } = buildProductsQuery({
      sort: 'newest',
      limit: 10,
      minPrice: 1000,
      maxPrice: 5000,
    })

    expect(text).toContain('price_cents >= $1')
    expect(text).toContain('price_cents <= $2')
    expect(values).toEqual([1000, 5000, 10])
  })

  it('adds a min rating clause', () => {
    const { text, values } = buildProductsQuery({ sort: 'newest', limit: 10, minRating: 4 })

    expect(text).toContain('avg_rating >= $1')
    expect(values).toEqual([4, 10])
  })

  it('adds an in-stock clause with no placeholder when true', () => {
    const { text, values } = buildProductsQuery({ sort: 'newest', limit: 10, inStock: true })

    expect(text).toContain('stock > 0')
    expect(values).toEqual([10])
  })

  it('omits the in-stock clause when false', () => {
    const { text } = buildProductsQuery({ sort: 'newest', limit: 10, inStock: false })

    expect(text).not.toContain('stock > 0')
  })

  it('numbers placeholders in order across combined filters', () => {
    const { text, values } = buildProductsQuery({
      sort: 'newest',
      limit: 10,
      q: 'watch',
      category: 'electronics',
      minPrice: 1000,
      minRating: 4,
      inStock: true,
    })

    expect(text).toContain('(name ilike $1 or brand ilike $1)')
    expect(text).toContain('category = $2')
    expect(text).toContain('price_cents >= $3')
    expect(text).toContain('avg_rating >= $4')
    expect(text).toContain('stock > 0')
    expect(text).toContain('limit $5')
    expect(values).toEqual(['%watch%', 'electronics', 1000, 4, 10])
  })

  it('joins multiple where clauses with and', () => {
    const { text } = buildProductsQuery({
      sort: 'newest',
      limit: 10,
      category: 'electronics',
      inStock: true,
    })

    expect(text).toContain('where category = $1 and stock > 0')
  })

  it('uses > and no cast for an ascending sort cursor', () => {
    const { text, values } = buildProductsQuery({
      sort: 'price_asc',
      limit: 10,
      cursor: { sortValue: 1999, id: 30 },
    })

    expect(text).toContain('(price_cents, id) > ($1, $2)')
    expect(text).toContain('order by price_cents asc, id asc')
    expect(values).toEqual([1999, 30, 10])
  })

  it('uses < and no cast for a descending price sort cursor', () => {
    const { text, values } = buildProductsQuery({
      sort: 'price_desc',
      limit: 10,
      cursor: { sortValue: 1999, id: 30 },
    })

    expect(text).toContain('(price_cents, id) < ($1, $2)')
    expect(values).toEqual([1999, 30, 10])
  })

  it('uses < and no cast for a top_rated sort cursor', () => {
    const { text, values } = buildProductsQuery({
      sort: 'top_rated',
      limit: 10,
      cursor: { sortValue: 4.5, id: 5 },
    })

    expect(text).toContain('(avg_rating, id) < ($1, $2)')
    expect(values).toEqual([4.5, 5, 10])
  })

  it('uses < and a timestamptz cast for a newest sort cursor', () => {
    const { text, values } = buildProductsQuery({
      sort: 'newest',
      limit: 10,
      cursor: { sortValue: '2026-01-01T00:00:00.000Z', id: 5 },
    })

    expect(text).toContain('(created_at, id) < ($1::timestamptz, $2)')
    expect(values).toEqual(['2026-01-01T00:00:00.000Z', 5, 10])
  })

  it('places the cursor clause after other filters, in placeholder order', () => {
    const { text, values } = buildProductsQuery({
      sort: 'price_asc',
      limit: 10,
      category: 'electronics',
      cursor: { sortValue: 1999, id: 30 },
    })

    expect(text).toContain('category = $1')
    expect(text).toContain('(price_cents, id) > ($2, $3)')
    expect(text).toContain('limit $4')
    expect(values).toEqual(['electronics', 1999, 30, 10])
  })
})

describe('sortValueForRow', () => {
  const baseRow = {
    id: 1,
    price_cents: 2999,
    avg_rating: '4.5',
    created_at: '2026-01-01T00:00:00.000Z',
  }

  it('returns price_cents for price_asc and price_desc', () => {
    expect(sortValueForRow('price_asc', baseRow)).toBe(2999)
    expect(sortValueForRow('price_desc', baseRow)).toBe(2999)
  })

  it('returns avg_rating parsed as a number for top_rated', () => {
    expect(sortValueForRow('top_rated', baseRow)).toBe(4.5)
  })

  it('returns created_at as an ISO string for newest, from a string input', () => {
    expect(sortValueForRow('newest', baseRow)).toBe('2026-01-01T00:00:00.000Z')
  })

  it('returns created_at as an ISO string for newest, from a Date input', () => {
    const row = { ...baseRow, created_at: new Date('2026-02-15T12:30:00.000Z') }
    expect(sortValueForRow('newest', row)).toBe('2026-02-15T12:30:00.000Z')
  })
})
