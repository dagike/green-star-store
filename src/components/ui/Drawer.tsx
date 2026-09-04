import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { CloseIcon } from '../icons'

interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  side?: 'left' | 'right'
  children: ReactNode
}

export function Drawer({ open, onClose, title, side = 'left', children }: DrawerProps) {
  const containerRef = useFocusTrap<HTMLDivElement>(open)
  useBodyScrollLock(open)

  useEffect(() => {
    if (!open) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const sideClasses = side === 'left' ? 'left-0' : 'right-0'

  return createPortal(
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className="absolute inset-0 bg-neutral-900/50"
      />
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`absolute top-0 ${sideClasses} flex h-full w-full max-w-xs flex-col bg-white shadow-xl`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          {title && <h2 className="text-base font-semibold text-neutral-900">{title}</h2>}
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
