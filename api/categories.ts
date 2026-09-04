import { getSql } from './_db.js'
import type { ApiRequest, ApiResponse } from './_types.js'

interface CategoryRow {
  category: string
  count: string
}

interface PriceRangeRow {
  min: number | null
  max: number | null
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const sql = getSql()

    const categories = (await sql.query(
      `select category, count(*) from products group by category order by category`,
    )) as CategoryRow[]

    const priceRange = (await sql.query(
      `select min(price_cents) as min, max(price_cents) as max from products`,
    )) as PriceRangeRow[]

    res.status(200).json({
      categories: categories.map((row) => ({
        category: row.category,
        count: Number(row.count),
      })),
      priceRange: {
        min: priceRange[0]?.min ?? 0,
        max: priceRange[0]?.max ?? 0,
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load categories' })
  }
}
