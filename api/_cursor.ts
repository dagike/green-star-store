// Cursor-based pagination for the product list endpoint. A cursor is the sort
// column's value plus the row id from the last item on the page, base64-encoded so
// it can round-trip through a query string without escaping issues.
export interface Cursor {
  sortValue: string | number
  id: number
}

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify(cursor), 'utf8').toString('base64url')
}

export function decodeCursor(raw: string | undefined): Cursor | null {
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'))
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'id' in parsed &&
      'sortValue' in parsed &&
      typeof (parsed as Cursor).id === 'number' &&
      (typeof (parsed as Cursor).sortValue === 'number' ||
        typeof (parsed as Cursor).sortValue === 'string')
    ) {
      return parsed as Cursor
    }
    return null
  } catch {
    return null
  }
}
