// Erscheinungsbild (Hell/Dunkel/System). Rein clientseitig: Die Wahl liegt im localStorage
// und wird als [data-theme] am <html> gesetzt (siehe tokens.css). index.html setzt sie schon
// vor dem ersten Rendern, damit nichts aufblitzt; Schlüssel und Werte müssen dort gleich sein.
import { useSyncExternalStore } from 'react'
import { useMediaQuery } from '../hooks/useMediaQuery'

export type ThemePreference = 'light' | 'dark' | 'system'
type ColorScheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'jobmappe.theme'
const DARK_QUERY = '(prefers-color-scheme: dark)'

const isForced = (value: unknown): value is ColorScheme => value === 'light' || value === 'dark'

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isForced(stored) ? stored : 'system'
  } catch {
    // localStorage kann gesperrt sein (z. B. private Fenster mancher Browser)
    return 'system'
  }
}

function applyThemePreference(preference: ThemePreference) {
  const root = document.documentElement
  if (isForced(preference)) root.dataset.theme = preference
  else delete root.dataset.theme
}

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

export function setThemePreference(preference: ThemePreference) {
  try {
    if (preference === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
    else localStorage.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Nicht speicherbar: gilt dann nur für diese Sitzung
  }
  applyThemePreference(preference)
  notify()
}

// Wahl aus einem anderen Tab übernehmen (key null = localStorage geleert)
function onStorage(e: StorageEvent) {
  if (e.key !== THEME_STORAGE_KEY && e.key !== null) return
  applyThemePreference(readThemePreference())
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

/** Gewähltes Erscheinungsbild samt Setter. */
export function useThemePreference(): [ThemePreference, (preference: ThemePreference) => void] {
  const preference = useSyncExternalStore(subscribe, readThemePreference, () => 'system' as const)
  return [preference, setThemePreference]
}

/** Tatsächlich angezeigtes Farbschema (löst „System“ über die Media-Query auf). */
export function useColorScheme(): ColorScheme {
  const [preference] = useThemePreference()
  const systemDark = useMediaQuery(DARK_QUERY)
  if (isForced(preference)) return preference
  return systemDark ? 'dark' : 'light'
}
