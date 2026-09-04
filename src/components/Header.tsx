import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { CartIcon, CloseIcon, HeartIcon, MenuIcon, StarIcon, UserIcon } from './icons'
import { SearchBar } from './SearchBar'

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Shop', end: false },
  { to: '/account/orders', label: 'Orders', end: false },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors hover:text-brand-700 ${
    isActive ? 'text-brand-700' : 'text-neutral-600'
  }`

// TODO(commit 5, 19, 22): live wishlist/cart counts from context.
const wishlistCount = 0
const cartCount = 0

function IconLink({
  to,
  label,
  icon,
  count,
}: {
  to: string
  label: string
  icon: React.ReactNode
  count: number
}) {
  return (
    <NavLink
      to={to}
      aria-label={`${label}${count > 0 ? ` (${count} items)` : ''}`}
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-brand-50 hover:text-brand-700"
    >
      {icon}
      {count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
          {count}
        </span>
      )}
    </NavLink>
  )
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-2 text-neutral-900" end>
          <StarIcon className="h-6 w-6 text-brand-600" fill="currentColor" stroke="none" />
          <span className="text-base font-bold tracking-tight">Green Star Store</span>
        </NavLink>

        <nav className="ml-4 hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden flex-1 justify-center px-4 md:flex lg:px-12">
          <SearchBar className="w-full max-w-md" />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <IconLink
            to="/wishlist"
            label="Wishlist"
            icon={<HeartIcon className="h-5 w-5" />}
            count={wishlistCount}
          />
          <IconLink
            to="/cart"
            label="Cart"
            icon={<CartIcon className="h-5 w-5" />}
            count={cartCount}
          />
          <NavLink
            to="/account/orders"
            aria-label="Account"
            className="hidden h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-brand-50 hover:text-brand-700 md:flex"
          >
            <UserIcon className="h-5 w-5" />
          </NavLink>
          <button
            type="button"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((open) => !open)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-600 transition-colors hover:bg-brand-50 hover:text-brand-700 md:hidden"
          >
            {mobileOpen ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-neutral-200 bg-white px-4 pt-3 pb-4 md:hidden">
          <SearchBar className="mb-4" onSubmit={() => setMobileOpen(false)} />
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-2 text-sm font-medium ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-neutral-700 hover:bg-neutral-50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </header>
  )
}
