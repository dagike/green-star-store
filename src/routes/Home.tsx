import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProductCard } from '@/components/ProductCard'
import { ProductCardSkeleton } from '@/components/ProductCardSkeleton'
import { ProductGrid } from '@/components/ProductGrid'
import { getProducts } from '@/lib/api'
import { useCategories } from '@/lib/useCategories'
import type { ProductSummary } from '@/types'

const categoryStyles: Record<string, string> = {
  electronics: 'from-sky-500 to-sky-700',
  apparel: 'from-rose-500 to-rose-700',
  home: 'from-amber-500 to-amber-700',
  accessories: 'from-violet-500 to-violet-700',
}

function ProductRail({
  title,
  subtitle,
  products,
  loading,
}: {
  title: string
  subtitle: string
  products: ProductSummary[]
  loading: boolean
}) {
  if (!loading && products.length === 0) return null

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
        <p className="text-sm text-neutral-500">{subtitle}</p>
      </div>
      <ProductGrid>
        {loading
          ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
          : products.map((product) => <ProductCard key={product.id} product={product} />)}
      </ProductGrid>
    </section>
  )
}

export function Home() {
  const { categories } = useCategories()
  const [featured, setFeatured] = useState<ProductSummary[]>([])
  const [newArrivals, setNewArrivals] = useState<ProductSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      try {
        const [topRated, newest] = await Promise.all([
          getProducts({ sort: 'top_rated', limit: 4 }),
          getProducts({ sort: 'newest', limit: 4 }),
        ])
        if (cancelled) return
        setFeatured(topRated.items)
        setNewArrivals(newest.items)
      } catch {
        // Home page rails are a progressive enhancement; leave them empty on failure
        // rather than blocking the rest of the page.
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-col gap-16 py-8">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-16 text-white sm:px-12 sm:py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-start gap-4">
          <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium tracking-wide uppercase">
            New season, new finds
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
            Everyday essentials, thoughtfully picked
          </h1>
          <p className="text-base text-brand-50 sm:text-lg">
            Electronics, apparel, home goods and accessories - all in one place, backed by
            straightforward pricing and real reviews.
          </p>
          <Link
            to="/products"
            className="mt-2 inline-flex h-12 items-center justify-center rounded-lg bg-white px-6 text-base font-medium text-brand-700 transition-colors hover:bg-brand-50"
          >
            Shop all products
          </Link>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-neutral-900">Shop by category</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categories.map((category) => (
              <Link
                key={category.category}
                to={`/products?category=${encodeURIComponent(category.category)}`}
                className={`flex aspect-[4/3] flex-col justify-end rounded-xl bg-gradient-to-br p-4 text-white transition-transform hover:scale-[1.02] ${
                  categoryStyles[category.category] ?? 'from-neutral-500 to-neutral-700'
                }`}
              >
                <span className="text-lg font-semibold capitalize">{category.category}</span>
                <span className="text-sm text-white/80">{category.count} items</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <ProductRail
        title="Top rated"
        subtitle="Our best-reviewed products right now"
        products={featured}
        loading={loading}
      />

      <ProductRail
        title="New arrivals"
        subtitle="Just added to the catalog"
        products={newArrivals}
        loading={loading}
      />
    </div>
  )
}
