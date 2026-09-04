import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon } from '../components/icons'

export type ToastVariant = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  variant: ToastVariant
  leaving: boolean
}

interface ToastContextValue {
  show: (message: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const LEAVE_ANIMATION_MS = 200
const DEFAULT_DURATION_MS = 3000

const variantClasses: Record<ToastVariant, string> = {
  success: 'border-l-4 border-brand-600',
  error: 'border-l-4 border-red-600',
  info: 'border-l-4 border-neutral-400',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id))
    }, LEAVE_ANIMATION_MS)
  }, [])

  const show = useCallback(
    (message: string, variant: ToastVariant = 'success') => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { id, message, variant, leaving: false }])
      const timer = setTimeout(() => dismiss(id), DEFAULT_DURATION_MS)
      timers.current.set(id, timer)
    },
    [dismiss],
  )

  useEffect(() => {
    const timerMap = timers.current
    return () => {
      timerMap.forEach(clearTimeout)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div
          role="status"
          aria-live="polite"
          aria-atomic="false"
          className="fixed bottom-4 left-1/2 z-50 flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 sm:right-4 sm:left-auto sm:translate-x-0"
        >
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`flex items-center justify-between gap-3 rounded-lg bg-white px-4 py-3 text-sm text-neutral-800 shadow-lg transition-all duration-200 ${variantClasses[toast.variant]} ${
                toast.leaving ? 'translate-y-1 opacity-0' : 'translate-y-0 opacity-100'
              }`}
            >
              <span>{toast.message}</span>
              <button
                type="button"
                aria-label="Dismiss notification"
                onClick={() => dismiss(toast.id)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- context + hook live together by convention
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
