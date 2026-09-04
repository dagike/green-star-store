import type { ProductSort } from '@/types'
import { Select } from './ui/Select'

interface SortSelectProps {
  value: ProductSort
  onChange: (sort: ProductSort) => void
}

const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'top_rated', label: 'Top Rated' },
]

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <Select
      aria-label="Sort products"
      value={value}
      onChange={(event) => onChange(event.target.value as ProductSort)}
      className="w-full sm:w-auto"
    >
      {SORT_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Select>
  )
}
