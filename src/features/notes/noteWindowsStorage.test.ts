import { describe, expect, it } from 'vitest'
import { EMPTY_WORKSPACE, noteWorkspaceReducer as reduce } from './noteWindows'
import { loadNoteWindows, NOTE_WINDOWS_STORAGE_KEY, saveNoteWindows } from './noteWindowsStorage'

describe('noteWindowsStorage', () => {
  it('merkt sich die Fenster samt Entwurf; geladen liegen alle unten in der Leiste', () => {
    const application = { id: 'x', jobTitle: 'Java', companyName: 'Acme' }
    let s = reduce(EMPTY_WORKSPACE, { type: 'open', noteId: 'a', categoryName: null, position: null })
    s = reduce(s, {
      type: 'open',
      noteId: null,
      categoryName: 'Recherche',
      application,
      scope: application,
      position: null,
    })
    s = reduce(s, {
      type: 'draft',
      wid: 2,
      draft: { title: 'Neu', content: 'Text', categoryId: null, application: null, dirty: true },
    })
    saveNoteWindows(s)

    const loaded = loadNoteWindows()
    expect(loaded.windows).toMatchObject([
      { wid: 1, noteId: 'a', minimized: true },
      { wid: 2, noteId: null, categoryName: 'Recherche', application, scope: application, minimized: true },
    ])
    expect(loaded.windows[1]?.draft).toMatchObject({ title: 'Neu', dirty: true })
    expect(loaded).toMatchObject({ focused: null, left: null, nextWid: 3 })
  })

  it('räumt ohne Fenster auf und ignoriert kaputte Einträge', () => {
    saveNoteWindows(EMPTY_WORKSPACE)
    expect(localStorage.getItem(NOTE_WINDOWS_STORAGE_KEY)).toBeNull()
    localStorage.setItem(NOTE_WINDOWS_STORAGE_KEY, '{kaputt')
    expect(loadNoteWindows()).toEqual(EMPTY_WORKSPACE)
    localStorage.setItem(NOTE_WINDOWS_STORAGE_KEY, JSON.stringify([{ noteId: 42 }, { noteId: 'b' }]))
    expect(loadNoteWindows().windows).toMatchObject([{ wid: 1, noteId: 'b' }])
  })
})
