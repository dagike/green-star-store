import type { Review } from '@/types'
import { Stars } from './ui/Stars'

interface RatingSummaryProps {
  avgRating: number
  reviews: Review[]
}

const STAR_LEVELS = [5, 4, 3, 2, 1]

export function RatingSummary({ avgRating, reviews }: RatingSummaryProps) {
  const total = reviews.length
  const countsByStar = STAR_LEVELS.map(
    (star) => reviews.filter((review) => review.rating === star).length,
  )

  return (
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
      <div className="flex shrink-0 flex-col items-center gap-1 sm:items-start">
        <span className="text-4xl font-semibold text-neutral-900">{avgRating.toFixed(1)}</span>
        <Stars value={avgRating} />
        <span className="text-sm text-neutral-500">
          {total} {total === 1 ? 'review' : 'reviews'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        {STAR_LEVELS.map((star, index) => {
          const count = countsByStar[index]
          const percent = total > 0 ? Math.round((count / total) * 100) : 0
          return (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-12 shrink-0 text-neutral-600">{star} star</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100">
                <div
                  className="h-full rounded-full bg-accent-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="w-6 shrink-0 text-right text-neutral-500">{count}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
