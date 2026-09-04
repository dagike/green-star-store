import { decodeCursor, encodeCursor } from '../_cursor.js'
import { getSql } from '../_db.js'
import { numberParam, param } from '../_params.js'
import {
  buildProductsQuery,
  PRODUCT_SORTS,
  sortValueForRow,
  type ProductSort,
} from '../_products-query.js'
import type { ApiRequest, ApiResponse } from '../_types.js'

const DEFAULT_LIMIT = 24
const MAX_LIMIT = 48

function parseSort(raw: string | undefined): ProductSort {
  return PRODUCT_SORTS.includes(raw as ProductSort) ? (raw as ProductSort) : 'newest'
}

function parseLimit(raw: number | undefined): number {
  if (raw === undefined || raw <= 0) return DEFAULT_LIMIT
  return Math.min(Math.floor(raw), MAX_LIMIT)
}

interface ProductRow {
  id: number
  slug: string
  name: string
  brand: string
  category: string
  price_cents: number
  compare_at_cents: number | null
  stock: number
  avg_rating: string
  review_count: number
  created_at: string
  thumbnail: string | null
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const sort = parseSort(param(req.query, 'sort'))
    const limit = parseLimit(numberParam(req.query, 'limit'))

    const { text, values } = buildProductsQuery({
      q: param(req.query, 'q')?.trim() || undefined,
      category: param(req.query, 'category') || undefined,
      minPrice: numberParam(req.query, 'minPrice'),
      maxPrice: numberParam(req.query, 'maxPrice'),
      minRating: numberParam(req.query, 'minRating'),
      inStock: param(req.query, 'inStock') === 'true',
      sort,
      cursor: decodeCursor(param(req.query, 'cursor')),
      limit: limit + 1,
    })

    const sql = getSql()
    const rows = (await sql.query(text, values)) as ProductRow[]

    const hasMore = rows.length > limit
    const page = hasMore ? rows.slice(0, limit) : rows
    const last = page.at(-1)

    const nextCursor =
      hasMore && last ? encodeCursor({ sortValue: sortValueForRow(sort, last), id: last.id }) : null

    res.status(200).json({
      items: page.map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        brand: row.brand,
        category: row.category,
        priceCents: row.price_cents,
        compareAtCents: row.compare_at_cents,
        stock: row.stock,
        avgRating: Number(row.avg_rating),
        reviewCount: row.review_count,
        thumbnail: row.thumbnail,
      })),
      nextCursor,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load products' })
  }
}
