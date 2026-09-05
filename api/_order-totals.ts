// Order totals math, mirroring src/lib/totals.ts. Duplicated rather than imported since
// /api is bundled separately from the client - see the note in src/types.ts on kept-in-sync
// shapes. The server is authoritative here: it recomputes from DB prices, never client input.
export const SHIPPING_FLAT_CENTS = 599
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500
export const TAX_RATE = 0.08

export interface OrderTotals {
  subtotalCents: number
  discountCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
}

export function calcOrderTotals(
  subtotalCents: number,
  discountCents: number,
  freeShipping: boolean,
): OrderTotals {
  const clampedDiscount = Math.min(Math.max(discountCents, 0), subtotalCents)
  const taxableCents = subtotalCents - clampedDiscount
  const shippingCents =
    taxableCents <= 0 || freeShipping || taxableCents >= FREE_SHIPPING_THRESHOLD_CENTS
      ? 0
      : SHIPPING_FLAT_CENTS
  const taxCents = Math.round(Math.max(taxableCents, 0) * TAX_RATE)

  return {
    subtotalCents,
    discountCents: clampedDiscount,
    shippingCents,
    taxCents,
    totalCents: taxableCents + shippingCents + taxCents,
  }
}
