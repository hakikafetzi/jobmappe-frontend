// Animationen an/aus. Wie das Erscheinungsbild rein clientseitig: „Aus“ liegt im localStorage und
// wird als [data-motion="off"] am <html> gesetzt. base.css schaltet damit alle CSS-Übergänge ab,
// `prefersReducedMotion()` (shared/lib/motion.ts) die per JS gestarteten. index.html setzt es schon
// vor dem ersten Rendern; Schlüssel und Werte müssen dort gleich sein.
import { useSyncExternalStore } from 'react'

export type MotionPreference = 'on' | 'off'

export const MOTION_STORAGE_KEY = 'jobmappe.motion'

export function readMotionPreference(): MotionPreference {
  try {
    return localStorage.getItem(MOTION_STORAGE_KEY) === 'off' ? 'off' : 'on'
  } catch {
    // localStorage kann gesperrt sein (z. B. private Fenster mancher Browser)
    return 'on'
  }
}

function applyMotionPreference(preference: MotionPreference) {
  const root = document.documentElement
  if (preference === 'off') root.dataset.motion = 'off'
  else delete root.dataset.motion
}

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

export function setMotionPreference(preference: MotionPreference) {
  try {
    if (preference === 'off') localStorage.setItem(MOTION_STORAGE_KEY, 'off')
    else localStorage.removeItem(MOTION_STORAGE_KEY)
  } catch {
    // Nicht speicherbar: gilt dann nur für diese Sitzung
  }
  applyMotionPreference(preference)
  notify()
}

// Wahl aus einem anderen Tab übernehmen (key null = localStorage geleert)
function onStorage(e: StorageEvent) {
  if (e.key !== MOTION_STORAGE_KEY && e.key !== null) return
  applyMotionPreference(readMotionPreference())
  notify()
}

function subscribe(onChange: () => void) {
  if (listeners.size === 0) window.addEventListener('storage', onStorage)
  listeners.add(onChange)
  return () => {
    listeners.delete(onChange)
    if (listeners.size === 0) window.removeEventListener('storage', onStorage)
  }
}

/** Gewählte Einstellung für Animationen samt Setter. */
export function useMotionPreference(): [MotionPreference, (preference: MotionPreference) => void] {
  const preference = useSyncExternalStore(subscribe, readMotionPreference, () => 'on' as const)
  return [preference, setMotionPreference]
}
