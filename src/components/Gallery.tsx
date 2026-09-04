import { useRef, useState } from 'react'
import type { ProductImage } from '@/types'
import { ChevronLeftIcon, ChevronRightIcon } from './icons'

const SWIPE_THRESHOLD_PX = 40

interface GalleryProps {
  images: ProductImage[]
  productName: string
}

export function Gallery({ images, productName }: GalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-xl bg-neutral-100 text-sm text-neutral-400">
        No image
      </div>
    )
  }

  const active = images[activeIndex]

  function go(delta: number) {
    setActiveIndex((i) => (i + delta + images.length) % images.length)
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      go(-1)
    } else if (event.key === 'ArrowRight') {
      event.preventDefault()
      go(1)
    }
  }

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const startX = touchStartX.current
    touchStartX.current = null
    if (startX === null) return

    const endX = event.changedTouches[0]?.clientX ?? startX
    const delta = endX - startX
    if (delta > SWIPE_THRESHOLD_PX) go(-1)
    else if (delta < -SWIPE_THRESHOLD_PX) go(1)
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row-reverse">
      <div
        role="group"
        aria-label={`${productName} images`}
        aria-roledescription="carousel"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative aspect-square flex-1 touch-pan-y overflow-hidden rounded-xl bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      >
        <img
          key={active.url}
          src={active.url}
          alt={active.alt || productName}
          className="h-full w-full object-cover"
        />

        {images.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => go(-1)}
              className="absolute top-1/2 left-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow hover:bg-white"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Next image"
              onClick={() => go(1)}
              className="absolute top-1/2 right-2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-700 shadow hover:bg-white"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto sm:w-20 sm:flex-col sm:overflow-y-auto">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`View image ${index + 1} of ${images.length}`}
              aria-current={index === activeIndex}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                index === activeIndex ? 'border-brand-600' : 'border-transparent'
              }`}
            >
              <img src={image.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
