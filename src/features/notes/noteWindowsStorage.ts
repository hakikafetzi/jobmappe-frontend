// Offene und minimierte Notizen über das Neuladen hinweg merken (pro Browser, wie die Dialog-Prefs).
// Nach dem Laden liegen alle unten in der Leiste; ohne Speicher startet der Workspace einfach leer.
import { EMPTY_WORKSPACE, type NoteApplication, type NoteDraft, type NoteWorkspaceState } from './noteWindows'

export const NOTE_WINDOWS_STORAGE_KEY = 'jobmappe.noteWindows'

/** Was von einem Fenster gemerkt wird (ohne Lage und Stapelreihenfolge) */
type StoredWindow = {
  noteId: string | null
  categoryName: string | null
  application: NoteApplication | null
  scope: NoteApplication | null
  draft: NoteDraft | null
}

export function saveNoteWindows(state: NoteWorkspaceState) {
  const stored: StoredWindow[] = state.windows.map((w) => ({
    noteId: w.noteId,
    categoryName: w.categoryName,
    application: w.application,
    scope: w.scope,
    draft: w.draft,
  }))
  try {
    if (stored.length) localStorage.setItem(NOTE_WINDOWS_STORAGE_KEY, JSON.stringify(stored))
    else localStorage.removeItem(NOTE_WINDOWS_STORAGE_KEY)
  } catch {
    // Kein Speicher (privates Fenster, voll): dann eben nicht über das Neuladen hinweg
  }
}

/** Gemerkte Fenster, alle minimiert; Ungültiges fällt weg. */
export function loadNoteWindows(): NoteWorkspaceState {
  let parsed: unknown
  try {
    parsed = JSON.parse(localStorage.getItem(NOTE_WINDOWS_STORAGE_KEY) ?? '[]')
  } catch {
    return EMPTY_WORKSPACE
  }
  if (!Array.isArray(parsed)) return EMPTY_WORKSPACE
  const windows = parsed
    .map(parseWindow)
    .filter((w): w is StoredWindow => w !== null)
    .map((w, i) => ({ ...w, wid: i + 1, minimized: true, position: null, z: i + 1, version: 0 }))
  return { ...EMPTY_WORKSPACE, windows, nextWid: windows.length + 1 }
}

const text = (v: unknown) => (typeof v === 'string' ? v : null)

function parseApplication(v: unknown): NoteApplication | null {
  if (!v || typeof v !== 'object') return null
  const a = v as Record<string, unknown>
  return typeof a.id === 'string'
    ? { id: a.id, jobTitle: text(a.jobTitle), companyName: text(a.companyName) }
    : null
}

function parseDraft(v: unknown): NoteDraft | null {
  if (!v || typeof v !== 'object') return null
  const d = v as Record<string, unknown>
  if (typeof d.title !== 'string' || typeof d.content !== 'string') return null
  return {
    title: d.title,
    content: d.content,
    categoryId: text(d.categoryId),
    application: d.application === 'none' ? 'none' : parseApplication(d.application),
    dirty: d.dirty === true,
  }
}

function parseWindow(v: unknown): StoredWindow | null {
  if (!v || typeof v !== 'object') return null
  const w = v as Record<string, unknown>
  if (w.noteId !== null && typeof w.noteId !== 'string') return null
  return {
    noteId: w.noteId as string | null,
    categoryName: text(w.categoryName),
    application: parseApplication(w.application),
    scope: parseApplication(w.scope),
    draft: parseDraft(w.draft),
  }
}
