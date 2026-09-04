// Pure SQL builder for GET /api/products. Kept free of any DB or HTTP dependency so
// it can be unit tested directly against expected SQL/params.
import type { Cursor } from './_cursor.js'

export type ProductSort = 'price_asc' | 'price_desc' | 'newest' | 'top_rated'

export const PRODUCT_SORTS: ProductSort[] = ['price_asc', 'price_desc', 'newest', 'top_rated']

export interface ProductListParams {
  q?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  minRating?: number
  inStock?: boolean
  sort: ProductSort
  cursor?: Cursor | null
  limit: number
}

interface SortDef {
  column: string
  direction: 'asc' | 'desc'
  cast: string
}

const SORTS: Record<ProductSort, SortDef> = {
  price_asc: { column: 'price_cents', direction: 'asc', cast: '' },
  price_desc: { column: 'price_cents', direction: 'desc', cast: '' },
  newest: { column: 'created_at', direction: 'desc', cast: '::timestamptz' },
  top_rated: { column: 'avg_rating', direction: 'desc', cast: '' },
}

export interface SqlQuery {
  text: string
  values: unknown[]
}

export function buildProductsQuery(params: ProductListParams): SqlQuery {
  const { column, direction, cast } = SORTS[params.sort]
  const values: unknown[] = []
  const where: string[] = []

  if (params.q) {
    values.push(`%${params.q}%`)
    where.push(`(name ilike $${values.length} or brand ilike $${values.length})`)
  }
  if (params.category) {
    values.push(params.category)
    where.push(`category = $${values.length}`)
  }
  if (params.minPrice !== undefined) {
    values.push(params.minPrice)
    where.push(`price_cents >= $${values.length}`)
  }
  if (params.maxPrice !== undefined) {
    values.push(params.maxPrice)
    where.push(`price_cents <= $${values.length}`)
  }
  if (params.minRating !== undefined) {
    values.push(params.minRating)
    where.push(`avg_rating >= $${values.length}`)
  }
  if (params.inStock) {
    where.push(`stock > 0`)
  }
  if (params.cursor) {
    values.push(params.cursor.sortValue, params.cursor.id)
    const op = direction === 'asc' ? '>' : '<'
    where.push(`(${column}, id) ${op} ($${values.length - 1}${cast}, $${values.length})`)
  }

  const whereSql = where.length > 0 ? `where ${where.join(' and ')}` : ''
  values.push(params.limit)

  const text = `
    select
      id, slug, name, brand, category, price_cents, compare_at_cents, stock,
      avg_rating, review_count, created_at,
      (select url from product_images pi where pi.product_id = products.id
        order by position limit 1) as thumbnail
    from products
    ${whereSql}
    order by ${column} ${direction}, id ${direction}
    limit $${values.length}
  `.trim()

  return { text, values }
}

export interface ProductSortRow {
  id: number
  price_cents: number
  avg_rating: string | number
  created_at: string | Date
}

export function sortValueForRow(sort: ProductSort, row: ProductSortRow): string | number {
  switch (sort) {
    case 'price_asc':
    case 'price_desc':
      return row.price_cents
    case 'newest':
      return new Date(row.created_at).toISOString()
    case 'top_rated':
      return Number(row.avg_rating)
  }
}
