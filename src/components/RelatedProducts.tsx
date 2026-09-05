import { Link } from 'react-router-dom'
import { formatMoney } from '@/lib/money'
import type { RelatedProduct } from '@/types'
import { Badge } from './ui/Badge'
import { Stars } from './ui/Stars'

interface RelatedProductsProps {
  products: RelatedProduct[]
}

export function RelatedProducts({ products }: RelatedProductsProps) {
  if (products.length === 0) return null

  return (
    <div className="flex flex-col gap-4 border-t border-neutral-200 pt-8">
      <h2 className="text-lg font-semibold text-neutral-900">You may also like</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => {
          const isOnSale =
            product.compareAtCents !== null && product.compareAtCents > product.priceCents

          return (
            <Link
              key={product.slug}
              to={`/products/${product.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md"
            >
              <div className="relative aspect-square overflow-hidden bg-neutral-100">
                {product.thumbnail ? (
                  <img
                    src={product.thumbnail}
                    alt={product.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
                    No image
                  </div>
                )}
                {isOnSale && (
                  <div className="absolute top-2 right-2">
                    <Badge variant="brand">Sale</Badge>
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-1 p-3">
                <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
                  {product.brand}
                </p>
                <h3 className="line-clamp-2 text-sm font-medium text-neutral-900">
                  {product.name}
                </h3>
                <Stars value={product.avgRating} size="sm" className="mt-0.5" />
                <div className="mt-auto flex items-baseline gap-2 pt-1">
                  <span className="text-base font-semibold text-neutral-900">
                    {formatMoney(product.priceCents)}
                  </span>
                  {isOnSale && product.compareAtCents !== null && (
                    <span className="text-sm text-neutral-400 line-through">
                      {formatMoney(product.compareAtCents)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
