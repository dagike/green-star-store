import { Link } from 'react-router-dom'
import { QuantityPicker } from '@/components/ui/QuantityPicker'
import { formatMoney } from '@/lib/money'
import type { CartItem } from '@/types'

interface CartLineProps {
  item: CartItem
  onQuantityChange: (quantity: number) => void
  onRemove: () => void
}

export function CartLine({ item, onQuantityChange, onRemove }: CartLineProps) {
  return (
    <div className="flex gap-4 border-b border-neutral-200 py-5 last:border-b-0">
      <Link
        to={`/products/${item.slug}`}
        className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100"
      >
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
            No image
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-1">
        <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">{item.brand}</p>
        <Link
          to={`/products/${item.slug}`}
          className="text-sm font-medium text-neutral-900 hover:text-brand-700"
        >
          {item.name}
        </Link>
        {item.stock === 0 && <p className="text-xs font-medium text-red-600">Out of stock</p>}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-2">
          <QuantityPicker
            value={item.quantity}
            max={Math.max(item.stock, 1)}
            onChange={onQuantityChange}
            disabled={item.stock === 0}
          />
          <button
            type="button"
            onClick={onRemove}
            className="text-sm font-medium text-neutral-500 hover:text-red-600"
          >
            Remove
          </button>
        </div>
      </div>

      <div className="flex-shrink-0 text-right text-sm font-semibold text-neutral-900">
        {formatMoney(item.priceCents * item.quantity)}
      </div>
    </div>
  )
}
