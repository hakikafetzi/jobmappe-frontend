import { describe, expect, it } from 'vitest'
import { greetingFor } from './homeText'

describe('greetingFor', () => {
  it('grüßt nach Tageszeit mit dem Vornamen', () => {
    expect(greetingFor(9, 'Anna Beispiel')).toBe('Guten Morgen, Anna')
    expect(greetingFor(14, 'Anna Beispiel')).toBe('Hallo, Anna')
    expect(greetingFor(20, 'Anna Beispiel')).toBe('Guten Abend, Anna')
  })

  it('lässt den Namen weg, wenn keiner da ist', () => {
    expect(greetingFor(9, '  ')).toBe('Guten Morgen')
  })
})
