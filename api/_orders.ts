// Shapes shared by the order-placement and order-lookup handlers.
export interface OrderAddress {
  fullName: string
  address1: string
  address2: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
}

export interface OrderItem {
  productId: number
  slug: string
  name: string
  thumbnail: string | null
  priceCents: number
  quantity: number
}

export interface OrderRow {
  order_number: string
  email: string
  items: OrderItem[]
  address: OrderAddress
  subtotal_cents: number
  discount_cents: number
  shipping_cents: number
  tax_cents: number
  total_cents: number
  status: string
  // The driver hands `date` columns back as JS Date objects, not strings - despite what
  // this type says at compile time. Normalize with toDateOnly() before this ever reaches
  // a client, or JSON.stringify will silently expand it to a full UTC timestamp.
  estimated_delivery: string | Date
  created_at: string
}

export interface OrderResponse {
  orderNumber: string
  email: string
  items: OrderItem[]
  address: OrderAddress
  subtotalCents: number
  discountCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
  status: string
  estimatedDelivery: string
  createdAt: string
}

// Postgres `date` columns arrive as a Date (midnight UTC) or, in some drivers/paths, as an
// already-plain "YYYY-MM-DD" string - normalize either shape to the plain string so callers
// never have to guess which one they got.
function toDateOnly(value: string | Date): string {
  return value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10)
}

export function toOrderResponse(row: OrderRow): OrderResponse {
  return {
    orderNumber: row.order_number,
    email: row.email,
    items: row.items,
    address: row.address,
    subtotalCents: row.subtotal_cents,
    discountCents: row.discount_cents,
    shippingCents: row.shipping_cents,
    taxCents: row.tax_cents,
    totalCents: row.total_cents,
    status: row.status,
    estimatedDelivery: toDateOnly(row.estimated_delivery),
    createdAt: row.created_at,
  }
}
