import { afterEach, describe, expect, it } from 'vitest'
import { handOverDraft, takeDraft } from './noteDraftHandoff'

afterEach(() => localStorage.clear())

describe('noteDraftHandoff', () => {
  it('übergibt den Entwurf genau einmal', () => {
    const application = { id: 'a', jobTitle: 'Java-Entwickler', companyName: 'Acme' }
    const draft = { title: 'T', content: 'C', categoryId: 'k', application: 'none' as const, dirty: true }
    const handed = { draft, categoryName: 'Recherche', application }
    const token = handOverDraft(handed)
    expect(takeDraft(token)).toEqual(handed)
    expect(localStorage.length).toBe(0)
    // Erneutes Lesen im selben Fenster (StrictMode) liefert denselben Entwurf
    expect(takeDraft(token)).toEqual(handed)
  })

  it('ignoriert fehlende und kaputte Einträge', () => {
    expect(takeDraft(null)).toBeNull()
    localStorage.setItem('jobmappe.noteDraft.x', '{kaputt')
    expect(takeDraft('x')).toBeNull()
  })
})
