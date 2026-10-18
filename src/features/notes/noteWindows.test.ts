import { describe, expect, it } from 'vitest'
import {
  dropSide,
  EMPTY_WORKSPACE,
  noteWorkspaceReducer as reduce,
  visibleWindows,
  type NoteWorkspaceState,
} from './noteWindows'

const open = (s: NoteWorkspaceState, noteId: string | null, position = null) =>
  reduce(s, { type: 'open', noteId, categoryName: null, position })

describe('noteWorkspaceReducer', () => {
  it('öffnet Notizen parallel und holt bereits offene nach vorn', () => {
    let s = open(open(EMPTY_WORKSPACE, 'a'), 'b')
    expect(s.windows.map((w) => w.noteId)).toEqual(['a', 'b'])
    expect(s.focused).toBe(2)

    s = open(s, 'a')
    expect(s.windows).toHaveLength(2)
    expect(s.focused).toBe(1)
    expect(s.windows.find((w) => w.wid === 1)!.z).toBeGreaterThan(s.windows.find((w) => w.wid === 2)!.z)
  })

  it('öffnet für jede neue Notiz ein eigenes Fenster', () => {
    expect(open(open(EMPTY_WORKSPACE, null), null).windows).toHaveLength(2)
  })

  it('merkt sich die vorgewählte Bewerbung neuer Notizen, auch beim Ersetzen', () => {
    const application = { id: 'x', jobTitle: 'Java', companyName: 'Acme' }
    let s = reduce(EMPTY_WORKSPACE, {
      type: 'open',
      noteId: null,
      categoryName: null,
      application,
      position: null,
    })
    expect(s.windows[0]).toMatchObject({ application })
    s = reduce(s, { type: 'replace', wid: 1, noteId: null, categoryName: null })
    expect(s.windows[0]).toMatchObject({ application: null })
  })

  it('schließt ein Fenster und fokussiert das vorderste übrige', () => {
    const s = reduce(open(open(open(EMPTY_WORKSPACE, 'a'), 'b'), 'c'), { type: 'close', wid: 3 })
    expect(s.windows.map((w) => w.noteId)).toEqual(['a', 'b'])
    expect(s.focused).toBe(2) // das vorderste übrige
  })

  it('ersetzt die Notiz eines Fensters und verwirft den Entwurf', () => {
    let s = open(EMPTY_WORKSPACE, 'a')
    s = reduce(s, {
      type: 'draft',
      wid: 1,
      draft: { title: 'x', content: '', categoryId: null, application: null, dirty: true },
    })
    s = reduce(s, { type: 'replace', wid: 1, noteId: 'b', categoryName: null })
    expect(s.windows).toMatchObject([{ wid: 1, noteId: 'b', draft: null, version: 1 }])
  })

  it('setzt ein schon offenes Fenster an die Stelle des ersetzten', () => {
    let s = reduce(open(open(EMPTY_WORKSPACE, 'a'), 'b'), { type: 'enterFullscreen' })
    expect(s).toMatchObject({ left: 2, right: null, focused: 2 })
    s = reduce(s, { type: 'replace', wid: 2, noteId: 'a', categoryName: null })
    expect(s.windows.map((w) => w.noteId)).toEqual(['a'])
    expect(s).toMatchObject({ left: 1, focused: 1 })
  })

  it('öffnet im Split rechts daneben und schließt Seiten', () => {
    let s = reduce(open(EMPTY_WORKSPACE, 'a'), { type: 'enterFullscreen' })
    s = reduce(s, { type: 'openInSplit', noteId: 'b', categoryName: null })
    expect(s).toMatchObject({ left: 1, right: 2, focused: 2 })
    // Die linke Notiz daneben öffnen ändert nichts
    expect(reduce(s, { type: 'openInSplit', noteId: 'a', categoryName: null })).toMatchObject({
      left: 1,
      right: 2,
    })

    s = reduce(s, { type: 'close', wid: 1 })
    expect(s).toMatchObject({ left: 2, right: null, focused: 2 })
  })

  it('übernimmt nach dem Speichern die ID einer neuen Notiz', () => {
    let s = open(EMPTY_WORKSPACE, null)
    s = reduce(s, {
      type: 'draft',
      wid: 1,
      draft: { title: 'x', content: '', categoryId: null, application: null, dirty: true },
    })
    s = reduce(s, { type: 'saved', wid: 1, noteId: 'n' })
    expect(s.windows[0]).toMatchObject({ noteId: 'n', draft: null, version: 1 })
  })

  it('nimmt beim Vollbild das aktive Fenster als linke Seite', () => {
    const s = reduce(open(open(EMPTY_WORKSPACE, 'a'), 'b'), { type: 'focus', wid: 2 })
    expect(reduce(s, { type: 'enterFullscreen' })).toMatchObject({ left: 2, right: null })
    expect(reduce(reduce(s, { type: 'focus', wid: 1 }), { type: 'enterFullscreen' })).toMatchObject({
      left: 1,
    })
  })
})

describe('showInPane', () => {
  it('zeigt ein offenes Fenster auf der aktiven Seite, ohne das bisherige zu schließen', () => {
    let s = reduce(open(open(EMPTY_WORKSPACE, null), 'a'), { type: 'enterFullscreen' })
    expect(s).toMatchObject({ left: 2 })
    s = reduce(s, { type: 'showInPane', wid: 1 })
    expect(s).toMatchObject({ left: 1, focused: 1 })
    expect(s.windows).toHaveLength(2)
  })
})

describe('dropSide', () => {
  it('teilt die Fläche in zwei Hälften', () => {
    expect(dropSide(120, { left: 100, width: 400 })).toBe('left')
    expect(dropSide(320, { left: 100, width: 400 })).toBe('right')
  })
})

describe('Minimieren', () => {
  it('legt ein Fenster in die Leiste und fokussiert das vorderste sichtbare', () => {
    let s = open(open(EMPTY_WORKSPACE, 'a'), 'b')
    s = reduce(s, { type: 'minimize', wid: 2 })
    expect(s.windows.find((w) => w.wid === 2)).toMatchObject({ minimized: true, noteId: 'b' })
    expect(s.focused).toBe(1)
    expect(visibleWindows(s).map((w) => w.noteId)).toEqual(['a'])
  })

  it('holt eine minimierte Notiz per Fokus oder erneutem Öffnen zurück, mit Entwurf', () => {
    let s = open(EMPTY_WORKSPACE, 'a')
    s = reduce(s, {
      type: 'draft',
      wid: 1,
      draft: { title: 'x', content: '', categoryId: null, application: null, dirty: true },
    })
    s = reduce(s, { type: 'minimize', wid: 1 })
    expect(s.focused).toBeNull()
    s = open(s, 'a')
    expect(s.windows).toHaveLength(1)
    expect(s.windows[0]).toMatchObject({ minimized: false, draft: { title: 'x' } })
    expect(s.focused).toBe(1)
  })

  it('minimiert beim Seitenwechsel alle Fenster', () => {
    const s = reduce(open(open(EMPTY_WORKSPACE, 'a'), null), { type: 'minimizeAll' })
    expect(s.windows.every((w) => w.minimized)).toBe(true)
    expect(s).toMatchObject({ focused: null, left: null, right: null })
    expect(reduce(s, { type: 'minimizeAll' })).toBe(s)
  })

  it('übernimmt beim Schließen keine minimierte Notiz als vorderstes Fenster', () => {
    let s = open(open(EMPTY_WORKSPACE, 'a'), 'b')
    s = reduce(s, { type: 'minimize', wid: 1 })
    s = reduce(s, { type: 'close', wid: 2 })
    expect(s.focused).toBeNull()
    expect(s.windows).toMatchObject([{ wid: 1, minimized: true }])
  })
})
