import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { OrderSummary } from '@/components/OrderSummary'
import { StepIndicator, type Step } from '@/components/StepIndicator'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useCart } from '@/context/CartContext'
import { calcTotals } from '@/lib/totals'

const STEPS: readonly Step[] = [
  { key: 'shipping', label: 'Shipping' },
  { key: 'payment', label: 'Payment' },
  { key: 'review', label: 'Review' },
]

interface ShippingInfo {
  fullName: string
  email: string
  address1: string
  address2: string
  city: string
  state: string
  postalCode: string
  country: string
  phone: string
}

interface PaymentInfo {
  cardName: string
  cardNumber: string
  expiry: string
  cvc: string
}

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
  onChange,
  onContinue,
}: {
  value: ShippingInfo
  onChange: (value: ShippingInfo) => void
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
        onChange={(event) => set('fullName', event.target.value)}
      />
      <Input
        label="Email"
        type="email"
        value={value.email}
        onChange={(event) => set('email', event.target.value)}
      />
      <Input
        label="Address line 1"
        value={value.address1}
        onChange={(event) => set('address1', event.target.value)}
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
          onChange={(event) => set('city', event.target.value)}
        />
        <Input
          label="State / province"
          value={value.state}
          onChange={(event) => set('state', event.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Postal code"
          value={value.postalCode}
          onChange={(event) => set('postalCode', event.target.value)}
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
        onChange={(event) => set('phone', event.target.value)}
      />

      <div className="flex justify-end pt-2">
        <Button type="submit">Continue to payment</Button>
      </div>
    </form>
  )
}

function PaymentStep({
  value,
  onChange,
  onContinue,
  onBack,
}: {
  value: PaymentInfo
  onChange: (value: PaymentInfo) => void
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
        onChange={(event) => set('cardName', event.target.value)}
      />
      <Input
        label="Card number"
        inputMode="numeric"
        value={value.cardNumber}
        onChange={(event) => set('cardNumber', event.target.value)}
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Expiry (MM/YY)"
          placeholder="MM/YY"
          value={value.expiry}
          onChange={(event) => set('expiry', event.target.value)}
        />
        <Input
          label="CVC"
          inputMode="numeric"
          value={value.cvc}
          onChange={(event) => set('cvc', event.target.value)}
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
  onBack,
}: {
  shipping: ShippingInfo
  payment: PaymentInfo
  onBack: () => void
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

      <div className="flex justify-between pt-2">
        <Button type="button" variant="secondary" onClick={onBack}>
          Back
        </Button>
        {/* Order submission is wired up once the order API lands. */}
        <Button type="button">Place order</Button>
      </div>
    </div>
  )
}

export function Checkout() {
  const { items } = useCart()
  const [stepIndex, setStepIndex] = useState(0)
  const [maxReachedIndex, setMaxReachedIndex] = useState(0)
  const [shipping, setShipping] = useState<ShippingInfo>(emptyShipping)
  const [payment, setPayment] = useState<PaymentInfo>(emptyPayment)

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
              <ShippingStep value={shipping} onChange={setShipping} onContinue={goNext} />
            )}
            {stepIndex === 1 && (
              <PaymentStep
                value={payment}
                onChange={setPayment}
                onContinue={goNext}
                onBack={goBack}
              />
            )}
            {stepIndex === 2 && (
              <ReviewStep shipping={shipping} payment={payment} onBack={goBack} />
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
