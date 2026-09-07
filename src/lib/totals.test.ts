import { describe, expect, it } from 'vitest'
import { calcOrderTotals } from '../../api/_order-totals.js'
import type { CartItem } from '@/types'
import {
  FREE_SHIPPING_THRESHOLD_CENTS,
  SHIPPING_FLAT_CENTS,
  calcPromoDiscount,
  calcShipping,
  calcSubtotal,
  calcTax,
  calcTotals,
} from './totals'

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: 1,
    slug: 'widget',
    name: 'Widget',
    brand: 'Acme',
    thumbnail: null,
    priceCents: 1000,
    compareAtCents: null,
    stock: 10,
    quantity: 1,
    ...overrides,
  }
}

describe('calcSubtotal', () => {
  it('is zero for an empty cart', () => {
    expect(calcSubtotal([])).toBe(0)
  })

  it('sums price times quantity across lines', () => {
    const items = [
      item({ priceCents: 1000, quantity: 2 }),
      item({ productId: 2, priceCents: 2500, quantity: 1 }),
    ]
    expect(calcSubtotal(items)).toBe(1000 * 2 + 2500)
  })
})

describe('calcShipping', () => {
  it('is zero when the taxable amount is zero or negative', () => {
    expect(calcShipping(0)).toBe(0)
    expect(calcShipping(-500)).toBe(0)
  })

  it('is the flat rate below the free-shipping threshold', () => {
    expect(calcShipping(FREE_SHIPPING_THRESHOLD_CENTS - 1)).toBe(SHIPPING_FLAT_CENTS)
  })

  it('is free exactly at the threshold', () => {
    expect(calcShipping(FREE_SHIPPING_THRESHOLD_CENTS)).toBe(0)
  })

  it('is free above the threshold', () => {
    expect(calcShipping(FREE_SHIPPING_THRESHOLD_CENTS + 100)).toBe(0)
  })

  it('is free when the freeShipping flag is set, regardless of amount', () => {
    expect(calcShipping(100, true)).toBe(0)
  })
})

describe('calcTax', () => {
  it('is zero for a zero or negative taxable amount', () => {
    expect(calcTax(0)).toBe(0)
    expect(calcTax(-100)).toBe(0)
  })

  it('applies the tax rate and rounds to the nearest cent', () => {
    // 1099 * 0.08 = 87.92 -> rounds to 88
    expect(calcTax(1099)).toBe(88)
    // 1050 * 0.08 = 84 exactly
    expect(calcTax(1050)).toBe(84)
  })
})

describe('calcPromoDiscount', () => {
  it('is zero with no applied promo', () => {
    expect(calcPromoDiscount(null, 10000)).toBe(0)
  })

  it('computes a rounded percentage of the subtotal for a percent promo', () => {
    // 10% of 1999 = 199.9 -> rounds to 200
    expect(calcPromoDiscount({ code: 'GREEN10', kind: 'percent', value: 10 }, 1999)).toBe(200)
  })

  it('returns the flat value for a fixed promo', () => {
    expect(calcPromoDiscount({ code: 'SAVE5', kind: 'fixed', value: 500 }, 10000)).toBe(500)
  })

  it('contributes no discount for a free_shipping promo', () => {
    expect(calcPromoDiscount({ code: 'FREESHIP', kind: 'free_shipping', value: 0 }, 10000)).toBe(0)
  })
})

describe('calcTotals', () => {
  it('is all zero for an empty cart', () => {
    expect(calcTotals([])).toEqual({
      subtotalCents: 0,
      discountCents: 0,
      shippingCents: 0,
      taxCents: 0,
      totalCents: 0,
    })
  })

  it('adds flat shipping and tax below the free-shipping threshold', () => {
    const items = [item({ priceCents: 2000, quantity: 1 })]
    expect(calcTotals(items)).toEqual({
      subtotalCents: 2000,
      discountCents: 0,
      shippingCents: SHIPPING_FLAT_CENTS,
      taxCents: calcTax(2000),
      totalCents: 2000 + SHIPPING_FLAT_CENTS + calcTax(2000),
    })
  })

  it('waives shipping once the subtotal reaches the free-shipping threshold', () => {
    const items = [item({ priceCents: FREE_SHIPPING_THRESHOLD_CENTS, quantity: 1 })]
    const totals = calcTotals(items)
    expect(totals.shippingCents).toBe(0)
  })

  it('clamps a discount larger than the subtotal to the subtotal', () => {
    const items = [item({ priceCents: 1000, quantity: 1 })]
    const totals = calcTotals(items, 5000)
    expect(totals.discountCents).toBe(1000)
    expect(totals.taxCents).toBe(0)
    // fully discounted orders don't pay shipping either (taxable amount is zero)
    expect(totals.shippingCents).toBe(0)
    expect(totals.totalCents).toBe(0)
  })

  it('ignores a negative discount', () => {
    const items = [item({ priceCents: 1000, quantity: 1 })]
    const totals = calcTotals(items, -500)
    expect(totals.discountCents).toBe(0)
  })

  it('taxes and prices off the discounted amount, not the raw subtotal', () => {
    const items = [item({ priceCents: 10000, quantity: 1 })]
    const totals = calcTotals(items, 1000)
    expect(totals.taxCents).toBe(calcTax(9000))
  })

  it('waives shipping when the free-shipping promo flag is set even below the threshold', () => {
    const items = [item({ priceCents: 1000, quantity: 1 })]
    const totals = calcTotals(items, 0, true)
    expect(totals.shippingCents).toBe(0)
  })
})

// api/_order-totals.ts re-implements this same math for the order-placement handler (see the
// comment there on why it's duplicated rather than imported - /api is bundled separately from
// the client). These cases pin both implementations to identical output for the same inputs,
// so an edit to one that isn't mirrored in the other fails a test instead of silently letting
// the confirmation page disagree with what the server actually charged.
describe('parity with the server totals (api/_order-totals.ts)', () => {
  const cases: { subtotalCents: number; discountCents: number; freeShipping: boolean }[] = [
    { subtotalCents: 0, discountCents: 0, freeShipping: false },
    { subtotalCents: 2000, discountCents: 0, freeShipping: false },
    { subtotalCents: FREE_SHIPPING_THRESHOLD_CENTS, discountCents: 0, freeShipping: false },
    { subtotalCents: 1000, discountCents: 5000, freeShipping: false }, // discount over subtotal
    { subtotalCents: 1000, discountCents: -500, freeShipping: false }, // negative discount
    { subtotalCents: 10000, discountCents: 1000, freeShipping: false },
    { subtotalCents: 1000, discountCents: 0, freeShipping: true },
    { subtotalCents: 1099, discountCents: 0, freeShipping: false }, // rounding case from calcTax above
  ]

  it.each(cases)(
    'matches for subtotal=$subtotalCents discount=$discountCents freeShipping=$freeShipping',
    ({ subtotalCents, discountCents, freeShipping }) => {
      const items = [item({ priceCents: subtotalCents, quantity: 1 })]
      const clientTotals = calcTotals(items, discountCents, freeShipping)
      const serverTotals = calcOrderTotals(subtotalCents, discountCents, freeShipping)

      expect(serverTotals).toEqual(clientTotals)
    },
  )
})
