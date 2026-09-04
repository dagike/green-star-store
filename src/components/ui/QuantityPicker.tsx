import { useState } from 'react'

interface QuantityPickerProps {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  disabled?: boolean
}

export function QuantityPicker({
  value,
  min = 1,
  max,
  onChange,
  disabled = false,
}: QuantityPickerProps) {
  const [inputValue, setInputValue] = useState(String(value))

  // Keep the text input in sync when `value` changes from elsewhere (+/- buttons, a
  // different product), comparing against the previous prop during render rather than
  // in an effect.
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setInputValue(String(value))
  }

  function clamp(next: number) {
    return Math.min(max, Math.max(min, next))
  }

  function commit() {
    const parsed = Number(inputValue)
    const next = Number.isNaN(parsed) ? value : clamp(Math.trunc(parsed))
    setInputValue(String(next))
    if (next !== value) onChange(next)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') event.currentTarget.blur()
  }

  return (
    <div className="inline-flex items-center rounded-lg border border-neutral-300">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className="flex h-9 w-9 items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        aria-label="Quantity"
        value={inputValue}
        disabled={disabled}
        onChange={(event) => setInputValue(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="h-9 w-12 border-x border-neutral-300 text-center text-sm text-neutral-900 focus:outline-none disabled:bg-neutral-50"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className="flex h-9 w-9 items-center justify-center text-neutral-600 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        +
      </button>
    </div>
  )
}
