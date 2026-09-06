import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CartLine } from '@/components/CartLine'
import { OrderSummary } from '@/components/OrderSummary'
import { PromoCodeForm } from '@/components/PromoCodeForm'
import { CartIcon } from '@/components/icons'
import { useCart } from '@/context/CartContext'
import { calcPromoDiscount, calcSubtotal, calcTotals } from '@/lib/totals'
import type { PromoApplyResponse } from '@/types'

function EmptyCart() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <CartIcon className="h-10 w-10 text-neutral-300" />
      <p className="text-lg font-medium text-neutral-900">Your cart is empty</p>
      <p className="text-sm text-neutral-500">Add something you like — it'll show up here.</p>
      <Link
        to="/products"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        Continue shopping
      </Link>
    </div>
  )
}

export function Cart() {
  const { items, setQty, remove } = useCart()
  const [promo, setPromo] = useState<PromoApplyResponse | null>(null)

  if (items.length === 0) return <EmptyCart />

  const hasOutOfStock = items.some((item) => item.stock === 0)
  const subtotalCents = calcSubtotal(items)
  const totals = calcTotals(
    items,
    calcPromoDiscount(promo, subtotalCents),
    promo?.kind === 'free_shipping',
  )

  return (
    <div className="flex flex-col gap-8 py-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Your cart</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white px-5 lg:col-span-2">
          {items.map((item) => (
            <CartLine
              key={item.productId}
              item={item}
              onQuantityChange={(quantity) => setQty(item.productId, quantity)}
              onRemove={() => remove(item.productId)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-4 lg:col-span-1">
          <PromoCodeForm
            subtotalCents={subtotalCents}
            applied={promo}
            onApply={setPromo}
            onRemove={() => setPromo(null)}
          />
          <OrderSummary totals={totals}>
            {hasOutOfStock ? (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled
                  className="flex h-12 w-full cursor-not-allowed items-center justify-center rounded-lg bg-neutral-200 text-base font-medium text-neutral-500"
                >
                  Checkout
                </button>
                <p className="text-center text-xs text-red-600">
                  Remove out-of-stock items to check out
                </p>
              </div>
            ) : (
              <Link
                to="/checkout"
                className="flex h-12 w-full items-center justify-center rounded-lg bg-brand-600 text-base font-medium text-white transition-colors hover:bg-brand-700"
              >
                Checkout
              </Link>
            )}
          </OrderSummary>
        </div>
      </div>
    </div>
  )
}
