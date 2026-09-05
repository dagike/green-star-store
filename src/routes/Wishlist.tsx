import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { HeartIcon } from '@/components/icons'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { useWishlist } from '@/context/WishlistContext'
import { formatMoney } from '@/lib/money'

function EmptyWishlist() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <HeartIcon className="h-10 w-10 text-neutral-300" />
      <p className="text-lg font-medium text-neutral-900">Your wishlist is empty</p>
      <p className="text-sm text-neutral-500">Save products you like — they'll show up here.</p>
      <Link
        to="/products"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        Continue shopping
      </Link>
    </div>
  )
}

export function Wishlist() {
  const { items, remove } = useWishlist()
  const { add: addToCart } = useCart()
  const { show } = useToast()

  if (items.length === 0) return <EmptyWishlist />

  function handleMoveToCart(item: (typeof items)[number]) {
    addToCart(
      {
        productId: item.productId,
        slug: item.slug,
        name: item.name,
        brand: item.brand,
        thumbnail: item.thumbnail,
        priceCents: item.priceCents,
        compareAtCents: item.compareAtCents,
        stock: item.stock,
      },
      1,
    )
    remove(item.productId)
    show(`Moved ${item.name} to your cart`, 'success')
  }

  return (
    <div className="flex flex-col gap-8 py-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Your wishlist</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.productId}
            className="flex gap-4 rounded-xl border border-neutral-200 bg-white p-4"
          >
            <Link
              to={`/products/${item.slug}`}
              className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100"
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
              <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                {item.brand}
              </p>
              <Link
                to={`/products/${item.slug}`}
                className="text-sm font-medium text-neutral-900 hover:text-brand-700"
              >
                {item.name}
              </Link>
              {item.stock === 0 && <p className="text-xs font-medium text-red-600">Out of stock</p>}
              <p className="text-sm font-semibold text-neutral-900">
                {formatMoney(item.priceCents)}
              </p>

              <div className="mt-auto flex flex-wrap items-center gap-3 pt-2">
                <Button
                  size="sm"
                  disabled={item.stock === 0}
                  onClick={() => handleMoveToCart(item)}
                >
                  Move to cart
                </Button>
                <button
                  type="button"
                  onClick={() => remove(item.productId)}
                  className="text-sm font-medium text-neutral-500 hover:text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
