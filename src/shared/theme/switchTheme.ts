// Animierter Wechsel des Erscheinungsbilds: Die neuen Farben breiten sich kreisförmig vom
// geklickten Knopf über die Seite aus (View Transitions, CSS in ThemeSwitch.module.css).
// Ohne View-Transitions-Unterstützung, bei „Bewegung reduzieren“ oder abgeschalteten Animationen
// wechselt es sofort.
import { flushSync } from 'react-dom'
import { prefersReducedMotion } from '../lib/motion'
import { readThemePreference, setThemePreference, type ThemePreference } from './theme'

/** Steht während des Wechsels am <html>; nur dann gelten die Animationsregeln. */
const THEME_SWITCHING_ATTR = 'data-theme-switching'

export function switchThemePreference(preference: ThemePreference, origin?: { x: number; y: number }) {
  const root = document.documentElement
  if (
    !origin ||
    prefersReducedMotion() ||
    !document.startViewTransition ||
    preference === readThemePreference()
  ) {
    setThemePreference(preference)
    return
  }
  // Radius bis zur entferntesten Ecke, damit der Kreis am Ende die ganze Seite bedeckt
  const radius = Math.hypot(
    Math.max(origin.x, window.innerWidth - origin.x),
    Math.max(origin.y, window.innerHeight - origin.y),
  )
  root.style.setProperty('--theme-x', `${origin.x}px`)
  root.style.setProperty('--theme-y', `${origin.y}px`)
  root.style.setProperty('--theme-r', `${radius}px`)
  root.setAttribute(THEME_SWITCHING_ATTR, '')

  const transition = document.startViewTransition(() => flushSync(() => setThemePreference(preference)))
  void transition.finished.finally(() => {
    root.removeAttribute(THEME_SWITCHING_ATTR)
    for (const prop of ['--theme-x', '--theme-y', '--theme-r']) root.style.removeProperty(prop)
  })
}
