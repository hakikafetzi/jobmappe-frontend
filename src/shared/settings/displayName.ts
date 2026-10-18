// Name für die Begrüßung auf der Startseite. Wie Erscheinungsbild und Animationen rein clientseitig:
// Er liegt nur im localStorage dieses Browsers.
import { useSyncExternalStore } from 'react'

export const DISPLAY_NAME_KEY = 'jobmappe.displayName'
export const DISPLAY_NAME_MAX_LENGTH = 40

export function readDisplayName(): string {
  try {
    return localStorage.getItem(DISPLAY_NAME_KEY) ?? ''
  } catch {
    // localStorage kann gesperrt sein (z. B. private Fenster mancher Browser)
    return ''
  }
}

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

/** Speichert den Namen so, wie er getippt wird; ein leerer Name (nur Leerzeichen) wird entfernt. */
export function setDisplayName(name: string) {
  const value = name.slice(0, DISPLAY_NAME_MAX_LENGTH)
  try {
    if (value.trim()) localStorage.setItem(DISPLAY_NAME_KEY, value)
    else localStorage.removeItem(DISPLAY_NAME_KEY)
  } catch {
    // Nicht speicherbar: gilt dann nur für diese Sitzung
  }
  notify()
}

// Name aus einem anderen Tab übernehmen (key null = localStorage geleert)
function onStorage(e: StorageEvent) {
  if (e.key === DISPLAY_NAME_KEY || e.key === null) notify()
}

function subscribe(onChange: () => void) {
  if (listeners.size === 0) window.addEventListener('storage', onStorage)
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0) window.removeEventListener('storage', onStorage)
  }
}

/** Gespeicherter Name (ungetrimmt, wie eingegeben; leer = keiner) samt Setter. */
export function useDisplayName(): [string, (name: string) => void] {
  return [useSyncExternalStore(subscribe, readDisplayName, () => ''), setDisplayName]
}
