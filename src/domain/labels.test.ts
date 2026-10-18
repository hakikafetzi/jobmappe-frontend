import { describe, expect, it } from 'vitest'
import { APP_CHANNEL, statusLook } from './labels'

describe('Labels', () => {
  it('liefert Label und Farbe für Status-Chips', () => {
    expect(statusLook('INTERVIEW')).toEqual({ label: 'Gespräch', color: 'var(--green)' })
    expect(statusLook('NO_RESPONSE').label).toBe('Keine Rückmeldung')
  })

  it('benennt jeden Bewerbungsweg', () => {
    expect(Object.keys(APP_CHANNEL)).toEqual([
      'ONLINE',
      'EMAIL',
      'PHONE',
      'IN_PERSON',
      'POSTAL_MAIL',
      'OTHER',
    ])
    expect(APP_CHANNEL.POSTAL_MAIL).toBe('Post')
  })
})
