// Animierter Wechsel zwischen Stellen- und Firmen-Seite (View Transitions, CSS in
// PageToolbar.module.css). Beide Seiten bestehen aus denselben Bausteinen; gleich benannte
// Elemente verwandeln sich ineinander statt neu zu erscheinen.
import type { CSSProperties } from 'react'

/** Nur die ersten Karten bekommen einen Namen — weiter unten sieht man sie ohnehin nicht. */
const NAMED_CARDS = 12

/**
 * Listenkarten mit gleichem Index (Stelle ↔ Firma) verwandeln sich ineinander: Sie wandern an die
 * neue Position und nehmen die neue Höhe an.
 */
export const cardTransitionStyle = (index: number) =>
  ({ '--vt-name': index < NAMED_CARDS ? `jm-card-${index}` : 'none' }) as CSSProperties

/** Steht während des Wechsels Stellen ↔ Firmen am <html>; nur dann ist das mobile Dock eine eigene
 * Ebene über den Karten (MainNav.module.css) — sonst störte es andere Übergänge (Theme). */
const PAGE_SWITCHING_ATTR = 'data-page-switching'

/** Länger als der längste Teil des Übergangs (PageToolbar.module.css: 420 ms bzw. 90 + 360 ms). */
const SWITCH_MS = 700

/** Markiert den Wechsel für die Dauer des Übergangs (vor dem Navigieren aufrufen). */
export function markPageSwitch() {
  const root = document.documentElement
  root.setAttribute(PAGE_SWITCHING_ATTR, '')
  setTimeout(() => root.removeAttribute(PAGE_SWITCHING_ATTR), SWITCH_MS)
}
