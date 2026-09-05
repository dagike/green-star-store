import { Link } from 'react-router-dom'
import { formatMoney } from '@/lib/money'
import type { ProductSummary } from '@/types'
import { Badge } from './ui/Badge'
import { Stars } from './ui/Stars'
import { WishlistButton } from './WishlistButton'

interface ProductCardProps {
  product: ProductSummary
}

export function ProductCard({ product }: ProductCardProps) {
  const {
    slug,
    name,
    brand,
    thumbnail,
    priceCents,
    compareAtCents,
    stock,
    avgRating,
    reviewCount,
  } = product

  const isOutOfStock = stock === 0
  const isLowStock = stock > 0 && stock <= 4
  const isOnSale = compareAtCents !== null && compareAtCents > priceCents

  return (
    <Link
      to={`/products/${slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square overflow-hidden bg-neutral-100">
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={name}
            loading="lazy"
            className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isOutOfStock ? 'opacity-60 grayscale' : ''
            }`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
            No image
          </div>
        )}

        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {isOutOfStock && <Badge variant="danger">Out of stock</Badge>}
          {!isOutOfStock && isLowStock && <Badge variant="warning">Only {stock} left</Badge>}
        </div>

        <div className="absolute right-2 top-2 flex flex-col items-end gap-1">
          <WishlistButton
            item={{
              productId: product.id,
              slug,
              name,
              brand,
              thumbnail,
              priceCents,
              compareAtCents,
              stock,
            }}
          />
          {isOnSale && !isOutOfStock && <Badge variant="brand">Sale</Badge>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">{brand}</p>
        <h3 className="line-clamp-2 text-sm font-medium text-neutral-900">{name}</h3>
        <Stars value={avgRating} count={reviewCount} size="sm" className="mt-0.5" />
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="text-base font-semibold text-neutral-900">
            {formatMoney(priceCents)}
          </span>
          {isOnSale && compareAtCents !== null && (
            <span className="text-sm text-neutral-400 line-through">
              {formatMoney(compareAtCents)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
