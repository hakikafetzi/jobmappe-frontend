import { describe, expect, it } from 'vitest'
import { isWebUrl, normalizeUrl } from './url'

describe('normalizeUrl', () => {
  it('trimmt und ergänzt https:// ohne Schema', () => {
    expect(normalizeUrl('  firma.example/jobs ')).toBe('https://firma.example/jobs')
    expect(normalizeUrl('http://firma.example')).toBe('http://firma.example')
    expect(normalizeUrl('   ')).toBe('')
  })

  it('lässt fremde Schemata stehen, damit die Prüfung sie ablehnt', () => {
    expect(normalizeUrl('javascript:alert(1)')).toBe('javascript:alert(1)')
  })
})

describe('isWebUrl', () => {
  it('akzeptiert http(s)-Adressen mit Host', () => {
    expect(isWebUrl('https://firma.example/jobs?id=1')).toBe(true)
    expect(isWebUrl('http://localhost:8080')).toBe(true)
  })

  it('lehnt andere Schemata, fehlende Hosts und Leerzeichen ab', () => {
    expect(isWebUrl('javascript:alert(1)')).toBe(false)
    expect(isWebUrl('ftp://firma.example')).toBe(false)
    expect(isWebUrl('https://')).toBe(false)
    expect(isWebUrl('https://mit leerzeichen.example')).toBe(false)
    expect(isWebUrl('https://firma.example/a b')).toBe(false)
  })
})
