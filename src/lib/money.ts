// Money is stored and passed around as integer cents everywhere; this is the one
// place it gets formatted for display.
const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })

export function formatMoney(cents: number): string {
  return formatter.format(cents / 100)
}
