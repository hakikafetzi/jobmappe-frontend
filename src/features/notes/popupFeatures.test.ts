import { describe, expect, it } from 'vitest'
import { notePopupFeatures, notePopupRect } from './popupFeatures'

describe('notePopupFeatures', () => {
  it('öffnet 720 × 760 mittig über dem App-Fenster', () => {
    const app = {
      availWidth: 1920,
      availHeight: 1055,
      screenX: 0,
      screenY: 25,
      outerWidth: 1920,
      outerHeight: 1030,
    }
    expect(notePopupFeatures(notePopupRect(app))).toBe('width=720,height=760,left=600,top=160')
  })

  it('bleibt auf kleinen Bildschirmen deutlich kleiner als der Bildschirm', () => {
    const app = {
      availWidth: 800,
      availHeight: 700,
      screenX: 0,
      screenY: 0,
      outerWidth: 800,
      outerHeight: 700,
    }
    expect(notePopupFeatures(notePopupRect(app))).toBe('width=640,height=595,left=80,top=53')
  })
})
