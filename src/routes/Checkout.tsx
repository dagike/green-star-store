import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { OrderSummary } from '@/components/OrderSummary'
import { StepIndicator, type Step } from '@/components/StepIndicator'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useCart } from '@/context/CartContext'
import { ApiError, createOrder } from '@/lib/api'
import { calcTotals } from '@/lib/totals'
import {
  formatCardNumberInput,
  formatExpiryInput,
  validatePayment,
  validatePaymentField,
  validateShipping,
  validateShippingField,
  type PaymentErrors,
  type PaymentInfo,
  type ShippingErrors,
  type ShippingInfo,
} from '@/lib/validation'

const STEPS: readonly Step[] = [
  { key: 'shipping', label: 'Shipping' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
]

const emptyShipping: ShippingInfo = {
  fullName: '',
  email: '',
  address1: '',
  address2: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'US',
  phone: '',
}

const emptyPayment: PaymentInfo = {
  cardName: '',
  cardNumber: '',
  expiry: '',
  cvc: '',
}

function ShippingStep({
  value,
  errors,
  onChange,
  onBlur,
  onContinue,
}: {
  value: ShippingInfo
  errors: ShippingErrors
  onChange: (value: ShippingInfo) => void
  onBlur: (key: keyof ShippingInfo) => void
  onContinue: () => void
}) {
  function set<K extends keyof ShippingInfo>(key: K, fieldValue: ShippingInfo[K]) {
    onChange({ ...value, [key]: fieldValue })
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onContinue()
      }}
    >
      <h2 className="text-lg font-semibold text-neutral-900">Shipping address</h2>
      <Input
        label="Full name"
        value={value.fullName}
        error={errors.fullName}
        onChange={(event) => set('fullName', event.target.value)}
        onBlur={() => onBlur('fullName')}
      />
      <Input
        label="Email"
        type="email"
        value={value.email}
        error={errors.email}
        onChange={(event) => set('email', event.target.value)}
        onBlur={() => onBlur('email')}
      />
      <Input
        label="Address line 1"
        value={value.address1}
        error={errors.address1}
        onChange={(event) => set('address1', event.target.value)}
        onBlur={() => onBlur('address1')}
      />
      <Input
        label="Address line 2 (optional)"
        value={value.address2}
        onChange={(event) => set('address2', event.target.value)}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="City"
          value={value.city}
          error={errors.city}
          onChange={(event) => set('city', event.target.value)}
          onBlur={() => onBlur('city')}
        />
        <Input
          label="State / province"
          value={value.state}
          error={errors.state}
          onChange={(event) => set('state', event.target.value)}
          onBlur={() => onBlur('state')}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Postal code"
          value={value.postalCode}
          error={errors.postalCode}
          onChange={(event) => set('postalCode', event.target.value)}
          onBlur={() => onBlur('postalCode')}
        />
        <Select
          label="Country"
          value={value.country}
          onChange={(event) => set('country', event.target.value)}
        >
          <option value="US">United States</option>
          <option value="CA">Canada</option>
          <option value="GB">United Kingdom</option>
        </Select>
      </div>
      <Input
        label="Phone"
        type="tel"
        value={value.phone}
        error={errors.phone}
        onChange={(event) => set('phone', event.target.value)}
        onBlur={() => onBlur('phone')}
      />

      <div className="flex justify-end pt-2">
        <Button type="submit">Continue to payment</Button>
      </div>
    </form>
  )
}

function PaymentStep({
  value,
  errors,
  onChange,
  onBlur,
  onContinue,
  onBack,
}: {
  value: PaymentInfo
  errors: PaymentErrors
  onChange: (value: PaymentInfo) => void
  onBlur: (key: keyof PaymentInfo) => void
  onContinue: () => void
  onBack: () => void
}) {
  function set<K extends keyof PaymentInfo>(key: K, fieldValue: PaymentInfo[K]) {
    onChange({ ...value, [key]: fieldValue })
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        onContinue()
      }}
    >
      <h2 className="text-lg font-semibold text-neutral-900">Payment details</h2>
      <Input
        label="Name on card"
        value={value.cardName}
        error={errors.cardName}
        onChange={(event) => set('cardName', event.target.value)}
        onBlur={() => onBlur('cardName')}
      />
      <Input
        label="Card number"
        inputMode="numeric"
        maxLength={23}
        value={value.cardNumber}
        error={errors.cardNumber}
        onChange={(event) => set('cardNumber', formatCardNumberInput(event.target.value))}
        onBlur={() => onBlur('cardNumber')}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Expiry (MM/YY)"
          placeholder="MM/YY"
          maxLength={5}
          value={value.expiry}
          error={errors.expiry}
          onChange={(event) => set('expiry', formatExpiryInput(event.target.value))}
          onBlur={() => onBlur('expiry')}
        />
        <Input
          label="CVC"
          inputMode="numeric"
          maxLength={4}
          value={value.cvc}
          error={errors.cvc}
          onChange={(event) => set('cvc', event.target.value.replace(/\D/g, ''))}
          onBlur={() => onBlur('cvc')}
        />
      </div>

      <div className="flex justify-between pt-2">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">Continue to review</Button>
      </div>
    </form>
  )
}

function ReviewStep({
  shipping,
  payment,
  placing,
  placeError,
  onBack,
  onPlaceOrder,
}: {
  shipping: ShippingInfo
  payment: PaymentInfo
  placing: boolean
  placeError: string | null
  onBack: () => void
  onPlaceOrder: () => void
}) {
  const last4 = payment.cardNumber.replace(/\D/g, '').slice(-4)

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-neutral-900">Review your order</h2>

      <div className="flex flex-col gap-1 text-sm text-neutral-700">
        <p className="font-medium text-neutral-900">Shipping to</p>
        <p>{shipping.fullName || '—'}</p>
        <p>
          {shipping.address1}
          {shipping.address2 ? `, ${shipping.address2}` : ''}
        </p>
        <p>{[shipping.city, shipping.state, shipping.postalCode].filter(Boolean).join(', ')}</p>
        <p>{shipping.country}</p>
        <p className="text-neutral-500">{shipping.email}</p>
      </div>

      <div className="flex flex-col gap-1 text-sm text-neutral-700">
        <p className="font-medium text-neutral-900">Payment</p>
        <p>•••• •••• •••• {last4 || '····'}</p>
        <p className="text-neutral-500">{payment.cardName || '—'}</p>
      </div>

      {placeError && <p className="text-sm text-red-600">{placeError}</p>}

      <div className="flex justify-between pt-2">
        <Button type="button" variant="secondary" onClick={onBack} disabled={placing}>
          Back
        </Button>
        <Button type="button" loading={placing} onClick={onPlaceOrder}>
          Place order
        </Button>
      </div>
    </div>
  )
}

export function Checkout() {
  const { items, clear } = useCart()
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [maxReachedIndex, setMaxReachedIndex] = useState(0)
  const [shipping, setShipping] = useState<ShippingInfo>(emptyShipping)
  const [payment, setPayment] = useState<PaymentInfo>(emptyPayment)
  const [shippingErrors, setShippingErrors] = useState<ShippingErrors>({})
  const [paymentErrors, setPaymentErrors] = useState<PaymentErrors>({})
  const [placing, setPlacing] = useState(false)
  const [placeError, setPlaceError] = useState<string | null>(null)

  if (items.length === 0) return <Navigate to="/cart" replace />

  const totals = calcTotals(items)

  function goToStep(index: number) {
    if (index <= maxReachedIndex) setStepIndex(index)
  }

  function goNext() {
    const next = Math.min(stepIndex + 1, STEPS.length - 1)
    setStepIndex(next)
    setMaxReachedIndex((current) => Math.max(current, next))
  }

  function goBack() {
    setStepIndex((current) => Math.max(current - 1, 0))
  }

  function handleShippingBlur(key: keyof ShippingInfo) {
    setShippingErrors((prev) => ({ ...prev, [key]: validateShippingField(key, shipping[key]) }))
  }

  function handleShippingSubmit() {
    const errors = validateShipping(shipping)
    setShippingErrors(errors)
    if (Object.keys(errors).length === 0) goNext()
  }

  function handlePaymentBlur(key: keyof PaymentInfo) {
    setPaymentErrors((prev) => ({ ...prev, [key]: validatePaymentField(key, payment[key]) }))
  }

  function handlePaymentSubmit() {
    const errors = validatePayment(payment)
    setPaymentErrors(errors)
    if (Object.keys(errors).length === 0) goNext()
  }

  async function handlePlaceOrder() {
    setPlacing(true)
    setPlaceError(null)
    try {
      const order = await createOrder({
        email: shipping.email,
        address: {
          fullName: shipping.fullName,
          address1: shipping.address1,
          address2: shipping.address2,
          city: shipping.city,
          state: shipping.state,
          postalCode: shipping.postalCode,
          country: shipping.country,
          phone: shipping.phone,
        },
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
      })
      clear()
      navigate(`/order/${order.orderNumber}`)
    } catch (err) {
      setPlaceError(err instanceof ApiError ? err.message : 'Something went wrong, try again')
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 py-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Checkout</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <StepIndicator
            steps={STEPS}
            currentIndex={stepIndex}
            maxReachedIndex={maxReachedIndex}
            onSelect={goToStep}
          />

          <div className="rounded-xl border border-neutral-200 bg-white p-6">
            {stepIndex === 0 && (
              <ShippingStep
                value={shipping}
                errors={shippingErrors}
                onChange={setShipping}
                onBlur={handleShippingBlur}
                onContinue={handleShippingSubmit}
              />
            )}
            {stepIndex === 1 && (
              <PaymentStep
                value={payment}
                errors={paymentErrors}
                onChange={setPayment}
                onBlur={handlePaymentBlur}
                onContinue={handlePaymentSubmit}
                onBack={goBack}
              />
            )}
            {stepIndex === 2 && (
              <ReviewStep
                shipping={shipping}
                payment={payment}
                placing={placing}
                placeError={placeError}
                onBack={goBack}
                onPlaceOrder={handlePlaceOrder}
              />
            )}
          </div>
        </div>

        <div className="order-first lg:order-none lg:col-span-1">
          <OrderSummary totals={totals} />
        </div>
      </div>
    </div>
  )
}
