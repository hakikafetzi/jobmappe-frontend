import { describe, expect, it } from 'vitest'
import {
  addressLines,
  daysSince,
  fmtDate,
  initials,
  percent,
  plural,
  shortCompanyName,
  shortTitle,
  websiteHref,
  websiteLabel,
} from './format'

describe('fmtDate', () => {
  it('formatiert LocalDate und LocalDateTime (auch mit Mikrosekunden)', () => {
    expect(fmtDate('2026-09-01')).toBe('01.09.2026')
    expect(fmtDate('2026-09-29T20:27:51.014685')).toBe('29.09.2026')
    expect(fmtDate(null)).toBe('—')
  })
})

describe('daysSince', () => {
  const now = new Date(2026, 8, 1, 9, 30)
  it('zählt Kalendertage unabhängig von der Uhrzeit', () => {
    expect(daysSince('2026-08-16', now)).toBe(16)
    expect(daysSince('2026-09-01T23:59:00', now)).toBe(0)
    expect(daysSince(null, now)).toBeNull()
  })
})

describe('Texthelfer', () => {
  it('kürzt den Gender-Zusatz', () => {
    expect(shortTitle('Junior Java Entwickler (m/w/d) Backend')).toBe('Junior Java Entwickler Backend')
  })

  it('bildet Initialen ohne Rechtsform', () => {
    expect(initials('Beispiel Consulting GmbH & Co. KG')).toBe('BC')
    expect(initials('musterportal SE')).toBe('M')
  })

  it('ergänzt bei Webseiten das Schema nur bei Bedarf', () => {
    expect(websiteHref('musterportal.example')).toBe('https://musterportal.example')
    expect(websiteHref('https://www.mustermann.example/de')).toBe('https://www.mustermann.example/de')
    expect(websiteLabel('https://www.mustermann.example/de/')).toBe('www.mustermann.example/de')
  })

  it('setzt die Anschrift aus den vorhandenen Teilen zusammen', () => {
    expect(addressLines({ street: 'Bankplatz 1', postalCode: '60311', city: 'Frankfurt am Main' })).toEqual([
      'Bankplatz 1',
      '60311 Frankfurt am Main',
    ])
    expect(addressLines({ street: null, postalCode: null, city: 'Dortmund' })).toEqual(['Dortmund'])
    expect(addressLines({ street: null, postalCode: null, city: null })).toEqual([])
  })

  it('plural und percent', () => {
    expect(plural(1, 'Stelle', 'Stellen')).toBe('1 Stelle')
    expect(plural(3, 'Stelle', 'Stellen')).toBe('3 Stellen')
    expect(percent(1, 3)).toBe(33)
    expect(percent(1, 0)).toBe(0)
  })
})

describe('shortCompanyName', () => {
  it('lässt die Rechtsform am Ende weg', () => {
    expect(shortCompanyName('Mustermann GmbH & Co. KG')).toBe('Mustermann')
    expect(shortCompanyName('Muster Finanz AG')).toBe('Muster Finanz')
    expect(shortCompanyName('Beispiel Vergleichsportal')).toBe('Beispiel Vergleichsportal')
  })
})
