import { describe, expect, it } from 'vitest'
import { decodeCursor, encodeCursor } from './_cursor.js'

describe('encodeCursor / decodeCursor', () => {
  it('round-trips a numeric sortValue', () => {
    const cursor = { sortValue: 4999, id: 42 }
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor)
  })

  it('round-trips a string sortValue', () => {
    const cursor = { sortValue: '2026-01-01T00:00:00.000Z', id: 7 }
    expect(decodeCursor(encodeCursor(cursor))).toEqual(cursor)
  })

  it('produces a URL-safe string with no padding characters', () => {
    const encoded = encodeCursor({ sortValue: 'x'.repeat(20), id: 1 })
    expect(encoded).not.toMatch(/[+/=]/)
  })

  it('returns null for undefined input', () => {
    expect(decodeCursor(undefined)).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(decodeCursor('')).toBeNull()
  })

  it('returns null for garbage that is not valid base64url JSON', () => {
    expect(decodeCursor('not-a-real-cursor!!')).toBeNull()
  })

  it('returns null when the decoded payload is missing id', () => {
    const encoded = Buffer.from(JSON.stringify({ sortValue: 10 }), 'utf8').toString('base64url')
    expect(decodeCursor(encoded)).toBeNull()
  })

  it('returns null when the decoded payload is missing sortValue', () => {
    const encoded = Buffer.from(JSON.stringify({ id: 10 }), 'utf8').toString('base64url')
    expect(decodeCursor(encoded)).toBeNull()
  })

  it('returns null when id is not a number', () => {
    const encoded = Buffer.from(JSON.stringify({ sortValue: 10, id: '10' }), 'utf8').toString(
      'base64url',
    )
    expect(decodeCursor(encoded)).toBeNull()
  })

  it('returns null when sortValue is neither a string nor a number', () => {
    const encoded = Buffer.from(JSON.stringify({ sortValue: true, id: 10 }), 'utf8').toString(
      'base64url',
    )
    expect(decodeCursor(encoded)).toBeNull()
  })

  it('returns null when the decoded payload is not an object', () => {
    const encoded = Buffer.from(JSON.stringify('just a string'), 'utf8').toString('base64url')
    expect(decodeCursor(encoded)).toBeNull()
  })
})
