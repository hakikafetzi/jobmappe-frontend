import { describe, expect, it } from 'vitest'
import type { JobPostingDetail } from '../../../api/types'
import { toFormValues, toPostingRequest } from './postingForm'

const posting: JobPostingDetail = {
  id: 'p1',
  company: {
    id: 'c1',
    name: 'Beispiel Energie AG',
    website: null,
    street: null,
    postalCode: null,
    city: null,
  },
  title: 'Dev',
  description: null,
  location: 'Frankfurt',
  url: 'https://x',
  status: 'ACTIVE',
  hasApplication: false,
  applicationId: null,
  publishedAt: '2026-08-21T00:00:00',
  createdAt: '2026-08-21T10:00:00',
  archivedAt: null,
}

describe('Stelle bearbeiten: Formular → Anfrage', () => {
  it('übernimmt die Stelle ins Formular', () => {
    expect(toFormValues(posting)).toEqual({
      url: 'https://x',
      title: 'Dev',
      location: 'Frankfurt',
      publishedAt: '2026-08-21',
      status: 'ACTIVE',
      description: '',
    })
  })

  it('meldet fehlende Pflichtfelder und Daten in der Zukunft', () => {
    const v = toFormValues(posting)
    expect(toPostingRequest({ ...v, url: ' ' }, '2026-09-01')).toMatchObject({ error: { field: 'url' } })
    expect(toPostingRequest({ ...v, title: '' }, '2026-09-01')).toMatchObject({ error: { field: 'title' } })
    expect(toPostingRequest({ ...v, publishedAt: '2026-09-02' }, '2026-09-01')).toMatchObject({
      error: { field: 'publishedAt' },
    })
  })

  it('trimmt und sendet leere optionale Felder als null', () => {
    const v = {
      ...toFormValues(posting),
      title: ' Senior Dev ',
      location: '  ',
      publishedAt: '',
      status: 'INACTIVE' as const,
    }
    expect(toPostingRequest(v, '2026-09-01')).toEqual({
      body: {
        title: 'Senior Dev',
        url: 'https://x',
        location: null,
        publishedAt: null,
        description: null,
        status: 'INACTIVE',
      },
    })
  })
})
