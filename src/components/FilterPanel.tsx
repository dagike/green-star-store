import { useState } from 'react'
import type { CatalogFilters } from '@/lib/useCatalogFilters'
import type { CategoryFacet } from '@/types'
import { Input } from './ui/Input'
import { Select } from './ui/Select'

interface FilterPanelProps {
  categories: CategoryFacet[]
  priceRange: { min: number; max: number }
  filters: CatalogFilters
  onChange: (key: keyof CatalogFilters, value: string | number | boolean | undefined) => void
  onClear: () => void
  hasActiveFilters: boolean
}

const RATING_OPTIONS = [4, 3, 2, 1]

function centsToDollarsInput(cents: number | undefined): string {
  return cents === undefined ? '' : String(Math.round(cents / 100))
}

export function FilterPanel({
  categories,
  priceRange,
  filters,
  onChange,
  onClear,
  hasActiveFilters,
}: FilterPanelProps) {
  const [minPriceInput, setMinPriceInput] = useState(() => centsToDollarsInput(filters.minPrice))
  const [maxPriceInput, setMaxPriceInput] = useState(() => centsToDollarsInput(filters.maxPrice))

  // Keep the local text inputs in sync when the URL changes from elsewhere (e.g. Clear
  // all), by comparing against the previous prop during render rather than in an effect.
  const [prevMinPrice, setPrevMinPrice] = useState(filters.minPrice)
  if (filters.minPrice !== prevMinPrice) {
    setPrevMinPrice(filters.minPrice)
    setMinPriceInput(centsToDollarsInput(filters.minPrice))
  }

  const [prevMaxPrice, setPrevMaxPrice] = useState(filters.maxPrice)
  if (filters.maxPrice !== prevMaxPrice) {
    setPrevMaxPrice(filters.maxPrice)
    setMaxPriceInput(centsToDollarsInput(filters.maxPrice))
  }

  function commitMinPrice() {
    const dollars = Number(minPriceInput)
    onChange(
      'minPrice',
      minPriceInput === '' || Number.isNaN(dollars) ? undefined : Math.round(dollars * 100),
    )
  }

  function commitMaxPrice() {
    const dollars = Number(maxPriceInput)
    onChange(
      'maxPrice',
      maxPriceInput === '' || Number.isNaN(dollars) ? undefined : Math.round(dollars * 100),
    )
  }

  function blurOnEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">Filters</h2>
        <button
          type="button"
          onClick={onClear}
          disabled={!hasActiveFilters}
          className="text-xs font-medium text-brand-600 hover:text-brand-700 disabled:cursor-not-allowed disabled:text-neutral-300"
        >
          Clear all
        </button>
      </div>

      <Select
        label="Category"
        value={filters.category ?? ''}
        onChange={(event) => onChange('category', event.target.value || undefined)}
      >
        <option value="">All categories</option>
        {categories.map((category) => (
          <option key={category.category} value={category.category}>
            {category.category[0].toUpperCase() + category.category.slice(1)} ({category.count})
          </option>
        ))}
      </Select>

      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700">Price</span>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            aria-label="Minimum price"
            placeholder={priceRange.min ? String(Math.floor(priceRange.min / 100)) : 'Min'}
            value={minPriceInput}
            onChange={(event) => setMinPriceInput(event.target.value)}
            onBlur={commitMinPrice}
            onKeyDown={blurOnEnter}
            className="w-full"
          />
          <span className="text-neutral-400">–</span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            aria-label="Maximum price"
            placeholder={priceRange.max ? String(Math.ceil(priceRange.max / 100)) : 'Max'}
            value={maxPriceInput}
            onChange={(event) => setMaxPriceInput(event.target.value)}
            onBlur={commitMaxPrice}
            onKeyDown={blurOnEnter}
            className="w-full"
          />
        </div>
      </div>

      <Select
        label="Minimum rating"
        value={filters.minRating !== undefined ? String(filters.minRating) : ''}
        onChange={(event) =>
          onChange('minRating', event.target.value ? Number(event.target.value) : undefined)
        }
      >
        <option value="">Any rating</option>
        {RATING_OPTIONS.map((rating) => (
          <option key={rating} value={rating}>
            {rating}+ stars
          </option>
        ))}
      </Select>

      <label className="flex items-center gap-2 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={filters.inStock}
          onChange={(event) => onChange('inStock', event.target.checked)}
          className="h-4 w-4 rounded border-neutral-300 text-brand-600 focus:ring-brand-500/30"
        />
        In stock only
      </label>
    </div>
  )
}
