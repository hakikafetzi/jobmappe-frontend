import { useLayoutEffect, useRef } from 'react'

/** Ref auf den jeweils aktuellen Wert — für Callbacks in langlebigen Listenern. */
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  useLayoutEffect(() => {
    ref.current = value
  })
  return ref
}
