import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/context/AuthContext'
import { formatMoney } from '@/lib/money'
import { useOrdersByEmail } from '@/lib/useOrder'
import { isRequired, isValidEmail } from '@/lib/validation'

function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(isoDate))
}

function SignInForm() {
  const { signIn } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const nextErrors: { name?: string; email?: string } = {}
    if (!isRequired(name)) nextErrors.name = 'Enter your name'
    if (!isValidEmail(email)) nextErrors.email = 'Enter a valid email address'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length === 0) signIn({ name: name.trim(), email: email.trim() })
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 py-16">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold text-neutral-900">Sign in</h1>
        <p className="text-sm text-neutral-500">
          This is a mock sign-in — enter any name and the email you used at checkout to see your
          orders.
        </p>
      </div>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <Input
          label="Name"
          value={name}
          error={errors.name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          label="Email"
          type="email"
          value={email}
          error={errors.email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Button type="submit">Sign in</Button>
      </form>
    </div>
  )
}

function OrdersSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-24 w-full" />
    </div>
  )
}

function EmptyOrders() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <p className="text-lg font-medium text-neutral-900">No orders yet</p>
      <p className="text-sm text-neutral-500">Orders placed with this email will show up here.</p>
      <Link
        to="/products"
        className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
      >
        Continue shopping
      </Link>
    </div>
  )
}

function SignedInOrders() {
  const { user, signOut } = useAuth()
  const { data: orders, loading, error } = useOrdersByEmail(user?.email ?? null)

  return (
    <div className="flex flex-col gap-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Your orders</h1>
          <p className="text-sm text-neutral-500">
            Signed in as {user?.name} ({user?.email})
          </p>
        </div>
        <button
          type="button"
          onClick={signOut}
          className="text-sm font-medium text-neutral-500 hover:text-brand-700"
        >
          Sign out
        </button>
      </div>

      {loading && <OrdersSkeleton />}
      {!loading && error && <p className="text-sm text-red-600">{error}</p>}
      {!loading && !error && orders.length === 0 && <EmptyOrders />}
      {!loading && !error && orders.length > 0 && (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <Link
              key={order.orderNumber}
              to={`/order/${order.orderNumber}`}
              className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 transition-colors hover:border-brand-300 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-neutral-900">{order.orderNumber}</p>
                <p className="text-sm text-neutral-500">
                  Placed {formatDate(order.createdAt)} · {order.items.length}{' '}
                  {order.items.length === 1 ? 'item' : 'items'}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 capitalize">
                  {order.status}
                </span>
                <span className="text-sm font-semibold text-neutral-900">
                  {formatMoney(order.totalCents)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function AccountOrders() {
  const { user } = useAuth()
  return user ? <SignedInOrders /> : <SignInForm />
}
