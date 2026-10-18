import { describe, expect, it } from 'vitest'
import { canMoveTo, moveDialog, outcomesFor } from './transitions'

describe('canMoveTo', () => {
  it('erlaubt aus „In Bearbeitung“ nur „Beworben“', () => {
    expect(canMoveTo('IN_PROGRESS', 'APPLIED')).toBe(true)
    expect(canMoveTo('IN_PROGRESS', 'INTERVIEW')).toBe(false)
    expect(canMoveTo('IN_PROGRESS', 'WAITING')).toBe(false)
    expect(canMoveTo('IN_PROGRESS', 'OFFER')).toBe(false)
  })

  it('erlaubt nach dem Absenden alle laufenden Status, auch zurück nach „In Bearbeitung“', () => {
    expect(canMoveTo('APPLIED', 'OFFER')).toBe(true)
    expect(canMoveTo('OFFER', 'WAITING')).toBe(true)
    expect(canMoveTo('INTERVIEW', 'IN_PROGRESS')).toBe(true)
  })

  it('sperrt abgeschlossene Bewerbungen, Abschlüsse und den eigenen Status', () => {
    expect(canMoveTo('REJECTED', 'APPLIED')).toBe(false)
    expect(canMoveTo('APPLIED', 'REJECTED')).toBe(false)
    expect(canMoveTo('APPLIED', 'APPLIED')).toBe(false)
  })
})

describe('outcomesFor', () => {
  it('bietet je Status die passenden Ausgänge', () => {
    expect(outcomesFor('IN_PROGRESS')).toEqual(['WITHDRAWN'])
    expect(outcomesFor('APPLIED')).toEqual(['REJECTED', 'NO_RESPONSE', 'WITHDRAWN'])
    expect(outcomesFor('INTERVIEW')).toEqual(['REJECTED', 'NO_RESPONSE', 'WITHDRAWN'])
    expect(outcomesFor('WAITING')).toEqual(['REJECTED', 'NO_RESPONSE', 'WITHDRAWN'])
    expect(outcomesFor('OFFER')).toEqual(['OFFER_ACCEPTED', 'OFFER_REJECTED'])
    expect(outcomesFor('WITHDRAWN')).toEqual([])
  })
})

describe('moveDialog', () => {
  it('fragt beim Absenden nach dem Weg und beim Zurücksetzen nach Bestätigung', () => {
    expect(moveDialog('IN_PROGRESS', 'APPLIED')).toBe('apply')
    expect(moveDialog('OFFER', 'IN_PROGRESS')).toBe('reset')
    expect(moveDialog('REJECTED', 'IN_PROGRESS')).toBe('reset')
    expect(moveDialog('APPLIED', 'WAITING')).toBeNull()
  })
})
