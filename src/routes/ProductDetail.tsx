import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Gallery } from '@/components/Gallery'
import { RatingSummary } from '@/components/RatingSummary'
import { RelatedProducts } from '@/components/RelatedProducts'
import { ReviewList } from '@/components/ReviewList'
import { Button } from '@/components/ui/Button'
import { QuantityPicker } from '@/components/ui/QuantityPicker'
import { Skeleton } from '@/components/ui/Skeleton'
import { Stars } from '@/components/ui/Stars'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { formatMoney } from '@/lib/money'
import { useProduct } from '@/lib/useProduct'

function StockIndicator({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-red-600">
        <span className="h-2 w-2 rounded-full bg-red-600" aria-hidden="true" />
        Out of stock
      </p>
    )
  }
  if (stock <= 4) {
    return (
      <p className="flex items-center gap-1.5 text-sm font-medium text-amber-600">
        <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" />
        Only {stock} left
      </p>
    )
  }
  return (
    <p className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
      <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
      In stock
    </p>
  )
}

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
  const { show } = useToast()
  const { add } = useCart()

  // Hooks must run unconditionally before the loading/not-found early returns below,
  // so quantity state lives here rather than after `data` is confirmed.
  const [quantity, setQuantity] = useState(1)
  const [prevSlug, setPrevSlug] = useState(slug)
  if (slug !== prevSlug) {
    setPrevSlug(slug)
    setQuantity(1)
  }

  if (loading) return <ProductDetailSkeleton />
  if (error || !data) return <ProductNotFound />

  const { product, images, reviews, related } = data
  const isOnSale = product.compareAtCents !== null && product.compareAtCents > product.priceCents

  function handleAddToCart() {
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        thumbnail: images[0]?.url ?? null,
        priceCents: product.priceCents,
        compareAtCents: product.compareAtCents,
        stock: product.stock,
      },
      quantity,
    )
    show(`Added ${quantity} × ${product.name} to your cart`, 'success')
  }

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

          <div className="flex flex-col gap-3 pt-2">
            <StockIndicator stock={product.stock} />
            <div className="flex flex-wrap items-center gap-3">
              <QuantityPicker
                value={quantity}
                max={Math.max(product.stock, 1)}
                onChange={setQuantity}
                disabled={product.stock === 0}
              />
              <Button
                variant="primary"
                disabled={product.stock === 0}
                onClick={handleAddToCart}
                className="flex-1 sm:flex-none"
              >
                Add to cart
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6 border-t border-neutral-200 pt-8">
        <h2 className="text-lg font-semibold text-neutral-900">Reviews</h2>
        <RatingSummary avgRating={product.avgRating} reviews={reviews} />
        <ReviewList reviews={reviews} />
      </div>

      <RelatedProducts products={related} />
    </div>
  )
}
