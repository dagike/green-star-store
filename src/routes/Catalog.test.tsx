import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '@/lib/api'
import { Catalog } from './Catalog'

vi.mock('@/lib/api')

class MockIntersectionObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

function renderCatalog(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Catalog />
    </MemoryRouter>,
  )
}

function byText(text: string) {
  return (_: string, element: Element | null) => element?.textContent === text
}

describe('Catalog empty states', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
    vi.mocked(api.getCategories).mockResolvedValue({
      categories: [{ category: 'electronics', count: 3 }],
      priceRange: { min: 1000, max: 5000 },
    })
  })

  it('shows a search-specific empty state with a Clear search action', async () => {
    vi.mocked(api.getProducts).mockResolvedValue({ items: [], nextCursor: null })

    renderCatalog('/products?q=zzz')

    await waitFor(() => expect(screen.getByText('No results for "zzz"')).toBeInTheDocument())
    expect(
      screen.getByText('Try a different search term or clear it to browse everything.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()
    expect(screen.getByText(byText('Results for "zzz"'))).toBeInTheDocument()
  })

  it('shows the filters empty state with a Clear filters action when there is no query', async () => {
    vi.mocked(api.getProducts).mockResolvedValue({ items: [], nextCursor: null })

    renderCatalog('/products?category=home&inStock=true')

    await waitFor(() =>
      expect(screen.getByText('No products match your filters')).toBeInTheDocument(),
    )
    expect(screen.getByText('Try adjusting or clearing your filters.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear filters' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
  })

  it('shows a plain empty state with no action when neither a query nor filters are active', async () => {
    vi.mocked(api.getProducts).mockResolvedValue({ items: [], nextCursor: null })

    renderCatalog('/products')

    await waitFor(() => expect(screen.getByText('No products found')).toBeInTheDocument())
    expect(screen.getByText('Check back later for new arrivals.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear filters' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument()
    expect(screen.queryByText(byText('Results for'))).not.toBeInTheDocument()
  })

  it('clearing the search re-fetches without the q param', async () => {
    vi.mocked(api.getProducts).mockResolvedValue({ items: [], nextCursor: null })
    const user = userEvent.setup()

    renderCatalog('/products?q=zzz&category=home')

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument(),
    )
    await user.click(screen.getByRole('button', { name: 'Clear search' }))

    await waitFor(() =>
      expect(api.getProducts).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: 'home', q: undefined }),
      ),
    )
  })
})
