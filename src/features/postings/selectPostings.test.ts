import { describe, expect, it } from 'vitest'
import {
  apiPostingFilter,
  apiPostingSort,
  effectivePostingFilter,
  parsePostingFilter,
  parsePostingSort,
  postingsListParams,
} from './selectPostings'

describe('selectPostings', () => {
  it('übersetzt die Filter in den Backend-Parameter', () => {
    expect(apiPostingFilter('open')).toBe('OPEN')
    expect(apiPostingFilter('with')).toBe('APPLIED')
    expect(apiPostingFilter('inactive')).toBe('INACTIVE')
    expect(apiPostingFilter('archived')).toBe('ARCHIVED')
    expect(apiPostingFilter('all')).toBe('ALL')
  })

  it('übersetzt die Sortierung in Backend-Properties', () => {
    expect(apiPostingSort('new')).toBe('createdAt,desc')
    expect(apiPostingSort('company')).toBe('company.name,asc')
  })

  it('fällt bei unbekannten URL-Werten auf die Defaults zurück', () => {
    expect(parsePostingFilter('archived')).toBe('archived')
    expect(parsePostingFilter('kaputt')).toBe('open')
    expect(parsePostingFilter(null)).toBe('open')
    expect(parsePostingSort('title')).toBe('title')
    expect(parsePostingSort('xyz')).toBe('new')
  })

  it('sucht immer über alle Stellen: q nur mit filter=ALL', () => {
    const base = { filter: 'with', sort: 'new', page: 1, size: 15 } as const
    expect(postingsListParams({ ...base, search: 'java' })).toEqual({
      filter: 'ALL',
      q: 'java',
      page: 1,
      size: 15,
      sort: ['createdAt,desc'],
    })
    expect(postingsListParams({ ...base, search: '' })).not.toHaveProperty('q')
    expect(postingsListParams({ ...base, search: '' }).filter).toBe('APPLIED')
    expect(effectivePostingFilter('with', 'java')).toBe('all')
    expect(effectivePostingFilter('with', '')).toBe('with')
  })
})
