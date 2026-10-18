import { describe, expect, it } from 'vitest'
import { DISPLAY_NAME_KEY, DISPLAY_NAME_MAX_LENGTH, readDisplayName, setDisplayName } from './displayName'

describe('displayName', () => {
  it('ist ohne Eintrag leer', () => {
    expect(readDisplayName()).toBe('')
  })

  it('speichert den Namen wie getippt und kürzt zu lange Namen', () => {
    setDisplayName('Anna ')
    expect(localStorage.getItem(DISPLAY_NAME_KEY)).toBe('Anna ')
    setDisplayName('x'.repeat(DISPLAY_NAME_MAX_LENGTH + 5))
    expect(readDisplayName()).toHaveLength(DISPLAY_NAME_MAX_LENGTH)
  })

  it('entfernt einen leeren Namen', () => {
    setDisplayName('Anna')
    setDisplayName('   ')
    expect(localStorage.getItem(DISPLAY_NAME_KEY)).toBeNull()
  })
})
