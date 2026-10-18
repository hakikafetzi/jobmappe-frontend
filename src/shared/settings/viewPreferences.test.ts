import { describe, expect, it } from 'vitest'
import {
  APPLICATIONS_VIEW_KEY,
  NOTES_VIEW_KEY,
  readDefaultApplicationsView,
  readDefaultNotesView,
} from './viewPreferences'

describe('viewPreferences', () => {
  it('gilt ohne Eintrag als Kanban bzw. Galerie', () => {
    expect(readDefaultApplicationsView()).toBe('board')
    expect(readDefaultNotesView()).toBe('gallery')
  })

  it('liest „Tabelle“ und übergeht unbekannte Werte', () => {
    localStorage.setItem(APPLICATIONS_VIEW_KEY, 'table')
    localStorage.setItem(NOTES_VIEW_KEY, 'liste')
    expect(readDefaultApplicationsView()).toBe('table')
    expect(readDefaultNotesView()).toBe('gallery')
  })
})
