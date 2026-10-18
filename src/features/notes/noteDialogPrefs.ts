// Größe, Lage, Vollbild und Breite der Notizliste des Notiz-Dialogs, pro Browser gemerkt
// (wie das Erscheinungsbild).
import {
  clampPosition,
  clampSize,
  viewportSize,
  type DialogPosition,
  type DialogSize,
} from '../../shared/ui/dialogSize'

export const NOTE_DIALOG_STORAGE_KEY = 'jobmappe.noteDialog'

export type NoteDialogPrefs = DialogSize & {
  /** null = mittig */
  position: DialogPosition | null
  fullscreen: boolean
  /** Breite der Notizliste im Vollbild */
  sidebarWidth: number
  /** Notizliste im Vollbild eingeklappt */
  sidebarCollapsed: boolean
}

export const DEFAULT_NOTE_DIALOG_PREFS: NoteDialogPrefs = {
  width: 860,
  height: 820,
  position: null,
  fullscreen: false,
  sidebarWidth: 360,
  sidebarCollapsed: false,
}

export const MIN_SIDEBAR_WIDTH = 260
const OLD_DEFAULT_SIDEBAR_WIDTH = 280

/** Notizliste: mindestens 260 px, höchstens 640 px bzw. die halbe Fensterbreite. */
export function clampSidebarWidth(width: number, viewportWidth: number): number {
  const max = Math.max(MIN_SIDEBAR_WIDTH, Math.min(640, Math.round(viewportWidth / 2)))
  return Math.round(Math.min(Math.max(width, MIN_SIDEBAR_WIDTH), max))
}

const isNumber = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v)

export function loadNoteDialogPrefs(): NoteDialogPrefs {
  let stored: unknown = null
  try {
    stored = JSON.parse(localStorage.getItem(NOTE_DIALOG_STORAGE_KEY) ?? 'null')
  } catch {
    // localStorage gesperrt (z. B. private Fenster) oder kaputter Wert: Standard
  }
  const p = (stored && typeof stored === 'object' ? stored : {}) as Partial<
    Record<keyof NoteDialogPrefs, unknown>
  >
  const d = DEFAULT_NOTE_DIALOG_PREFS
  const viewport = viewportSize()
  const size = clampSize(
    { width: isNumber(p.width) ? p.width : d.width, height: isNumber(p.height) ? p.height : d.height },
    viewport,
  )
  const pos = p.position && typeof p.position === 'object' ? (p.position as Record<string, unknown>) : null
  return {
    ...size,
    // Das Fenster kann seit dem Speichern kleiner geworden sein
    position:
      pos && isNumber(pos.x) && isNumber(pos.y)
        ? clampPosition({ x: pos.x, y: pos.y }, size, viewport)
        : null,
    fullscreen: p.fullscreen === true,
    sidebarWidth: clampSidebarWidth(
      // 280 war die frühere Standardbreite: gespeichert, ohne dass jemand gezogen hat → neue Standardbreite
      isNumber(p.sidebarWidth) && p.sidebarWidth !== OLD_DEFAULT_SIDEBAR_WIDTH
        ? p.sidebarWidth
        : d.sidebarWidth,
      viewport.width,
    ),
    sidebarCollapsed: p.sidebarCollapsed === true,
  }
}

export function saveNoteDialogPrefs(prefs: NoteDialogPrefs) {
  try {
    localStorage.setItem(NOTE_DIALOG_STORAGE_KEY, JSON.stringify(prefs))
  } catch {
    // nicht speicherbar: gilt dann nur bis zum Schließen
  }
}
