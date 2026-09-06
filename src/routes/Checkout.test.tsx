import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CartProvider } from '@/context/CartContext'
import * as api from '@/lib/api'
import { ApiError } from '@/lib/api'
import type { CartItem, Order } from '@/types'
import { Checkout } from './Checkout'

vi.mock('@/lib/api', async () => {
  const actual = await vi.importActual<typeof import('@/lib/api')>('@/lib/api')
  return { ...actual, createOrder: vi.fn() }
})

const createOrderMock = vi.mocked(api.createOrder)

function cartItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    productId: 1,
    slug: 'widget',
    name: 'Widget',
    brand: 'Acme',
    thumbnail: null,
    priceCents: 1000,
    compareAtCents: null,
    stock: 10,
    quantity: 1,
    ...overrides,
  }
}

function seedCart(items: CartItem[]) {
  localStorage.setItem('gss:cart', JSON.stringify(items))
}

// Step-indicator buttons and the form's "Continue to X" submit button both mention the
// next step's name, so scope step-indicator lookups to its <ol> to avoid ambiguous matches.
function stepButton(name: RegExp) {
  return within(screen.getByRole('list')).getByRole('button', { name })
}

function renderCheckout() {
  return render(
    <MemoryRouter initialEntries={['/checkout']}>
      <CartProvider>
        <Routes>
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/cart" element={<p>Your cart</p>} />
          <Route path="/order/:number" element={<p>Order confirmation</p>} />
        </Routes>
      </CartProvider>
    </MemoryRouter>,
  )
}

async function fillShipping(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Full name'), 'Jane Doe')
  await user.type(screen.getByLabelText('Email'), 'jane@example.com')
  await user.type(screen.getByLabelText('Address line 1'), '123 Main St')
  await user.type(screen.getByLabelText('City'), 'Springfield')
  await user.type(screen.getByLabelText('State / province'), 'IL')
  await user.type(screen.getByLabelText('Postal code'), '62704')
  await user.type(screen.getByLabelText('Phone'), '5551234567')
  await user.click(screen.getByRole('button', { name: 'Continue to payment' }))
}

async function fillPayment(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Name on card'), 'Jane Doe')
  await user.type(screen.getByLabelText('Card number'), '4111111111111111')
  await user.type(screen.getByLabelText('Expiry (MM/YY)'), '1230')
  await user.type(screen.getByLabelText('CVC'), '123')
  await user.click(screen.getByRole('button', { name: 'Continue to review' }))
}

function buildOrder(overrides: Partial<Order> = {}): Order {
  return {
    orderNumber: 'GSS-ABC123',
    email: 'jane@example.com',
    items: [],
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
    subtotalCents: 1000,
    discountCents: 0,
    shippingCents: 599,
    taxCents: 80,
    totalCents: 1679,
    status: 'confirmed',
    estimatedDelivery: '2026-09-10',
    createdAt: '2026-09-05T00:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  localStorage.clear()
  vi.clearAllMocks()
})

describe('Checkout', () => {
  it('redirects to the cart when the cart is empty', () => {
    renderCheckout()
    expect(screen.getByText('Your cart')).toBeInTheDocument()
  })

  it('blocks jumping ahead to a step beyond the furthest one reached', () => {
    seedCart([cartItem()])
    renderCheckout()

    expect(stepButton(/payment/i)).toBeDisabled()
    expect(stepButton(/review/i)).toBeDisabled()
  })

  it('shows field errors and stays on shipping when required fields are missing', async () => {
    const user = userEvent.setup()
    seedCart([cartItem()])
    renderCheckout()

    await user.click(screen.getByRole('button', { name: 'Continue to payment' }))

    expect(await screen.findByText('Full name is required')).toBeInTheDocument()
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.queryByLabelText('Name on card')).not.toBeInTheDocument()
  })

  it('advances to payment once shipping is valid, and back is still reachable', async () => {
    const user = userEvent.setup()
    seedCart([cartItem()])
    renderCheckout()

    await fillShipping(user)

    expect(screen.getByLabelText('Name on card')).toBeInTheDocument()
    expect(stepButton(/shipping/i)).toBeEnabled()
    expect(stepButton(/review/i)).toBeDisabled()
  })

  it('rejects an invalid card number on the payment step', async () => {
    const user = userEvent.setup()
    seedCart([cartItem()])
    renderCheckout()

    await fillShipping(user)
    await user.type(screen.getByLabelText('Name on card'), 'Jane Doe')
    await user.type(screen.getByLabelText('Card number'), '4111111111111112')
    await user.type(screen.getByLabelText('Expiry (MM/YY)'), '1230')
    await user.type(screen.getByLabelText('CVC'), '123')
    await user.click(screen.getByRole('button', { name: 'Continue to review' }))

    expect(await screen.findByText('Enter a valid card number')).toBeInTheDocument()
    expect(screen.queryByText('Review your order')).not.toBeInTheDocument()
  })

  it('places an order with only email, address and item ids/quantities - never card data', async () => {
    const user = userEvent.setup()
    seedCart([cartItem({ productId: 1, quantity: 2 }), cartItem({ productId: 2, quantity: 1 })])
    createOrderMock.mockResolvedValue(buildOrder())
    renderCheckout()

    await fillShipping(user)
    await fillPayment(user)

    expect(await screen.findByText('Review your order')).toBeInTheDocument()
    expect(screen.getByText('•••• •••• •••• 1111')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Place order' }))

    await waitFor(() => expect(createOrderMock).toHaveBeenCalledTimes(1))
    const payload = createOrderMock.mock.calls[0][0]
    expect(payload).toEqual({
      email: 'jane@example.com',
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
      items: [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ],
    })
    expect(payload).not.toHaveProperty('cardNumber')

    await waitFor(() => expect(screen.getByText('Order confirmation')).toBeInTheDocument())
    expect(localStorage.getItem('gss:cart')).toBe('[]')
  })

  it('shows a server error and keeps the cart when order placement fails', async () => {
    const user = userEvent.setup()
    seedCart([cartItem()])
    createOrderMock.mockRejectedValue(
      new ApiError(400, 'One or more items are no longer available'),
    )
    renderCheckout()

    await fillShipping(user)
    await fillPayment(user)
    await user.click(screen.getByRole('button', { name: 'Place order' }))

    expect(await screen.findByText('One or more items are no longer available')).toBeInTheDocument()
    expect(screen.getByText('Review your order')).toBeInTheDocument()
    expect(localStorage.getItem('gss:cart')).not.toBe('[]')
  })
})
