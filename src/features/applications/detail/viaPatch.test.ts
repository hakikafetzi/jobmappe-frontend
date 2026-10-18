import { describe, expect, it } from 'vitest'
import { buildViaPatch } from './viaPatch'

describe('Bewerbungsweg: PATCH nur mit geänderten, gesetzten Werten', () => {
  it('lässt leere und unveränderte Felder weg', () => {
    const current = { appliedVia: 'EMAIL', portalUrl: null } as const
    expect(buildViaPatch(current, { way: 'EMAIL', url: '' })).toEqual({})
    expect(buildViaPatch(current, { way: null, url: '  ' })).toEqual({})
    expect(buildViaPatch(current, { way: 'ONLINE', url: ' https://p ' })).toEqual({
      appliedVia: 'ONLINE',
      portalUrl: 'https://p',
    })
  })
})
