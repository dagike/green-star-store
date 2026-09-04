import { Link } from 'react-router-dom'
import { StarIcon } from '../components/icons'

export function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex items-center gap-1 text-brand-500">
        <StarIcon className="h-6 w-6" fill="currentColor" stroke="none" />
        <StarIcon className="h-10 w-10" fill="currentColor" stroke="none" />
        <StarIcon className="h-6 w-6" fill="currentColor" stroke="none" />
      </div>

      <p className="text-6xl font-extrabold tracking-tight text-neutral-900">404</p>

      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold text-neutral-900">Page not found</h1>
        <p className="max-w-sm text-sm text-neutral-500">
          We couldn&apos;t find the page you&apos;re looking for. It may have been moved or never
          existed.
        </p>
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/products"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-brand-600 px-4 text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Back to shop
        </Link>
        <Link
          to="/"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
