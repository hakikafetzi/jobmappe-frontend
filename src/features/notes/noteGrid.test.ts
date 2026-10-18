import { describe, expect, it } from 'vitest'
import { fitPageSize, NOTE_GRID, pageForSize } from './noteGrid'

describe('noteGrid', () => {
  it('zählt ganze Spalten und Zeilen, die in die Fläche passen', () => {
    const { minWidth, height, gap } = NOTE_GRID
    // genau 3 Spalten und 4 Zeilen
    expect(fitPageSize(3 * minWidth + 2 * gap, 4 * height + 3 * gap)).toBe(12)
    // ein Pixel weniger: eine Zeile weniger
    expect(fitPageSize(3 * minWidth + 2 * gap, 4 * height + 3 * gap - 1)).toBe(9)
    // schmal und niedrig: mindestens eine Karte
    expect(fitPageSize(200, 50)).toBe(1)
    expect(fitPageSize(0, 500)).toBeNull()
    expect(fitPageSize(100_000, 100_000)).toBe(100)
  })

  it('behält beim Umrechnen die erste Notiz der Seite im Blick', () => {
    expect(pageForSize(2, 12, 6)).toBe(4) // Notiz 24 → Seite 4 bei 6 pro Seite
    expect(pageForSize(3, 6, 12)).toBe(1) // Notiz 18 → Seite 1 bei 12 pro Seite
    expect(pageForSize(0, 6, 20)).toBe(0)
  })
})
