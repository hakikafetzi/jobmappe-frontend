import { describe, expect, it } from 'vitest'
import { clampPosition, clampSize } from './dialogSize'

const viewport = { width: 1440, height: 900 }

describe('clampSize', () => {
  it('lässt Größen innerhalb der Grenzen unverändert', () => {
    expect(clampSize({ width: 900, height: 600 }, viewport)).toEqual({ width: 900, height: 600 })
  })

  it('begrenzt auf Mindestmaß und Fenster', () => {
    expect(clampSize({ width: 100, height: 100 }, viewport)).toEqual({ width: 560, height: 420 })
    expect(clampSize({ width: 5000, height: 5000 }, viewport)).toEqual({ width: 1400, height: 804 })
  })

  it('gibt bei kleinem Fenster dem Fenster den Vorrang', () => {
    expect(clampSize({ width: 900, height: 600 }, { width: 500, height: 400 })).toEqual({
      width: 460,
      height: 304,
    })
  })
})

describe('clampPosition', () => {
  const size = { width: 800, height: 600 }

  it('lässt Lagen im Fenster unverändert', () => {
    expect(clampPosition({ x: 300, y: 40 }, size, viewport)).toEqual({ x: 300, y: 40 })
  })

  it('hält den Dialog greifbar: Kopfleiste oben, mindestens 120 px seitlich', () => {
    expect(clampPosition({ x: -2000, y: -50 }, size, viewport)).toEqual({ x: -680, y: 0 })
    expect(clampPosition({ x: 2000, y: 2000 }, size, viewport)).toEqual({ x: 1320, y: 844 })
  })
})
