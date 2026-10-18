import { describe, expect, it } from 'vitest'
import {
  addMonths,
  dayLabel,
  formatGermanDate,
  inRange,
  maskDateInput,
  monthGrid,
  parseGermanDate,
} from './germanDate'

describe('parseGermanDate', () => {
  it('liest TT.MM.JJJJ und kurze Schreibweisen', () => {
    expect(parseGermanDate('01.09.2026')).toBe('2026-09-01')
    expect(parseGermanDate('1.9.2026')).toBe('2026-09-01')
    expect(parseGermanDate('01.09.26')).toBe('2026-09-01')
    expect(parseGermanDate('01092026')).toBe('2026-09-01')
    expect(parseGermanDate(' 29.02.2028 ')).toBe('2028-02-29')
  })

  it('lehnt unvollständige und unmögliche Daten ab', () => {
    expect(parseGermanDate('')).toBeNull()
    expect(parseGermanDate('01.09.')).toBeNull()
    expect(parseGermanDate('31.04.2026')).toBeNull()
    expect(parseGermanDate('29.02.2026')).toBeNull()
    expect(parseGermanDate('2026-09-01')).toBeNull()
  })
})

describe('maskDateInput', () => {
  it('setzt beim Tippen die Punkte selbst', () => {
    expect(maskDateInput('0', '01')).toBe('01.')
    expect(maskDateInput('01.0', '01.09')).toBe('01.09.')
    expect(maskDateInput('01.09.202', '01.09.2026')).toBe('01.09.2026')
  })

  it('lässt beim Löschen keine Punkte zurückkommen und macht aus anderen Trennern Punkte', () => {
    expect(maskDateInput('01.', '01')).toBe('01')
    expect(maskDateInput('', '1/9/2026')).toBe('1.9.2026')
    expect(maskDateInput('', '1a9')).toBe('19.')
    expect(maskDateInput('01.09.2026', '01.09.20261')).toBe('01.09.2026')
  })
})

describe('Kalender', () => {
  it('zeigt sechs Wochen ab Montag', () => {
    const grid = monthGrid('2026-09-15')
    expect(grid).toHaveLength(6)
    expect(grid[0]![0]).toBe('2026-08-31') // 1. September 2026 ist ein Dienstag
    expect(grid[5]![6]).toBe('2026-10-11')
  })

  it('springt Monate ohne Überlauf', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2026-03-15', -12)).toBe('2025-03-15')
  })

  it('formatiert, prüft Grenzen und liest vor', () => {
    expect(formatGermanDate('2026-09-01')).toBe('01.09.2026')
    expect(formatGermanDate('')).toBe('')
    expect(inRange('2026-09-02', undefined, '2026-09-01')).toBe(false)
    expect(inRange('2026-09-01', '2026-09-01', '2026-09-01T10:00')).toBe(true)
    expect(dayLabel('2026-09-01')).toBe('Dienstag, 1. September 2026')
  })
})
