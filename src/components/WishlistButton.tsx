import { HeartIcon } from '@/components/icons'
import { useWishlist } from '@/context/WishlistContext'
import type { WishlistItem } from '@/types'

type Size = 'sm' | 'lg'

interface WishlistButtonProps {
  item: WishlistItem
  size?: Size
  className?: string
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 w-9',
  lg: 'h-12 w-12',
}

const iconSizeClasses: Record<Size, string> = {
  sm: 'h-5 w-5',
  lg: 'h-6 w-6',
}

export function WishlistButton({ item, size = 'sm', className = '' }: WishlistButtonProps) {
  const { has, toggle } = useWishlist()
  const active = has(item.productId)

  return (
    <button
      type="button"
      onClick={(event) => {
        // ProductCard wraps this in a <Link> - stop the click from also navigating.
        event.preventDefault()
        event.stopPropagation()
        toggle(item)
      }}
      aria-pressed={active}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      className={`flex flex-shrink-0 items-center justify-center rounded-full border border-neutral-200 bg-white/90 text-neutral-500 shadow-sm backdrop-blur transition-colors hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
        active ? 'text-red-600' : ''
      } ${sizeClasses[size]} ${className}`}
    >
      <HeartIcon
        className={iconSizeClasses[size]}
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
      />
    </button>
  )
}
