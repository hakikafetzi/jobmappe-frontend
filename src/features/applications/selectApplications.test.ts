import { describe, expect, it } from 'vitest'
import { ageLevel } from './age'
import { apiTableSort, parsePriorityFilter, parseStatusFilter, parseTableSort } from './selectApplications'

describe('parseStatusFilter', () => {
  it('kennt nur einzelne Status, sonst „alle“', () => {
    expect(parseStatusFilter('APPLIED')).toBe('APPLIED')
    expect(parseStatusFilter('open')).toBe('all')
    expect(parseStatusFilter(null)).toBe('all')
  })
})

describe('parsePriorityFilter', () => {
  it('übernimmt gültige Prioritäten', () => {
    expect(parsePriorityFilter('HIGH')).toBe('HIGH')
    expect(parsePriorityFilter('toString')).toBe('all')
    expect(parsePriorityFilter('x')).toBe('all')
  })
})

describe('Tabellen-Sortierung', () => {
  it('liest die Sortierung aus der URL und fällt sonst auf „Wartet absteigend“ zurück', () => {
    expect(parseTableSort('title-auf')).toEqual({ key: 'title', dir: 1 })
    expect(parseTableSort('status-ab')).toEqual({ key: 'status', dir: -1 })
    expect(parseTableSort('kaputt')).toEqual({ key: 'days', dir: -1 })
  })

  it('übersetzt sie in Backend-Properties; „Wartet“ sortiert umgekehrt nach appliedAt', () => {
    expect(apiTableSort({ key: 'title', dir: 1 })).toBe('jobPosting.title,asc')
    expect(apiTableSort({ key: 'applied', dir: -1 })).toBe('appliedAt,desc')
    expect(apiTableSort({ key: 'days', dir: -1 })).toBe('appliedAt,asc')
    expect(apiTableSort({ key: 'days', dir: 1 })).toBe('appliedAt,desc')
  })
})

describe('ageLevel', () => {
  it('stuft die Wartezeit relativ zu „überfällig nach“ ein', () => {
    expect(ageLevel(null, 20)).toBe(0)
    expect(ageLevel(3, 20)).toBe(0)
    expect(ageLevel(7, 20)).toBe(1)
    expect(ageLevel(20, 20)).toBe(2)
    expect(ageLevel(40, 20)).toBe(3)
  })
})
