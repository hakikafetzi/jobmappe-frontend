import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_NOTE_DIALOG_PREFS,
  loadNoteDialogPrefs,
  NOTE_DIALOG_STORAGE_KEY,
  saveNoteDialogPrefs,
} from './noteDialogPrefs'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('noteDialogPrefs', () => {
  it('liest gespeicherte Werte und begrenzt sie aufs Fenster', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(900)
    saveNoteDialogPrefs({
      width: 1000,
      height: 5000,
      position: { x: 3000, y: 20 },
      fullscreen: true,
      sidebarWidth: 900,
      sidebarCollapsed: true,
    })
    expect(loadNoteDialogPrefs()).toEqual({
      width: 1000,
      height: 804,
      position: { x: 1320, y: 20 },
      fullscreen: true,
      sidebarWidth: 640,
      sidebarCollapsed: true,
    })
  })

  it('fällt bei kaputtem Wert oder gesperrtem Speicher auf den Standard zurück', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(1000)
    localStorage.setItem(NOTE_DIALOG_STORAGE_KEY, '{kaputt')
    expect(loadNoteDialogPrefs()).toEqual(DEFAULT_NOTE_DIALOG_PREFS)

    localStorage.setItem(NOTE_DIALOG_STORAGE_KEY, '{"position":{"x":"a"},"sidebarWidth":null}')
    expect(loadNoteDialogPrefs()).toEqual(DEFAULT_NOTE_DIALOG_PREFS)

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('gesperrt')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('gesperrt')
    })
    expect(() => saveNoteDialogPrefs({ ...DEFAULT_NOTE_DIALOG_PREFS, fullscreen: true })).not.toThrow()
    expect(loadNoteDialogPrefs()).toEqual(DEFAULT_NOTE_DIALOG_PREFS)
  })

  it('ersetzt die frühere Standardbreite der Notizliste durch die neue', () => {
    vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1440)
    saveNoteDialogPrefs({ ...DEFAULT_NOTE_DIALOG_PREFS, sidebarWidth: 280 })
    expect(loadNoteDialogPrefs().sidebarWidth).toBe(360)
    saveNoteDialogPrefs({ ...DEFAULT_NOTE_DIALOG_PREFS, sidebarWidth: 300 })
    expect(loadNoteDialogPrefs().sidebarWidth).toBe(300)
  })
})
