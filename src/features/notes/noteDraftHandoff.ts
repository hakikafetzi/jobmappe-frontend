// Entwurf an ein eigenes Browserfenster übergeben: liegt kurz im localStorage und wird beim
// ersten Lesen gelöscht. Ohne Speicher öffnet das Fenster einfach den gespeicherten Stand.
import type { NoteApplication, NoteDraft } from './noteWindows'

const PREFIX = 'jobmappe.noteDraft.'

export type HandedOverDraft = {
  draft: NoteDraft | null
  categoryName: string | null
  /** Vorauswahl der Bewerbung bei neuen Notizen */
  application: NoteApplication | null
}

/** Legt den Entwurf ab und liefert das Token für die Adresse; null, wenn nichts abgelegt wurde. */
export function handOverDraft(value: HandedOverDraft): string | null {
  const token = Math.random().toString(36).slice(2, 10)
  try {
    localStorage.setItem(PREFIX + token, JSON.stringify(value))
    return token
  } catch {
    return null
  }
}

// Schon gelesene Entwürfe dieses Fensters (StrictMode ruft Initialisierer doppelt auf)
const taken = new Map<string, HandedOverDraft | null>()

/** Liest den übergebenen Entwurf einmal aus dem Speicher (danach ist er dort weg). */
export function takeDraft(token: string | null): HandedOverDraft | null {
  if (!token) return null
  if (taken.has(token)) return taken.get(token) ?? null
  const value = readDraft(token)
  taken.set(token, value)
  return value
}

function readDraft(token: string): HandedOverDraft | null {
  try {
    const raw = localStorage.getItem(PREFIX + token)
    localStorage.removeItem(PREFIX + token)
    const parsed: unknown = raw ? JSON.parse(raw) : null
    if (!parsed || typeof parsed !== 'object') return null
    const v = parsed as Partial<HandedOverDraft>
    const d = v.draft
    const draft =
      d && typeof d.title === 'string' && typeof d.content === 'string'
        ? {
            title: d.title,
            content: d.content,
            categoryId: typeof d.categoryId === 'string' ? d.categoryId : null,
            application: d.application === 'none' ? ('none' as const) : parseApplication(d.application),
            dirty: true,
          }
        : null
    return {
      draft,
      categoryName: typeof v.categoryName === 'string' ? v.categoryName : null,
      application: parseApplication(v.application),
    }
  } catch {
    return null
  }
}

function parseApplication(value: unknown): NoteApplication | null {
  if (!value || typeof value !== 'object') return null
  const a = value as Partial<NoteApplication>
  if (typeof a.id !== 'string') return null
  const text = (t: unknown) => (typeof t === 'string' ? t : null)
  return { id: a.id, jobTitle: text(a.jobTitle), companyName: text(a.companyName) }
}
