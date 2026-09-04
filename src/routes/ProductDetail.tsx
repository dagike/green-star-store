import { Link, useParams } from 'react-router-dom'
import { Gallery } from '@/components/Gallery'
import { Skeleton } from '@/components/ui/Skeleton'
import { Stars } from '@/components/ui/Stars'
import { formatMoney } from '@/lib/money'
import { useProduct } from '@/lib/useProduct'

function ProductDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-8 py-8 lg:grid-cols-2">
      <Skeleton className="aspect-square w-full" />
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-3/4" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-28" />
        <Skeleton className="mt-4 h-24 w-full" />
      </div>
    </div>
  )
}

function ProductNotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <p className="text-lg font-medium text-neutral-900">Product not found</p>
      <p className="text-sm text-neutral-500">
        This product may have been removed or the link is incorrect.
      </p>
      <Link
        to="/products"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        Back to shop
      </Link>
    </div>
  )
}

export function ProductDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { data, loading, error } = useProduct(slug)

  if (loading) return <ProductDetailSkeleton />
  if (error || !data) return <ProductNotFound />

  const { product, images } = data
  const isOnSale = product.compareAtCents !== null && product.compareAtCents > product.priceCents

  return (
    <div className="flex flex-col gap-8 py-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-neutral-500">
        <Link to="/products" className="hover:text-neutral-700">
          Shop
        </Link>
        <span aria-hidden="true">/</span>
        <Link
          to={`/products?category=${encodeURIComponent(product.category)}`}
          className="capitalize hover:text-neutral-700"
        >
          {product.category}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-neutral-700">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Gallery images={images} productName={product.name} />

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
              {product.brand}
            </p>
            <h1 className="text-2xl font-semibold text-neutral-900">{product.name}</h1>
          </div>

          <Stars value={product.avgRating} count={product.reviewCount} />

          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-neutral-900">
              {formatMoney(product.priceCents)}
            </span>
            {isOnSale && product.compareAtCents !== null && (
              <span className="text-base text-neutral-400 line-through">
                {formatMoney(product.compareAtCents)}
              </span>
            )}
          </div>

          <p className="leading-relaxed text-neutral-600">{product.description}</p>
        </div>
      </div>
    </div>
  )
}
