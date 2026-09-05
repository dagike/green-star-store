import { useEffect, useReducer, type Reducer } from 'react'

function readStored<S>(key: string, initialState: S): S {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as S) : initialState
  } catch {
    return initialState
  }
}

/** A useReducer that reads its initial state from localStorage and writes back on every change. */
export function usePersistedReducer<S, A>(key: string, reducer: Reducer<S, A>, initialState: S) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => readStored(key, init))

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state))
    } catch {
      // storage unavailable (private mode, quota) — cart still works for the session
    }
  }, [key, state])

  return [state, dispatch] as const
}
