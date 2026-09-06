import { Link, useParams } from 'react-router-dom'
import { OrderSummary } from '@/components/OrderSummary'
import { Skeleton } from '@/components/ui/Skeleton'
import { formatMoney } from '@/lib/money'
import { useOrder } from '@/lib/useOrder'

function formatDate(isoDate: string): string {
  // isoDate is expected to be a plain "YYYY-MM-DD" - slice defensively in case a date-only
  // value ever arrives with a time/zone suffix attached, so appending T00:00:00 below can't
  // produce an invalid Date and crash this page's render.
  const date = new Date(`${isoDate.slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return isoDate
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

function ConfirmationSkeleton() {
  return (
    <div className="flex flex-col gap-8 py-8">
      <Skeleton className="h-8 w-64" />
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  )
}

function OrderNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <p className="text-lg font-medium text-neutral-900">Order not found</p>
      <p className="max-w-md text-sm text-neutral-500">
        We couldn't find an order with that number. Double check the link, or view your order
        history.
      </p>
      <Link
        to="/account/orders"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        View order history
      </Link>
    </div>
  )
}

export function OrderConfirmation() {
  const { number } = useParams<{ number: string }>()
  const { data: order, loading, error } = useOrder(number)

  if (loading) return <ConfirmationSkeleton />
  if (error || !order) return <OrderNotFound />

  return (
    <div className="flex flex-col gap-8 py-8">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-emerald-600">Order confirmed</p>
        <h1 className="text-2xl font-semibold text-neutral-900">Thanks for your order!</h1>
        <p className="text-sm text-neutral-500">
          Order <span className="font-medium text-neutral-900">{order.orderNumber}</span> ·
          Estimated delivery {formatDate(order.estimatedDelivery)}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-xl border border-neutral-200 bg-white px-5">
            {order.items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 border-b border-neutral-200 py-5 last:border-b-0"
              >
                <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                  <p className="text-sm text-neutral-500">Qty {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-neutral-900">
                  {formatMoney(item.priceCents * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h2 className="mb-2 text-base font-semibold text-neutral-900">Shipping to</h2>
            <div className="flex flex-col gap-0.5 text-sm text-neutral-700">
              <p>{order.address.fullName}</p>
              <p>
                {order.address.address1}
                {order.address.address2 ? `, ${order.address.address2}` : ''}
              </p>
              <p>
                {[order.address.city, order.address.state, order.address.postalCode]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <p>{order.address.country}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <OrderSummary totals={order}>
            <Link
              to="/products"
              className="flex h-12 w-full items-center justify-center rounded-lg bg-brand-600 text-base font-medium text-white transition-colors hover:bg-brand-700"
            >
              Continue shopping
            </Link>
          </OrderSummary>
        </div>
      </div>
    </div>
  )
}
