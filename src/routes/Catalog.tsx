import { useEffect, useMemo, useRef, useState } from 'react'
import { FilterPanel } from '@/components/FilterPanel'
import { ProductCard } from '@/components/ProductCard'
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton'
import { ProductGrid } from '@/components/ProductGrid'
import { SortSelect } from '@/components/SortSelect'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { useCatalogFilters } from '@/lib/useCatalogFilters'
import { useCategories } from '@/lib/useCategories'
import { useInfiniteProducts } from '@/lib/useInfiniteProducts'
import type { ProductListParams } from '@/types'

export function Catalog() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const { filters, setFilter, clearFilters, hasActiveFilters } = useCatalogFilters()
  const { categories, priceRange } = useCategories()

  const params = useMemo<ProductListParams>(() => ({ limit: 24, ...filters }), [filters])

  const { items, loading, loadingMore, error, hasMore, loadMore } = useInfiniteProducts(params)
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

  const filterPanelProps = {
    categories,
    priceRange,
    filters,
    onChange: setFilter,
    onClear: clearFilters,
    hasActiveFilters,
  }

  return (
    <div className="flex flex-col gap-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Shop</h1>
          <p className="text-sm text-neutral-500">Browse the full Green Star Store catalog.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            className="lg:hidden"
            onClick={() => setFiltersOpen(true)}
          >
            Filters{hasActiveFilters ? ' •' : ''}
          </Button>
          <SortSelect
            value={filters.sort}
            onChange={(sort) => setFilter('sort', sort === 'newest' ? undefined : sort)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="hidden w-64 shrink-0 lg:block">
          <FilterPanel {...filterPanelProps} />
        </aside>

        <div className="flex-1">
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
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-lg font-medium text-neutral-900">
                {hasActiveFilters ? 'No products match your filters' : 'No products found'}
              </p>
              <p className="text-sm text-neutral-500">
                {hasActiveFilters
                  ? 'Try adjusting or clearing your filters.'
                  : 'Check back later for new arrivals.'}
              </p>
              {hasActiveFilters && (
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              )}
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
      </div>

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <FilterPanel {...filterPanelProps} />
      </Drawer>
    </div>
  )
}
