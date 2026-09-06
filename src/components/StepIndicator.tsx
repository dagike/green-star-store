export interface Step {
  key: string
  label: string
}

interface StepIndicatorProps {
  steps: readonly Step[]
  currentIndex: number
  maxReachedIndex: number
  onSelect: (index: number) => void
}

export function StepIndicator({
  steps,
  currentIndex,
  maxReachedIndex,
  onSelect,
}: StepIndicatorProps) {
  return (
    <ol className="flex items-center">
      {steps.map((step, index) => {
        const isCurrent = index === currentIndex
        const isDone = index < currentIndex
        const isReachable = index <= maxReachedIndex

        return (
          <li key={step.key} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              disabled={!isReachable}
              onClick={() => onSelect(index)}
              aria-current={isCurrent ? 'step' : undefined}
              className={`flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 ${
                isReachable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  isCurrent
                    ? 'bg-brand-600 text-white'
                    : isDone
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-neutral-100 text-neutral-500'
                }`}
              >
                {isDone ? '✓' : index + 1}
              </span>
              <span
                className={`hidden text-sm font-medium sm:inline ${
                  isCurrent ? 'text-neutral-900' : 'text-neutral-500'
                }`}
              >
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <span
                className={`mx-2 h-px flex-1 sm:mx-4 ${
                  index < currentIndex ? 'bg-brand-300' : 'bg-neutral-200'
                }`}
                aria-hidden="true"
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
