import { describe, expect, it } from 'vitest'
import { EMPTY_VALUES, toCreatePostingInput } from './newPostingForm'

describe('Stelle erfassen: Formular → Anfrage', () => {
  const company = { id: 'c1', name: 'Beispiel Energie AG', jobsCount: 1 }

  it('meldet das erste fehlende Pflichtfeld', () => {
    expect(toCreatePostingInput(EMPTY_VALUES, '2026-09-01')).toEqual({
      error: { field: 'url', message: 'Bitte den Link zur Anzeige eintragen.' },
    })
    const noCompany = { ...EMPTY_VALUES, url: 'https://x', title: 'Dev' }
    expect(toCreatePostingInput(noCompany, '2026-09-01')).toMatchObject({ error: { field: 'company' } })
  })

  it('verbietet ein Veröffentlichungsdatum in der Zukunft', () => {
    const v = {
      ...EMPTY_VALUES,
      url: 'https://x',
      title: 'Dev',
      company: { kind: 'existing' as const, company },
      publishedAt: '2026-09-02',
    }
    expect(toCreatePostingInput(v, '2026-09-01')).toMatchObject({ error: { field: 'publishedAt' } })
  })

  it('baut die Anfrage für vorhandene und neue Firmen', () => {
    const base = { ...EMPTY_VALUES, url: ' https://x ', title: ' Dev ', location: '  ' }
    expect(toCreatePostingInput({ ...base, company: { kind: 'existing', company } }, '2026-09-01')).toEqual({
      input: {
        companyId: 'c1',
        posting: {
          title: 'Dev',
          url: 'https://x',
          location: null,
          publishedAt: null,
          description: null,
          status: 'ACTIVE',
        },
      },
    })
    const created = toCreatePostingInput(
      {
        ...base,
        company: { kind: 'new', name: 'Neu GmbH' },
        newCompany: { website: 'neu.de', street: ' Hauptstr. 1 ', postalCode: '60311', city: '  ' },
      },
      '2026-09-01',
    )
    expect(created).toMatchObject({
      input: {
        newCompany: {
          name: 'Neu GmbH',
          website: 'neu.de',
          street: 'Hauptstr. 1',
          postalCode: '60311',
          city: null,
        },
      },
    })
  })
})
