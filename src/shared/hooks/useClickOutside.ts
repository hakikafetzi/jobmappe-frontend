import { useEffect, type RefObject } from 'react'
import { useLatest } from './useLatest'

/** Ruft `onOutside` bei Klick außerhalb von `ref` oder bei Escape auf. */
export function useClickOutside(ref: RefObject<HTMLElement | null>, onOutside: () => void, enabled = true) {
  const cb = useLatest(onOutside)
  useEffect(() => {
    if (!enabled) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb.current()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cb.current()
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [ref, cb, enabled])
}
