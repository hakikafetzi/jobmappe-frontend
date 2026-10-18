import { describe, expect, it, vi } from 'vitest'
import { prefersReducedMotion } from '../lib/motion'
import { MOTION_STORAGE_KEY, readMotionPreference, setMotionPreference } from './motionPreference'

describe('Animationen', () => {
  it('sind ohne gespeicherte Wahl an', () => {
    expect(readMotionPreference()).toBe('on')
    expect(document.documentElement.dataset.motion).toBeUndefined()
    expect(prefersReducedMotion()).toBe(false)
  })

  it('speichert „Aus“ im localStorage, setzt data-motion und gilt dann als reduzierte Bewegung', () => {
    setMotionPreference('off')
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe('off')
    expect(document.documentElement.dataset.motion).toBe('off')
    expect(readMotionPreference()).toBe('off')
    expect(prefersReducedMotion()).toBe(true)
  })

  it('„An“ entfernt die Wahl wieder', () => {
    setMotionPreference('off')
    setMotionPreference('on')
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBeNull()
    expect(document.documentElement.dataset.motion).toBeUndefined()
  })

  it('übersteht einen gesperrten localStorage', () => {
    const blocked = () => {
      throw new Error('blocked')
    }
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(blocked)
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(blocked)
    expect(readMotionPreference()).toBe('on')
    setMotionPreference('off')
    expect(document.documentElement.dataset.motion).toBe('off')
    vi.restoreAllMocks()
  })
})
