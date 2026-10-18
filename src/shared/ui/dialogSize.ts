export type DialogSize = { width: number; height: number }

export const MIN_DIALOG_SIZE: DialogSize = { width: 560, height: 420 }

/** Ränder um den Dialog: links/rechts je 20 px, oben 48 px, unten 48 px (wie in Dialog.module.css). */
const MARGIN_X = 40
const MARGIN_Y = 96

/** Größe auf Mindestmaß und Fenster begrenzen; ist das Fenster kleiner, gewinnt das Fenster. */
export function clampSize(size: DialogSize, viewport: DialogSize): DialogSize {
  const clamp = (v: number, min: number, max: number) =>
    Math.round(Math.min(Math.max(v, min), Math.max(max, 0)))
  return {
    width: clamp(size.width, MIN_DIALOG_SIZE.width, viewport.width - MARGIN_X),
    height: clamp(size.height, MIN_DIALOG_SIZE.height, viewport.height - MARGIN_Y),
  }
}

export const viewportSize = (): DialogSize => ({ width: window.innerWidth, height: window.innerHeight })

export type DialogPosition = { x: number; y: number }

/** So viel des Dialogs bleibt mindestens im Fenster, damit man ihn wieder greifen kann. */
const KEEP_VISIBLE = 120
/** Die Kopfleiste bleibt ganz sichtbar. */
const BAR_HEIGHT = 56

/** Linke obere Ecke so begrenzen, dass der Dialog greifbar im Fenster bleibt. */
export function clampPosition(pos: DialogPosition, size: DialogSize, viewport: DialogSize): DialogPosition {
  const clamp = (v: number, min: number, max: number) =>
    Math.round(Math.min(Math.max(v, min), Math.max(max, min)))
  return {
    x: clamp(pos.x, KEEP_VISIBLE - size.width, viewport.width - KEEP_VISIBLE),
    y: clamp(pos.y, 0, viewport.height - BAR_HEIGHT),
  }
}

/** Lage eines mittig stehenden Dialogs (wie im CSS: waagerecht mittig, 48 px von oben). */
export function centeredPosition(size: DialogSize, viewport: DialogSize): DialogPosition {
  const width = Math.min(size.width, viewport.width - MARGIN_X)
  return { x: Math.round((viewport.width - width) / 2), y: 48 }
}
