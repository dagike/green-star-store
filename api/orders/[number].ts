import { getSql } from '../_db.js'
import { param } from '../_params.js'
import { toOrderResponse, type OrderRow } from '../_orders.js'
import type { ApiRequest, ApiResponse } from '../_types.js'

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const orderNumber = param(req.query, 'number')
  if (!orderNumber) {
    res.status(400).json({ error: 'Missing order number' })
    return
  }

  try {
    const sql = getSql()

    const rows = (await sql.query(
      `select order_number, email, items, address, subtotal_cents, discount_cents,
              shipping_cents, tax_cents, total_cents, status, estimated_delivery, created_at
       from orders
       where order_number = $1`,
      [orderNumber.toUpperCase()],
    )) as OrderRow[]

    const order = rows[0]
    if (!order) {
      res.status(404).json({ error: 'Order not found' })
      return
    }

    res.status(200).json(toOrderResponse(order))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load order' })
  }
}
