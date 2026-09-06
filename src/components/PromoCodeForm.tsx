import { useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ApiError, applyPromoCode } from '@/lib/api'
import type { PromoApplyResponse } from '@/types'

interface PromoCodeFormProps {
  subtotalCents: number
  applied: PromoApplyResponse | null
  onApply: (promo: PromoApplyResponse) => void
  onRemove: () => void
}

export function PromoCodeForm({ subtotalCents, applied, onApply, onRemove }: PromoCodeFormProps) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = code.trim()
    if (!trimmed) return

    setLoading(true)
    setError(null)
    try {
      const promo = await applyPromoCode(trimmed, subtotalCents)
      onApply(promo)
      setCode('')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong, try again')
    } finally {
      setLoading(false)
    }
  }

  if (applied) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5 text-sm">
        <span className="font-medium text-brand-700">{applied.code} applied</span>
        <button
          type="button"
          onClick={() => {
            onRemove()
            setError(null)
          }}
          className="text-neutral-500 hover:text-red-600"
        >
          Remove
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="Promo code"
          aria-label="Promo code"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? 'promo-code-error' : undefined}
          className="flex-1"
        />
        <Button type="submit" variant="secondary" loading={loading} disabled={!code.trim()}>
          Apply
        </Button>
      </div>
      {error && (
        <p id="promo-code-error" role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </form>
  )
}
