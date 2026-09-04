import { StarIcon } from '../icons'

interface StarsProps {
  value: number
  count?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
}

/** Renders a 0–5 star rating, supporting fractional fills (e.g. 3.5). */
export function Stars({ value, count, size = 'md', className = '' }: StarsProps) {
  const clamped = Math.max(0, Math.min(5, value))
  const fillPercent = (clamped / 5) * 100
  const starSize = sizeClasses[size]

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div
        className="relative inline-flex"
        role="img"
        aria-label={`Rated ${clamped.toFixed(1)} out of 5${count !== undefined ? ` (${count} reviews)` : ''}`}
      >
        <div className="flex gap-0.5 text-neutral-300">
          {Array.from({ length: 5 }, (_, i) => (
            <StarIcon key={i} className={starSize} fill="currentColor" stroke="none" />
          ))}
        </div>
        <div
          className="absolute inset-0 flex gap-0.5 overflow-hidden text-accent-500"
          style={{ width: `${fillPercent}%` }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <StarIcon
              key={i}
              className={`${starSize} shrink-0`}
              fill="currentColor"
              stroke="none"
            />
          ))}
        </div>
      </div>
      {count !== undefined && <span className="text-xs text-neutral-500">({count})</span>}
    </div>
  )
}
