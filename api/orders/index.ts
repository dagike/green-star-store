// Creates an order (POST) and lists a shopper's past orders by email (GET). Prices are
// never trusted from the client - only product ids and quantities are taken from the
// request; everything money-related is re-read from the database and recomputed here
// (see _order-totals.ts), the same way promo.ts re-validates codes against the DB rather
// than trusting an applied discount amount.
import { randomInt } from 'node:crypto'
import { param } from '../_params.js'
import { getSql } from '../_db.js'
import { calcOrderTotals } from '../_order-totals.js'
import { toOrderResponse, type OrderAddress, type OrderItem, type OrderRow } from '../_orders.js'
import type { ApiRequest, ApiResponse } from '../_types.js'

const ORDER_NUMBER_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I - avoids ambiguity

function generateOrderNumber(): string {
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += ORDER_NUMBER_CHARS[randomInt(ORDER_NUMBER_CHARS.length)]
  }
  return `GSS-${suffix}`
}

function estimatedDeliveryDate(): string {
  const date = new Date()
  date.setDate(date.getDate() + 5)
  return date.toISOString().slice(0, 10)
}

const REQUIRED_ADDRESS_FIELDS = [
  'fullName',
  'address1',
  'city',
  'state',
  'postalCode',
  'country',
  'phone',
] as const

function parseAddress(raw: unknown): OrderAddress | null {
  if (typeof raw !== 'object' || raw === null) return null
  const record = raw as Record<string, unknown>

  for (const field of REQUIRED_ADDRESS_FIELDS) {
    if (typeof record[field] !== 'string' || (record[field] as string).trim() === '') return null
  }

  return {
    fullName: (record.fullName as string).trim(),
    address1: (record.address1 as string).trim(),
    address2: typeof record.address2 === 'string' ? record.address2.trim() : '',
    city: (record.city as string).trim(),
    state: (record.state as string).trim(),
    postalCode: (record.postalCode as string).trim(),
    country: (record.country as string).trim(),
    phone: (record.phone as string).trim(),
  }
}

function parseItems(raw: unknown): { productId: number; quantity: number }[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null

  const items: { productId: number; quantity: number }[] = []
  for (const entry of raw) {
    if (typeof entry !== 'object' || entry === null) return null
    const { productId, quantity } = entry as Record<string, unknown>
    if (typeof productId !== 'number' || !Number.isInteger(productId) || productId <= 0) return null
    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) return null
    items.push({ productId, quantity })
  }
  return items
}

interface ProductPriceRow {
  id: number
  slug: string
  name: string
  price_cents: number
  stock: number
  thumbnail: string | null
}

interface PromoRow {
  code: string
  kind: 'percent' | 'fixed' | 'free_shipping'
  value: number
  min_subtotal_cents: number
  active: boolean
}

function isUniqueViolation(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === '23505'
}

async function handleList(req: ApiRequest, res: ApiResponse) {
  const email = (param(req.query, 'email') ?? '').trim()
  if (!email) {
    res.status(400).json({ error: 'Enter an email address' })
    return
  }

  try {
    const sql = getSql()
    const rows = (await sql.query(
      `select order_number, email, items, address, subtotal_cents, discount_cents,
              shipping_cents, tax_cents, total_cents, status, estimated_delivery, created_at
       from orders
       where lower(email) = lower($1)
       order by created_at desc`,
      [email],
    )) as OrderRow[]

    res.status(200).json(rows.map(toOrderResponse))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to load orders' })
  }
}

async function handleCreate(req: ApiRequest, res: ApiResponse) {
  const body = (req.body ?? {}) as Record<string, unknown>
  const email = typeof body.email === 'string' ? body.email.trim() : ''
  const address = parseAddress(body.address)
  const requestedItems = parseItems(body.items)
  const promoCode = typeof body.promoCode === 'string' ? body.promoCode.trim().toUpperCase() : ''

  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'Enter a valid email address' })
    return
  }
  if (!address) {
    res.status(400).json({ error: 'A complete shipping address is required' })
    return
  }
  if (!requestedItems) {
    res.status(400).json({ error: 'Your cart is empty' })
    return
  }

  try {
    const sql = getSql()

    const ids = requestedItems.map((item) => item.productId)
    const placeholders = ids.map((_, index) => `$${index + 1}`).join(', ')
    const products = (await sql.query(
      `select id, slug, name, price_cents, stock,
              (select url from product_images pi where pi.product_id = p.id
                order by position limit 1) as thumbnail
       from products p
       where id in (${placeholders})`,
      ids,
    )) as ProductPriceRow[]

    const productById = new Map(products.map((product) => [product.id, product]))
    const orderItems: OrderItem[] = []
    for (const requested of requestedItems) {
      const product = productById.get(requested.productId)
      if (!product) {
        res.status(400).json({ error: 'One or more items are no longer available' })
        return
      }
      if (product.stock <= 0) {
        res.status(400).json({ error: 'One or more items are no longer available' })
        return
      }
      orderItems.push({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        thumbnail: product.thumbnail,
        priceCents: product.price_cents,
        quantity: Math.min(Math.max(requested.quantity, 1), product.stock),
      })
    }

    const subtotalCents = orderItems.reduce((sum, item) => sum + item.priceCents * item.quantity, 0)

    let discountCents = 0
    let freeShipping = false
    if (promoCode) {
      const promoRows = (await sql.query(
        `select code, kind, value, min_subtotal_cents, active from promo_codes where code = $1`,
        [promoCode],
      )) as PromoRow[]
      const promo = promoRows[0]

      if (!promo || !promo.active || subtotalCents < promo.min_subtotal_cents) {
        res.status(400).json({ error: `"${promoCode}" isn't a valid promo code` })
        return
      }
      if (promo.kind === 'percent') discountCents = Math.round((subtotalCents * promo.value) / 100)
      else if (promo.kind === 'fixed') discountCents = promo.value
      else if (promo.kind === 'free_shipping') freeShipping = true
    }

    const totals = calcOrderTotals(subtotalCents, discountCents, freeShipping)
    const estimatedDelivery = estimatedDeliveryDate()

    let orderNumber = generateOrderNumber()
    let inserted: OrderRow | undefined
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const result = (await sql.query(
          `insert into orders
             (order_number, email, items, address, subtotal_cents, discount_cents,
              shipping_cents, tax_cents, total_cents, estimated_delivery)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
           returning order_number, email, items, address, subtotal_cents, discount_cents,
                     shipping_cents, tax_cents, total_cents, status, estimated_delivery, created_at`,
          [
            orderNumber,
            email,
            JSON.stringify(orderItems),
            JSON.stringify(address),
            totals.subtotalCents,
            totals.discountCents,
            totals.shippingCents,
            totals.taxCents,
            totals.totalCents,
            estimatedDelivery,
          ],
        )) as OrderRow[]
        inserted = result[0]
        break
      } catch (err) {
        if (isUniqueViolation(err) && attempt < 4) {
          orderNumber = generateOrderNumber()
          continue
        }
        throw err
      }
    }

    if (!inserted) {
      res.status(500).json({ error: 'Failed to place order' })
      return
    }

    res.status(201).json(toOrderResponse(inserted))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to place order' })
  }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method === 'GET') return handleList(req, res)
  if (req.method === 'POST') return handleCreate(req, res)
  res.status(405).json({ error: 'Method not allowed' })
}
