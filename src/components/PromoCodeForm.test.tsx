import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError, applyPromoCode } from '@/lib/api'
import { PromoCodeForm } from './PromoCodeForm'

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return { ...actual, applyPromoCode: vi.fn() }
})

const applyPromoCodeMock = vi.mocked(applyPromoCode)

describe('PromoCodeForm', () => {
  it('applies a valid code and clears the input', async () => {
    const user = userEvent.setup()
    applyPromoCodeMock.mockResolvedValue({ code: 'GREEN10', kind: 'percent', value: 10 })
    const onApply = vi.fn()

    render(
      <PromoCodeForm subtotalCents={5000} applied={null} onApply={onApply} onRemove={vi.fn()} />,
    )

    await user.type(screen.getByPlaceholderText('Promo code'), 'green10')
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(applyPromoCodeMock).toHaveBeenCalledWith('green10', 5000)
    expect(onApply).toHaveBeenCalledWith({ code: 'GREEN10', kind: 'percent', value: 10 })
  })

  it('shows the server error message for an invalid code', async () => {
    const user = userEvent.setup()
    applyPromoCodeMock.mockRejectedValue(new ApiError(404, '"BOGUS" isn\'t a valid promo code'))

    render(
      <PromoCodeForm subtotalCents={5000} applied={null} onApply={vi.fn()} onRemove={vi.fn()} />,
    )

    await user.type(screen.getByPlaceholderText('Promo code'), 'BOGUS')
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(await screen.findByText('"BOGUS" isn\'t a valid promo code')).toBeInTheDocument()
  })

  it('shows a generic error for a non-ApiError failure', async () => {
    const user = userEvent.setup()
    applyPromoCodeMock.mockRejectedValue(new Error('network down'))

    render(
      <PromoCodeForm subtotalCents={5000} applied={null} onApply={vi.fn()} onRemove={vi.fn()} />,
    )

    await user.type(screen.getByPlaceholderText('Promo code'), 'GREEN10')
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(await screen.findByText('Something went wrong, try again')).toBeInTheDocument()
  })

  it('disables the apply button while the input is empty', () => {
    render(
      <PromoCodeForm subtotalCents={5000} applied={null} onApply={vi.fn()} onRemove={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled()
  })

  it('renders the applied state with a remove action', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()

    render(
      <PromoCodeForm
        subtotalCents={5000}
        applied={{ code: 'FREESHIP', kind: 'free_shipping', value: 0 }}
        onApply={vi.fn()}
        onRemove={onRemove}
      />,
    )

    expect(screen.getByText('FREESHIP applied')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Remove' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
  })
})
