import { useEffect } from 'react'

/** Locks page scroll while `active` is true. Nests safely across multiple callers. */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = overflow
    }
  }, [active])
}
