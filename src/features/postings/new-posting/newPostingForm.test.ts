import { describe, expect, it } from 'vitest'
import { INVALID_URL } from '../../../shared/lib/url'
import { EMPTY_VALUES, toCreatePostingInput } from './newPostingForm'

describe('Stelle erfassen: Formular → Anfrage', () => {
  const company = { id: 'c1', name: 'Beispiel Energie AG', jobsCount: 1 }

  it('meldet alle fehlenden Pflichtfelder auf einmal', () => {
    expect(toCreatePostingInput(EMPTY_VALUES, '2026-09-01')).toEqual({
      errors: {
        url: 'Bitte den Link zur Anzeige eintragen.',
        title: 'Bitte einen Titel eingeben.',
        company: 'Bitte eine Firma auswählen oder anlegen.',
      },
    })
    const noCompany = { ...EMPTY_VALUES, url: 'https://x', title: 'Dev' }
    expect(toCreatePostingInput(noCompany, '2026-09-01')).toEqual({
      errors: { company: 'Bitte eine Firma auswählen oder anlegen.' },
    })
  })

  it('verlangt einen öffnbaren Link und ergänzt https://', () => {
    const v = { ...EMPTY_VALUES, title: 'Dev', company: { kind: 'existing' as const, company } }
    expect(toCreatePostingInput({ ...v, url: 'javascript:alert(1)' }, '2026-09-01')).toEqual({
      errors: { url: INVALID_URL },
    })
    expect(toCreatePostingInput({ ...v, url: 'firma.example/jobs/1' }, '2026-09-01')).toMatchObject({
      input: { posting: { url: 'https://firma.example/jobs/1' } },
    })
  })

  it('prüft die Webseite einer neuen Firma', () => {
    const v = {
      ...EMPTY_VALUES,
      url: 'https://x',
      title: 'Dev',
      company: { kind: 'new' as const, name: 'Neue Firma GmbH' },
      newCompany: { ...EMPTY_VALUES.newCompany, website: 'keine webseite' },
    }
    expect(toCreatePostingInput(v, '2026-09-01')).toEqual({ errors: { website: INVALID_URL } })
  })

  it('verbietet ein Veröffentlichungsdatum in der Zukunft', () => {
    const v = {
      ...EMPTY_VALUES,
      url: 'https://x',
      title: 'Dev',
      company: { kind: 'existing' as const, company },
      publishedAt: '2026-09-02',
    }
    expect(toCreatePostingInput(v, '2026-09-01')).toMatchObject({
      errors: { publishedAt: expect.any(String) },
    })
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
