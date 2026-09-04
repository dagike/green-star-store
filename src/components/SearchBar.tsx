import { useId, useRef, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useOnClickOutside } from '@/hooks/useOnClickOutside'
import { useSuggestions } from '@/lib/useSuggestions'
import { SearchIcon } from './icons'

interface SearchBarProps {
  className?: string
  onSubmit?: () => void
}

export function SearchBar({ className = '', onSubmit }: SearchBarProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const inputId = useId()
  const listboxId = useId()
  const containerRef = useRef<HTMLDivElement>(null)

  const currentQuery = searchParams.get('q') ?? ''
  const [value, setValue] = useState(currentQuery)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  // Keep the input in sync when `q` changes from elsewhere (nav, clear filters, back
  // button), by comparing against the previous value during render rather than in an effect.
  const [prevQuery, setPrevQuery] = useState(currentQuery)
  if (currentQuery !== prevQuery) {
    setPrevQuery(currentQuery)
    setValue(currentQuery)
  }

  const suggestions = useSuggestions(open ? value : '')

  const closeDropdown = () => {
    setOpen(false)
    setActiveIndex(-1)
  }

  useOnClickOutside(containerRef, closeDropdown)

  function goToResults(query: string) {
    const trimmed = query.trim()
    const onCatalog = location.pathname === '/products'
    const next = onCatalog ? new URLSearchParams(searchParams) : new URLSearchParams()
    if (trimmed) next.set('q', trimmed)
    else next.delete('q')

    if (onCatalog) {
      setSearchParams(next)
    } else {
      const qs = next.toString()
      navigate(`/products${qs ? `?${qs}` : ''}`)
    }
    closeDropdown()
    onSubmit?.()
  }

  function goToProduct(slug: string) {
    navigate(`/products/${slug}`)
    closeDropdown()
    onSubmit?.()
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const selected = open && activeIndex >= 0 ? suggestions[activeIndex] : undefined
    if (selected) goToProduct(selected.slug)
    else goToResults(value)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      if (suggestions.length === 0) return
      event.preventDefault()
      setOpen(true)
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1))
    } else if (event.key === 'ArrowUp') {
      if (suggestions.length === 0) return
      event.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, -1))
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      closeDropdown()
    }
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} role="search">
        <label htmlFor={inputId} className="sr-only">
          Search products
        </label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            id={inputId}
            type="search"
            role="combobox"
            aria-expanded={open && suggestions.length > 0}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
            }
            value={value}
            onChange={(event) => {
              const next = event.target.value
              setValue(next)
              setActiveIndex(-1)
              setOpen(next.trim().length > 0)
            }}
            onFocus={() => {
              if (value.trim()) setOpen(true)
            }}
            onBlur={closeDropdown}
            onKeyDown={handleKeyDown}
            placeholder="Search products…"
            autoComplete="off"
            className="w-full rounded-full border border-neutral-300 bg-white py-2 pr-4 pl-9 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none"
          />
        </div>
      </form>

      {open && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.slug}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => goToProduct(suggestion.slug)}
                className={`flex w-full flex-col items-start px-3 py-2 text-left text-sm ${
                  index === activeIndex ? 'bg-brand-50' : 'hover:bg-neutral-50'
                }`}
              >
                <span className="font-medium text-neutral-900">{suggestion.name}</span>
                <span className="text-xs text-neutral-500">
                  {suggestion.brand} · {suggestion.category}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
