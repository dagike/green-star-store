// Pure totals math shared by the cart page and checkout summary. Money in, money out —
// always integer cents, no rendering here (see money.ts for formatting).
import type { CartItem, PromoApplyResponse } from '@/types'

export const SHIPPING_FLAT_CENTS = 599
export const FREE_SHIPPING_THRESHOLD_CENTS = 7500
export const TAX_RATE = 0.08

export interface Totals {
  subtotalCents: number
  discountCents: number
  shippingCents: number
  taxCents: number
  totalCents: number
}

export function calcSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0)
}

export function calcShipping(taxableCents: number, freeShipping = false): number {
  if (taxableCents <= 0) return 0
  if (freeShipping || taxableCents >= FREE_SHIPPING_THRESHOLD_CENTS) return 0
  return SHIPPING_FLAT_CENTS
}

export function calcTax(taxableCents: number): number {
  return Math.round(Math.max(taxableCents, 0) * TAX_RATE)
}

// Applied promo is kept as kind/value rather than a fixed discount amount, so the discount
// stays correct if quantities change after the code was applied (see PromoCodeForm).
export function calcPromoDiscount(promo: PromoApplyResponse | null, subtotalCents: number): number {
  if (!promo) return 0
  if (promo.kind === 'percent') return Math.round((subtotalCents * promo.value) / 100)
  if (promo.kind === 'fixed') return promo.value
  return 0
}

export function calcTotals(items: CartItem[], discountCents = 0, freeShipping = false): Totals {
  const subtotalCents = calcSubtotal(items)
  const clampedDiscount = Math.min(Math.max(discountCents, 0), subtotalCents)
  const taxableCents = subtotalCents - clampedDiscount
  const shippingCents = calcShipping(taxableCents, freeShipping)
  const taxCents = calcTax(taxableCents)
  const totalCents = taxableCents + shippingCents + taxCents

  return {
    subtotalCents,
    discountCents: clampedDiscount,
    shippingCents,
    taxCents,
    totalCents,
  }
}
