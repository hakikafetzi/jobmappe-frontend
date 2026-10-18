import { useSyncExternalStore } from 'react'

/** Reaktiver Media-Query, z. B. `useMediaQuery('(max-width: 760px)')`. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}

export const MOBILE_QUERY = '(max-width: 760px)'
export const COMPACT_QUERY = '(max-width: 700px)'
