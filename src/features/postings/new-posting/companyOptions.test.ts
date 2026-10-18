import { describe, expect, it } from 'vitest'
import { companyOptions } from './companyOptions'

describe('Firmen-Combobox', () => {
  const companies = [
    { id: '1', name: 'Beispiel Energie AG', jobsCount: 1 },
    { id: '2', name: 'Musterbank AG', jobsCount: 2 },
  ]

  it('bietet „neu anlegen“ vor den geladenen Firmen, aber nicht bei vorhandenem Namen', () => {
    expect(companyOptions(companies, 'bank', false).map((o) => o.kind)).toEqual([
      'new',
      'existing',
      'existing',
    ])
    expect(companyOptions(companies, 'musterbank ag', false).map((o) => o.kind)).toEqual([
      'existing',
      'existing',
    ])
  })

  it('filtert nicht und hängt „Weitere laden“ an, solange es weitere Seiten gibt', () => {
    expect(companyOptions(companies, '', false)).toHaveLength(2)
    expect(companyOptions(companies, '', true).at(-1)?.kind).toBe('more')
  })
})
