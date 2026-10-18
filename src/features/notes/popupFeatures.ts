// Größe und Lage des eigenen Browserfensters für eine Notiz: deutlich kleiner als der Bildschirm und
// mittig über dem App-Fenster. Ohne Angaben (oder zu groß) öffnen Browser es bildschirmfüllend.

type Screenish = {
  availWidth: number
  availHeight: number
  /** Lage und Größe des App-Fensters */
  screenX: number
  screenY: number
  outerWidth: number
  outerHeight: number
}

export const NOTE_POPUP_SIZE = { width: 720, height: 760 }

export type PopupRect = { width: number; height: number; left: number; top: number }

export function notePopupRect(s: Screenish): PopupRect {
  const width = Math.round(Math.min(NOTE_POPUP_SIZE.width, s.availWidth * 0.8))
  const height = Math.round(Math.min(NOTE_POPUP_SIZE.height, s.availHeight * 0.85))
  const left = Math.round(Math.max(0, s.screenX + (s.outerWidth - width) / 2))
  const top = Math.round(Math.max(0, s.screenY + (s.outerHeight - height) / 2))
  return { width, height, left, top }
}

/**
 * Ohne das Stichwort `popup`: width/height machen das Fenster schon zum Pop-up, und Safari legt es nur
 * so direkt in der richtigen Größe an (sonst groß, und nach resizeTo springt es beim Verschieben zurück).
 */
export const notePopupFeatures = ({ width, height, left, top }: PopupRect) =>
  `width=${width},height=${height},left=${left},top=${top}`
