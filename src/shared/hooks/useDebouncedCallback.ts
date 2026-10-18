import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useLatest } from './useLatest'

/**
 * `fn` verzögert aufrufen: Jeder Aufruf von `run` startet die Wartezeit neu, nur der letzte wird
 * ausgeführt. `flush` führt sofort aus, `cancel` verwirft einen wartenden Aufruf. Beim Unmount wird
 * ein wartender Aufruf verworfen.
 */
export function useDebouncedCallback<A extends unknown[]>(fn: (...args: A) => void, delayMs: number) {
  const latest = useLatest(fn)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const cancel = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = undefined
  }, [])
  useEffect(() => cancel, [cancel])

  return useMemo(
    () => ({
      run: (...args: A) => {
        cancel()
        timer.current = setTimeout(() => {
          timer.current = undefined
          latest.current(...args)
        }, delayMs)
      },
      flush: (...args: A) => {
        cancel()
        latest.current(...args)
      },
      cancel,
    }),
    [cancel, delayMs, latest],
  )
}
