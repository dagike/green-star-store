import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { NotFound } from './NotFound'

describe('NotFound', () => {
  it('shows a 404 message with links back into the store', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>,
    )

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()

    const shopLink = screen.getByRole('link', { name: 'Back to shop' })
    expect(shopLink).toHaveAttribute('href', '/products')

    const homeLink = screen.getByRole('link', { name: 'Go home' })
    expect(homeLink).toHaveAttribute('href', '/')
  })
})
