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
  estimated_delivery: string
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
    estimatedDelivery: row.estimated_delivery,
    createdAt: row.created_at,
  }
}
