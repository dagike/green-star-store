import { NavLink } from 'react-router-dom'
import { StarIcon } from './icons'

export function Footer() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-neutral-700">
          <StarIcon className="h-5 w-5 text-brand-600" fill="currentColor" stroke="none" />
          <span className="text-sm font-semibold">Green Star Store</span>
        </div>

        <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-500">
          <NavLink to="/products" className="hover:text-brand-700">
            Shop
          </NavLink>
          <NavLink to="/cart" className="hover:text-brand-700">
            Cart
          </NavLink>
          <NavLink to="/account/orders" className="hover:text-brand-700">
            Orders
          </NavLink>
        </nav>

        <p className="text-xs text-neutral-400">
          &copy; {new Date().getFullYear()} Green Star Store. All test data — no real orders.
        </p>
      </div>
    </footer>
  )
}
