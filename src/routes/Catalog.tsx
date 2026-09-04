import { useEffect, useRef } from 'react'
import { ProductCard } from '@/components/ProductCard'
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton'
import { ProductGrid } from '@/components/ProductGrid'
import { useInfiniteProducts } from '@/lib/useInfiniteProducts'
import type { ProductListParams } from '@/types'

// Static for now - filters, sort and search wire into this in later commits.
const DEFAULT_PARAMS: ProductListParams = { sort: 'newest', limit: 24 }

export function Catalog() {
  const { items, loading, loadingMore, error, hasMore, loadMore } =
    useInfiniteProducts(DEFAULT_PARAMS)
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '200px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="flex flex-col gap-6 py-8">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Shop</h1>
        <p className="text-sm text-neutral-500">Browse the full Green Star Store catalog.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {!error && loading && (
        <ProductGrid>
          {Array.from({ length: 8 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </ProductGrid>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-center">
          <p className="text-lg font-medium text-neutral-900">No products found</p>
          <p className="text-sm text-neutral-500">
            Try adjusting your filters or check back later.
          </p>
        </div>
      )}

      {!loading && items.length > 0 && (
        <ProductGrid>
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
          {loadingMore &&
            Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={`more-${i}`} />)}
        </ProductGrid>
      )}

      {hasMore && <div ref={sentinelRef} aria-hidden="true" className="h-1" />}
    </div>
  )
}
