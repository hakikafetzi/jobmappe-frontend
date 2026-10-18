import type { ThemePreference } from './theme'

/** Wahlmöglichkeiten für das Erscheinungsbild (Einstellungen und Profilmenü). */
export const THEME_OPTIONS: readonly { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
  { value: 'system', label: 'System' },
]
