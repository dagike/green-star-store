import { useState } from 'react'
import type { Review } from '@/types'
import { Button } from './ui/Button'
import { Stars } from './ui/Stars'

const INITIAL_VISIBLE = 3
const REVEAL_STEP = 5

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' })

interface ReviewListProps {
  reviews: Review[]
}

export function ReviewList({ reviews }: ReviewListProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)

  if (reviews.length === 0) {
    return <p className="text-sm text-neutral-500">No reviews yet.</p>
  }

  const visible = reviews.slice(0, visibleCount)
  const hasMore = visibleCount < reviews.length

  return (
    <div className="flex flex-col gap-6">
      {visible.map((review) => (
        <article
          key={review.id}
          className="flex flex-col gap-1.5 border-b border-neutral-200 pb-6 last:border-0 last:pb-0"
        >
          <div className="flex items-center justify-between gap-2">
            <Stars value={review.rating} size="sm" />
            <time dateTime={review.createdAt} className="text-xs text-neutral-400">
              {dateFormatter.format(new Date(review.createdAt))}
            </time>
          </div>
          <h3 className="text-sm font-semibold text-neutral-900">{review.title}</h3>
          <p className="text-sm leading-relaxed text-neutral-600">{review.body}</p>
          <p className="text-xs font-medium text-neutral-500">{review.author}</p>
        </article>
      ))}

      {hasMore && (
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() => setVisibleCount((count) => count + REVEAL_STEP)}
        >
          Show more reviews
        </Button>
      )}
    </div>
  )
}
