import { describe, expect, it } from 'vitest'
import {
  effectiveNoteCategory,
  headerSort,
  notesListParams,
  parseNoteSort,
  parseNotesView,
  sortOnHeaderClick,
} from './selectNotes'

describe('selectNotes', () => {
  it('lässt nur bekannte Sortierungen durch', () => {
    expect(parseNoteSort('edited')).toBe('edited')
    expect(parseNoteSort('content')).toBe('new')
    expect(parseNoteSort(null)).toBe('new')
  })

  it('liest die Ansicht aus der URL, sonst gilt die Standardansicht', () => {
    expect(parseNotesView('tabelle', 'gallery')).toBe('table')
    expect(parseNotesView('galerie', 'table')).toBe('gallery')
    expect(parseNotesView(null, 'table')).toBe('table')
    expect(parseNotesView('karten', 'gallery')).toBe('gallery')
  })

  it('ignoriert den Ordner, solange gesucht wird', () => {
    expect(effectiveNoteCategory('k', 'gehalt')).toBeUndefined()
    expect(effectiveNoteCategory('k', '')).toBe('k')
    expect(effectiveNoteCategory(null, '')).toBeUndefined()
  })

  it('sendet Suche oder Ordner, nie beides', () => {
    const base = { sort: 'title' as const, page: 1, size: 15 }
    expect(notesListParams({ ...base, search: 'x', categoryId: 'k' })).toEqual({
      page: 1,
      size: 15,
      sort: ['title,asc'],
      q: 'x',
    })
    expect(notesListParams({ ...base, search: '', categoryId: 'k' })).toMatchObject({ noteCategoryId: 'k' })
    expect(notesListParams({ ...base, search: '', categoryId: undefined })).not.toHaveProperty(
      'noteCategoryId',
    )
  })

  it('ordnet die Spaltenköpfe der Tabelle den Sortierungen des Backends zu', () => {
    expect(headerSort('new', 'created')).toBe('desc')
    expect(headerSort('old', 'created')).toBe('asc')
    expect(headerSort('new', 'edited')).toBeNull()
    expect(headerSort('title', 'title')).toBe('asc')
    expect(sortOnHeaderClick('new', 'created')).toBe('old')
    expect(sortOnHeaderClick('old', 'created')).toBe('new')
    expect(sortOnHeaderClick('title', 'created')).toBe('new')
    expect(sortOnHeaderClick('new', 'edited')).toBe('edited')
    expect(sortOnHeaderClick('edited', 'title')).toBe('title')
  })
})
