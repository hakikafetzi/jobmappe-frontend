import { describe, expect, it } from 'vitest'
import { INVALID_URL } from '../../../shared/lib/url'
import { buildViaPatch, viaUrlError } from './viaPatch'

describe('Bewerbungsweg: PATCH nur mit geänderten, gesetzten Werten', () => {
  it('lässt leere und unveränderte Felder weg', () => {
    const current = { appliedVia: 'EMAIL', portalUrl: null } as const
    expect(buildViaPatch(current, { way: 'EMAIL', url: '' })).toEqual({})
    expect(buildViaPatch(current, { way: null, url: '  ' })).toEqual({})
    expect(buildViaPatch(current, { way: 'ONLINE', url: ' https://p.example ' })).toEqual({
      appliedVia: 'ONLINE',
      portalUrl: 'https://p.example',
    })
  })
})

describe('Bewerbungsweg: Link zum Portal', () => {
  it('ist freiwillig, muss sich aber öffnen lassen', () => {
    expect(viaUrlError({ way: null, url: '  ' })).toBeNull()
    expect(viaUrlError({ way: null, url: 'portal.example/status' })).toBeNull()
    expect(viaUrlError({ way: null, url: 'javascript:alert(1)' })).toBe(INVALID_URL)
  })

  it('ergänzt https:// vor dem Senden', () => {
    expect(
      buildViaPatch({ appliedVia: null, portalUrl: null }, { way: null, url: 'portal.example' }),
    ).toEqual({
      portalUrl: 'https://portal.example',
    })
  })
})
