import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { StepIndicator, type Step } from './StepIndicator'

const steps: readonly Step[] = [
  { key: 'shipping', label: 'Shipping' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
]

describe('StepIndicator', () => {
  it('marks the current step and disables steps beyond maxReachedIndex', () => {
    render(<StepIndicator steps={steps} currentIndex={0} maxReachedIndex={0} onSelect={vi.fn()} />)

    const shipping = screen.getByRole('button', { name: /shipping/i })
    const payment = screen.getByRole('button', { name: /payment/i })
    const review = screen.getByRole('button', { name: /review/i })

    expect(shipping).toHaveAttribute('aria-current', 'step')
    expect(shipping).toBeEnabled()
    expect(payment).toBeDisabled()
    expect(review).toBeDisabled()
  })

  it('keeps a completed step reachable and clickable', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<StepIndicator steps={steps} currentIndex={1} maxReachedIndex={1} onSelect={onSelect} />)

    const shipping = screen.getByRole('button', { name: /shipping/i })
    expect(shipping).toBeEnabled()

    await user.click(shipping)
    expect(onSelect).toHaveBeenCalledWith(0)
  })

  it('does not invoke onSelect for a step beyond maxReachedIndex', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(<StepIndicator steps={steps} currentIndex={0} maxReachedIndex={0} onSelect={onSelect} />)

    await user.click(screen.getByRole('button', { name: /review/i }))
    expect(onSelect).not.toHaveBeenCalled()
  })
})
