// Offene Notizen als eigene Fenster. Entwürfe liegen hier statt im Formular, damit eine Notiz beim
// Wechsel zwischen schwebendem Fenster und Vollbild (anderer Dialog → neues Formular) nichts verliert.
import type { DialogPosition } from '../../shared/ui/dialogSize'

/** Bewerbung, der eine Notiz zugeordnet ist, mit den Angaben zur Anzeige */
export type NoteApplication = { id: string; jobTitle: string | null; companyName: string | null }

/** Ungespeicherte Eingaben eines Fensters; fehlt er, zeigt das Formular die Notiz unverändert. */
export type NoteDraft = {
  title: string
  content: string
  /** Gewählter Ordner (ID, '' = ohne); null = unverändert, aus dem Namen ableiten */
  categoryId: string | null
  /** Gewählte Bewerbung ('none' = ohne); null = unverändert */
  application: NoteApplication | 'none' | null
  /** Weicht vom geladenen Stand ab */
  dirty: boolean
}

export type NoteWindow = {
  wid: number
  /** null = neue Notiz */
  noteId: string | null
  /** Vorauswahl des Ordners bei neuen Notizen */
  categoryName: string | null
  /** Vorauswahl der Bewerbung bei neuen Notizen */
  application: NoteApplication | null
  /** Bewerbung, in deren Kontext geöffnet wurde (Vorbelegung neuer Notizen aus dem Vollbild) */
  scope: NoteApplication | null
  /** Unten in der Leiste statt als Fenster */
  minimized: boolean
  draft: NoteDraft | null
  /** Lage als schwebendes Fenster; null = mittig */
  position: DialogPosition | null
  /** Stapelreihenfolge (höher = vorn) */
  z: number
  /** Zählt hoch, wenn das Fenster eine andere Notiz zeigt: Das Formular startet dann frisch */
  version: number
}

export type NoteWorkspaceState = {
  windows: NoteWindow[]
  /** Aktives Fenster bzw. aktive Seite im Vollbild */
  focused: number | null
  /** Seiten im Vollbild: links und (im Split) rechts */
  left: number | null
  right: number | null
  nextWid: number
}

export const EMPTY_WORKSPACE: NoteWorkspaceState = {
  windows: [],
  focused: null,
  left: null,
  right: null,
  nextWid: 1,
}

type Target = {
  noteId: string | null
  categoryName: string | null
  application?: NoteApplication | null
  scope?: NoteApplication | null
}

export type NoteWorkspaceAction =
  /** Notiz öffnen (bereits offene nach vorn holen); neue Notizen öffnen immer ein neues Fenster */
  | ({ type: 'open'; position: DialogPosition | null } & Target)
  | { type: 'close'; wid: number }
  | { type: 'focus'; wid: number }
  /** Im Fenster bzw. auf der Seite eine andere Notiz zeigen (Klick in der Notizliste im Vollbild) */
  | ({ type: 'replace'; wid: number } & Target)
  /** Im Vollbild rechts daneben öffnen */
  | ({ type: 'openInSplit' } & Target)
  | { type: 'draft'; wid: number; draft: NoteDraft }
  /** Gespeichert: Neue Notizen bekommen ihre ID, der Entwurf entfällt */
  | { type: 'saved'; wid: number; noteId: string }
  | { type: 'move'; wid: number; position: DialogPosition | null }
  /** Offenes Fenster auf der aktiven Seite zeigen (Entwurf in der Notizliste angeklickt) */
  | { type: 'showInPane'; wid: number }
  /** Vor dem Vollbild: Seiten aus dem aktiven Fenster und dem Split bestimmen */
  | { type: 'enterFullscreen' }
  /** In die Leiste unten; „focus“ holt es zurück */
  | { type: 'minimize'; wid: number }
  /** Alle in die Leiste (Seitenwechsel) */
  | { type: 'minimizeAll' }

const topZ = (windows: NoteWindow[]) => windows.reduce((z, w) => Math.max(z, w.z), 0)

/** Als Fenster sichtbar (nicht minimiert) */
export const visibleWindows = (s: NoteWorkspaceState) => s.windows.filter((w) => !w.minimized)

const findOpen = (s: NoteWorkspaceState, noteId: string | null) =>
  noteId === null ? undefined : s.windows.find((w) => w.noteId === noteId)

function addWindow(
  s: NoteWorkspaceState,
  t: Target,
  position: DialogPosition | null,
): [NoteWorkspaceState, number] {
  const wid = s.nextWid
  const win: NoteWindow = {
    wid,
    noteId: t.noteId,
    categoryName: t.categoryName,
    application: t.application ?? null,
    scope: t.scope ?? null,
    minimized: false,
    draft: null,
    position,
    z: topZ(s.windows) + 1,
    version: 0,
  }
  return [{ ...s, windows: [...s.windows, win], nextWid: wid + 1 }, wid]
}

/** Nach vorn holen (und aus der Leiste zurückholen, falls minimiert). */
function focus(s: NoteWorkspaceState, wid: number): NoteWorkspaceState {
  const z = topZ(s.windows) + 1
  return {
    ...s,
    focused: wid,
    windows: s.windows.map((w) =>
      w.wid === wid && (w.z < z - 1 || w.minimized) ? { ...w, z, minimized: false } : w,
    ),
  }
}

/** Fenster entfernen und Fokus/Seiten nachziehen (minimierte übernehmen nie). */
function remove(s: NoteWorkspaceState, wid: number): NoteWorkspaceState {
  const windows = s.windows.filter((w) => w.wid !== wid)
  // Die andere Seite eines Splits übernimmt; sonst das vorderste übrige Fenster
  const otherPane = s.left === wid ? s.right : s.right === wid ? s.left : null
  let { left, right } = s
  if (left === wid) [left, right] = [right, null]
  if (right === wid) right = null
  const front = windows
    .filter((w) => !w.minimized)
    .reduce<NoteWindow | null>((top, w) => (!top || w.z > top.z ? w : top), null)
  const focused = s.focused === wid ? (otherPane ?? front?.wid ?? null) : s.focused
  if (left === null && front) left = focused
  return { ...s, windows, left, right, focused }
}

/** In die Leiste: Fokus und Seiten wie beim Schließen nachziehen, das Fenster bleibt erhalten. */
function minimize(s: NoteWorkspaceState, wid: number): NoteWorkspaceState {
  return {
    ...remove(s, wid),
    windows: s.windows.map((w) => (w.wid === wid ? { ...w, minimized: true } : w)),
  }
}

const update = (s: NoteWorkspaceState, wid: number, patch: (w: NoteWindow) => Partial<NoteWindow>) => ({
  ...s,
  windows: s.windows.map((w) => (w.wid === wid ? { ...w, ...patch(w) } : w)),
})

export function noteWorkspaceReducer(s: NoteWorkspaceState, a: NoteWorkspaceAction): NoteWorkspaceState {
  switch (a.type) {
    case 'open': {
      const open = findOpen(s, a.noteId)
      if (open) return focus(s, open.wid)
      const [next, wid] = addWindow(s, a, a.position)
      // Die erste Notiz wird im Vollbild die linke Seite
      return { ...next, focused: wid, left: next.left ?? wid }
    }
    case 'close':
      return remove(s, a.wid)
    case 'focus': {
      const w = s.windows.find((x) => x.wid === a.wid)
      return s.focused === a.wid && w && !w.minimized && w.z === topZ(s.windows) ? s : focus(s, a.wid)
    }
    case 'minimize':
      return s.windows.some((w) => w.wid === a.wid && !w.minimized) ? minimize(s, a.wid) : s
    case 'minimizeAll':
      return s.windows.every((w) => w.minimized)
        ? s
        : {
            ...s,
            windows: s.windows.map((w) => (w.minimized ? w : { ...w, minimized: true })),
            focused: null,
            left: null,
            right: null,
          }
    case 'replace': {
      const open = findOpen(s, a.noteId)
      if (open?.wid === a.wid) return focus(s, a.wid)
      if (open) {
        // Schon offen: dieses Fenster tritt an die Stelle des ersetzten
        const slot = (side: number | null) => (side === a.wid ? open.wid : side === open.wid ? null : side)
        const removed = remove({ ...s, left: slot(s.left), right: slot(s.right) }, a.wid)
        return focus(removed, open.wid)
      }
      return focus(
        update(s, a.wid, (w) => ({
          noteId: a.noteId,
          categoryName: a.categoryName,
          application: a.application ?? null,
          draft: null,
          version: w.version + 1,
        })),
        a.wid,
      )
    }
    case 'openInSplit': {
      const open = findOpen(s, a.noteId)
      if (open && open.wid === s.left) return focus(s, open.wid)
      if (open) return focus({ ...s, right: open.wid }, open.wid)
      const [next, wid] = addWindow(s, a, null)
      return focus({ ...next, left: next.left ?? wid, right: next.left === null ? null : wid }, wid)
    }
    case 'draft':
      return update(s, a.wid, () => ({ draft: a.draft }))
    case 'saved':
      return update(s, a.wid, (w) => ({
        noteId: a.noteId,
        draft: null,
        // Neue Notiz: Formular frisch mit der gespeicherten starten
        version: w.noteId === a.noteId ? w.version : w.version + 1,
      }))
    case 'move':
      return update(s, a.wid, () => ({ position: a.position }))
    case 'showInPane': {
      if (!s.windows.some((w) => w.wid === a.wid)) return s
      if (a.wid === s.left || a.wid === s.right) return focus(s, a.wid)
      // Das bisher gezeigte Fenster bleibt offen (mit Entwurf), nur eben nicht auf einer Seite
      return focus(
        s.focused !== null && s.focused === s.right ? { ...s, right: a.wid } : { ...s, left: a.wid },
        a.wid,
      )
    }
    case 'enterFullscreen': {
      // Das aktive Fenster kommt nach links, ein bestehender Split bleibt rechts
      const exists = (wid: number | null) =>
        wid !== null && s.windows.some((w) => w.wid === wid && !w.minimized)
      const left = exists(s.focused) ? s.focused : (visibleWindows(s).at(-1)?.wid ?? null)
      const right = exists(s.right) && s.right !== left ? s.right : null
      return { ...s, left, right, focused: left }
    }
  }
}

/** Neue, noch nicht gespeicherte Notiz als Eintrag der Notizliste im Vollbild */
export type DraftEntry = { wid: number; title: string; active: boolean }

/** Ablegen beim Ziehen aus der Notizliste: linke Hälfte ersetzt, rechte öffnet daneben. */
export function dropSide(clientX: number, rect: { left: number; width: number }): 'left' | 'right' {
  return clientX < rect.left + rect.width / 2 ? 'left' : 'right'
}

/** Datentyp beim Ziehen einer Notiz aus der Liste */
export const NOTE_DRAG_TYPE = 'application/x-jobmappe-note'
