import { formatMoney } from '@/lib/money'
import type { Totals } from '@/lib/totals'

interface OrderSummaryProps {
  totals: Totals
  children?: React.ReactNode
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between text-sm ${muted ? 'text-neutral-500' : 'text-neutral-700'}`}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

export function OrderSummary({ totals, children }: OrderSummaryProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
      <h2 className="text-base font-semibold text-neutral-900">Order summary</h2>

      <div className="flex flex-col gap-1.5">
        <Row label="Subtotal" value={formatMoney(totals.subtotalCents)} />
        {totals.discountCents > 0 && (
          <Row label="Discount" value={`−${formatMoney(totals.discountCents)}`} />
        )}
        <Row
          label="Shipping"
          value={totals.shippingCents === 0 ? 'Free' : formatMoney(totals.shippingCents)}
          muted
        />
        <Row label="Tax" value={formatMoney(totals.taxCents)} muted />
      </div>

      <div className="flex items-center justify-between border-t border-neutral-200 pt-3 text-base font-semibold text-neutral-900">
        <span>Total</span>
        <span>{formatMoney(totals.totalCents)}</span>
      </div>

      {children}
    </div>
  )
}
