// Shared query-string parsing helpers for API handlers.
export type ApiQuery = Record<string, string | string[] | undefined>

export function param(query: ApiQuery, key: string): string | undefined {
  const value = query[key]
  return Array.isArray(value) ? value[0] : value
}

export function numberParam(query: ApiQuery, key: string): number | undefined {
  const raw = param(query, key)
  if (raw === undefined || raw === '') return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}
