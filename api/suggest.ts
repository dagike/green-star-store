import { getSql } from './_db.js'
import { param } from './_params.js'
import type { ApiRequest, ApiResponse } from './_types.js'

const SUGGESTION_LIMIT = 6

interface SuggestionRow {
  slug: string
  name: string
  brand: string
  category: string
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const q = param(req.query, 'q')?.trim()
  if (!q) {
    res.status(200).json({ items: [] })
    return
  }

  try {
    const sql = getSql()

    const rows = (await sql.query(
      `select slug, name, brand, category
       from products
       where name ilike $1 or brand ilike $1
       order by (name ilike $2) desc, name asc
       limit ${SUGGESTION_LIMIT}`,
      [`%${q}%`, `${q}%`],
    )) as SuggestionRow[]

    res.status(200).json({
      items: rows.map((row) => ({
        slug: row.slug,
        name: row.name,
        brand: row.brand,
        category: row.category,
      })),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load suggestions' })
  }
}
