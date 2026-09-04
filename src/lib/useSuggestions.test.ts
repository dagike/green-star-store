import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SuggestResponse } from '@/types'
import * as api from './api'
import { useSuggestions } from './useSuggestions'

vi.mock('./api')

function suggestion(slug: string): SuggestResponse['items'][number] {
  return { slug, name: slug, brand: 'Brand', category: 'home' }
}

describe('useSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not fetch for a query shorter than 2 characters', async () => {
    const { result } = renderHook(() => useSuggestions('a'))

    await new Promise((resolve) => setTimeout(resolve, 250))

    expect(result.current).toEqual([])
    expect(api.getSuggestions).not.toHaveBeenCalled()
  })

  it('debounces rapid changes down to a single fetch for the settled query', async () => {
    vi.mocked(api.getSuggestions).mockResolvedValue({ items: [suggestion('lamp')] })

    // Start below the minimum length so mounting doesn't fire an immediate fetch for
    // the initial value (debounced state starts equal to the input value, undelayed).
    const { rerender } = renderHook(({ q }) => useSuggestions(q), { initialProps: { q: '' } })
    rerender({ q: 'la' })
    rerender({ q: 'lam' })
    rerender({ q: 'lamp' })

    await waitFor(() => expect(api.getSuggestions).toHaveBeenCalledTimes(1))
    expect(api.getSuggestions).toHaveBeenCalledWith('lamp')
  })

  it('returns the fetched suggestions', async () => {
    vi.mocked(api.getSuggestions).mockResolvedValue({ items: [suggestion('lamp')] })

    const { result } = renderHook(() => useSuggestions('lamp'))

    await waitFor(() => expect(result.current).toHaveLength(1))
    expect(result.current[0].slug).toBe('lamp')
  })

  it('clears suggestions on a failed request', async () => {
    vi.mocked(api.getSuggestions).mockRejectedValue(new Error('network down'))

    const { result } = renderHook(() => useSuggestions('lamp'))

    await waitFor(() => expect(api.getSuggestions).toHaveBeenCalled())
    expect(result.current).toEqual([])
  })

  it('ignores a stale response that resolves after a newer query has been requested', async () => {
    let resolveFirst!: (value: SuggestResponse) => void
    let resolveSecond!: (value: SuggestResponse) => void
    const first = new Promise<SuggestResponse>((resolve) => {
      resolveFirst = resolve
    })
    const second = new Promise<SuggestResponse>((resolve) => {
      resolveSecond = resolve
    })

    vi.mocked(api.getSuggestions).mockReturnValueOnce(first).mockReturnValueOnce(second)

    const { result, rerender } = renderHook(({ q }) => useSuggestions(q), {
      initialProps: { q: 'foo' },
    })

    await waitFor(() => expect(api.getSuggestions).toHaveBeenCalledTimes(1))

    rerender({ q: 'foobar' })
    await waitFor(() => expect(api.getSuggestions).toHaveBeenCalledTimes(2))

    resolveSecond({ items: [suggestion('foobar')] })
    await waitFor(() => expect(result.current).toHaveLength(1))
    expect(result.current[0].slug).toBe('foobar')

    resolveFirst({ items: [suggestion('foo')] })
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(result.current[0].slug).toBe('foobar')
  })
})
