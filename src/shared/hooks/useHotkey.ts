import { useEffect } from 'react'
import { isDialogOpen, isTypingTarget } from '../lib/dom'
import { useLatest } from './useLatest'

type Options = {
  /** Auch auslösen, wenn der Fokus in einem Eingabefeld liegt (Standard: nein). */
  whileTyping?: boolean
  /** Auch auslösen, wenn ein Dialog offen ist (Standard: nein). */
  inDialog?: boolean
  enabled?: boolean
}

/**
 * Globales Tastenkürzel. `match` prüft das Event (z. B. `(e) => e.key === 'n'`).
 * Der Listener wird nur einmal registriert; `handler` ist immer der aktuelle.
 */
export function useHotkey(
  match: (e: KeyboardEvent) => boolean,
  handler: (e: KeyboardEvent) => void,
  { whileTyping = false, inDialog = false, enabled = true }: Options = {},
) {
  const matchRef = useLatest(match)
  const handlerRef = useLatest(handler)

  useEffect(() => {
    if (!enabled) return
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      if (!whileTyping && isTypingTarget(e.target)) return
      if (!inDialog && isDialogOpen()) return
      if (!matchRef.current(e)) return
      handlerRef.current(e)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [enabled, whileTyping, inDialog, matchRef, handlerRef])
}

/** Taste ohne Modifier (Groß-/Kleinschreibung egal). */
export const plainKey =
  (...keys: string[]) =>
  (e: KeyboardEvent) =>
    !e.metaKey && !e.ctrlKey && !e.altKey && keys.some((k) => e.key.toLowerCase() === k.toLowerCase())

/** ⌘/Strg + Taste */
export const modKey = (key: string) => (e: KeyboardEvent) =>
  (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === key.toLowerCase()
