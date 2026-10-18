import { describe, expect, it } from 'vitest'
import { readThemePreference, setThemePreference, THEME_STORAGE_KEY } from './theme'

describe('Erscheinungsbild', () => {
  it('ist ohne gespeicherte Wahl „System“', () => {
    expect(readThemePreference()).toBe('system')
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })

  it('speichert Hell/Dunkel im localStorage und setzt data-theme', () => {
    setThemePreference('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(readThemePreference()).toBe('dark')
  })

  it('„System“ entfernt die Wahl wieder', () => {
    setThemePreference('light')
    setThemePreference('system')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull()
    expect(document.documentElement.dataset.theme).toBeUndefined()
  })

  it('ignoriert unbekannte gespeicherte Werte', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'lila')
    expect(readThemePreference()).toBe('system')
  })
})
