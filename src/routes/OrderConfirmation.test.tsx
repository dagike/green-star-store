import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/lib/api'
import * as api from '@/lib/api'
import type { Order } from '@/types'
import { OrderConfirmation } from './OrderConfirmation'

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return { ...actual, getOrder: vi.fn() }
})

const getOrderMock = vi.mocked(api.getOrder)

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderNumber: 'GSS-ABC123',
    email: 'jane@example.com',
    items: [
      {
        productId: 1,
        slug: 'widget',
        name: 'Widget',
        thumbnail: null,
        priceCents: 1000,
        quantity: 2,
      },
      {
        productId: 2,
        slug: 'gadget',
        name: 'Gadget',
        thumbnail: null,
        priceCents: 500,
        quantity: 1,
      },
    ],
    address: {
      fullName: 'Jane Doe',
      address1: '123 Main St',
      address2: '',
      city: 'Springfield',
      state: 'IL',
      postalCode: '62704',
      country: 'US',
      phone: '5551234567',
    },
    subtotalCents: 2500,
    discountCents: 250,
    shippingCents: 0,
    taxCents: 180,
    totalCents: 2430,
    status: 'confirmed',
    estimatedDelivery: '2026-09-10',
    createdAt: '2026-09-05T00:00:00.000Z',
    ...overrides,
  }
}

function renderConfirmation(orderNumber = 'GSS-ABC123') {
  return render(
    <MemoryRouter initialEntries={[`/order/${orderNumber}`]}>
      <Routes>
        <Route path="/order/:number" element={<OrderConfirmation />} />
        <Route path="/account/orders" element={<p>Order history</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('OrderConfirmation', () => {
  it('shows a not-found state for a missing order', async () => {
    getOrderMock.mockRejectedValue(new ApiError(404, 'Order not found'))

    renderConfirmation('GSS-NOPE99')

    expect(await screen.findByText('Order not found')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View order history' })).toHaveAttribute(
      'href',
      '/account/orders',
    )
  })

  it('renders the order number, delivery date, items, address and totals', async () => {
    getOrderMock.mockResolvedValue(buildOrder())

    renderConfirmation()

    expect(await screen.findByText('GSS-ABC123')).toBeInTheDocument()
    expect(getOrderMock).toHaveBeenCalledWith('GSS-ABC123')

    // estimatedDelivery '2026-09-10' formatted as a full weekday/month/day/year date
    expect(screen.getByText(/Thursday, September 10, 2026/)).toBeInTheDocument()

    expect(screen.getByText('Widget')).toBeInTheDocument()
    expect(screen.getByText('Qty 2')).toBeInTheDocument()
    expect(screen.getByText('$20.00')).toBeInTheDocument() // 1000 * 2 cents
    expect(screen.getByText('Gadget')).toBeInTheDocument()
    expect(screen.getByText('Qty 1')).toBeInTheDocument()

    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('123 Main St')).toBeInTheDocument()
    expect(screen.getByText('Springfield, IL, 62704')).toBeInTheDocument()

    expect(screen.getByText('$25.00')).toBeInTheDocument() // subtotal
    expect(screen.getByText('−$2.50')).toBeInTheDocument() // discount
    expect(screen.getByText('Free')).toBeInTheDocument() // shipping
    expect(screen.getByText('$1.80')).toBeInTheDocument() // tax
    expect(screen.getByText('$24.30')).toBeInTheDocument() // total

    expect(screen.getByRole('link', { name: 'Continue shopping' })).toHaveAttribute(
      'href',
      '/products',
    )
  })

  it('does not show the order details while still loading', async () => {
    let resolveOrder: (order: Order) => void = () => {}
    getOrderMock.mockReturnValue(
      new Promise((resolve) => {
        resolveOrder = resolve
      }),
    )

    renderConfirmation()

    expect(screen.queryByText('Thanks for your order!')).not.toBeInTheDocument()

    resolveOrder(buildOrder())
    await waitFor(() => expect(screen.getByText('Thanks for your order!')).toBeInTheDocument())
  })
})
