import { describe, expect, it } from 'vitest'
import { slideDirection } from './slideDirection'

describe('slideDirection', () => {
  it('animiert nur beim Blättern innerhalb derselben Liste', () => {
    expect(slideDirection({ page: 0, scope: 'a' }, { page: 1, scope: 'a' })).toBe('next')
    expect(slideDirection({ page: 3, scope: 'a' }, { page: 1, scope: 'a' })).toBe('prev')
    expect(slideDirection({ page: 1, scope: 'a' }, { page: 1, scope: 'a' })).toBeNull()
    expect(slideDirection({ page: 2, scope: 'a' }, { page: 0, scope: 'b' })).toBeNull()
    expect(slideDirection(null, { page: 1, scope: 'a' })).toBeNull()
  })
})
