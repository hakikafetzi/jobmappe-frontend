import { describe, expect, it } from 'vitest'
import { isPostalCode } from './postalCode'

describe('isPostalCode', () => {
  it('akzeptiert deutsche und ausländische Formate', () => {
    for (const code of ['60311', ' 01067 ', '1010', 'SW1A 1AA', '1012 AB', 'D-60311']) {
      expect(isPostalCode(code)).toBe(true)
    }
  })

  it('lehnt Buchstaben ohne Ziffer, Sonderzeichen und falsche Längen ab', () => {
    for (const code of ['abc', 'Frankfurt', '12', '60311!', '12345678901', '-6031']) {
      expect(isPostalCode(code)).toBe(false)
    }
  })
})
