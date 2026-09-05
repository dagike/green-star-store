// Validates a promo code against the seeded promo_codes table. Only checks the code and
// returns its kind/value - the client recomputes the actual discount against the live cart
// subtotal (see PromoCodeForm/Cart), so an applied code stays correct as quantities change.
import { getSql } from './_db.js'
import type { ApiRequest, ApiResponse } from './_types.js'

interface PromoRow {
  code: string
  kind: 'percent' | 'fixed' | 'free_shipping'
  value: number
  min_subtotal_cents: number
  active: boolean
}

interface PromoRequestBody {
  code?: unknown
  subtotalCents?: unknown
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const body = (req.body ?? {}) as PromoRequestBody
  const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : ''
  const subtotalCents =
    typeof body.subtotalCents === 'number' && Number.isFinite(body.subtotalCents)
      ? Math.max(body.subtotalCents, 0)
      : 0

  if (!code) {
    res.status(400).json({ error: 'Enter a promo code' })
    return
  }

  try {
    const sql = getSql()

    const rows = (await sql.query(
      `select code, kind, value, min_subtotal_cents, active from promo_codes where code = $1`,
      [code],
    )) as PromoRow[]
    const promo = rows[0]

    if (!promo) {
      res.status(404).json({ error: `"${code}" isn't a valid promo code` })
      return
    }

    if (!promo.active) {
      res.status(400).json({ error: `"${code}" has expired` })
      return
    }

    if (subtotalCents < promo.min_subtotal_cents) {
      const minDollars = (promo.min_subtotal_cents / 100).toFixed(2)
      res.status(400).json({ error: `"${code}" requires a $${minDollars} minimum order` })
      return
    }

    res.status(200).json({
      code: promo.code,
      kind: promo.kind,
      value: promo.value,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to validate promo code' })
  }
}
