import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'

describe('Button', () => {
  it('renders children and calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Add to cart</Button>)

    const button = screen.getByRole('button', { name: 'Add to cart' })
    await user.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('applies the danger variant class', () => {
    render(<Button variant="danger">Remove</Button>)
    expect(screen.getByRole('button', { name: 'Remove' })).toHaveClass('bg-red-600')
  })

  it('is disabled and non-interactive when the disabled prop is set', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        Sold out
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Sold out' })
    expect(button).toBeDisabled()

    await user.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('disables the button and marks it busy while loading', () => {
    render(<Button loading>Saving</Button>)
    const button = screen.getByRole('button', { name: 'Saving' })

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })
})
