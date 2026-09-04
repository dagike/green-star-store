// Temporary stand-in for routes not yet built out. Each route replaces this
// with real content in its own commit; only the routing shell is set up here.
interface PagePlaceholderProps {
  title: string
  description: string
}

export function PagePlaceholder({ title, description }: PagePlaceholderProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center">
      <h1 className="text-2xl font-bold text-neutral-900">{title}</h1>
      <p className="max-w-md text-sm text-neutral-500">{description}</p>
    </div>
  )
}
