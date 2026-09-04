import { useId, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { SearchIcon } from './icons'

interface SearchBarProps {
  className?: string
  onSubmit?: () => void
}

export function SearchBar({ className = '', onSubmit }: SearchBarProps) {
  const [searchParams] = useSearchParams()
  const [value, setValue] = useState(searchParams.get('q') ?? '')
  const navigate = useNavigate()
  const inputId = useId()

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const trimmed = value.trim()
    navigate(trimmed ? `/products?q=${encodeURIComponent(trimmed)}` : '/products')
    onSubmit?.()
  }

  return (
    <form onSubmit={handleSubmit} className={className} role="search">
      <label htmlFor={inputId} className="sr-only">
        Search products
      </label>
      <div className="relative">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Search products…"
          className="w-full rounded-full border border-neutral-300 bg-white py-2 pr-4 pl-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none"
        />
      </div>
    </form>
  )
}
