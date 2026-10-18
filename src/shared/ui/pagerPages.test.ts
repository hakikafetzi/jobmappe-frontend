import { describe, expect, it } from 'vitest'
import { pagerItems, pagerRange } from './pagerPages'

const show = (page: number, total: number) =>
  pagerItems(page, total)
    .map((i) => (i.kind === 'page' ? String(i.page + 1) : '…'))
    .join(' ')

describe('Pager', () => {
  it('zeigt bis 7 Seiten alle Zahlen, darüber Lücken', () => {
    expect(show(0, 3)).toBe('1 2 3')
    expect(show(0, 7)).toBe('1 2 3 4 5 6 7')
    expect(show(1, 12)).toBe('1 2 3 4 5 … 12')
    expect(show(6, 12)).toBe('1 … 6 7 8 … 12')
    expect(show(11, 12)).toBe('1 … 8 9 10 11 12')
  })

  it('beschreibt den angezeigten Bereich', () => {
    expect(pagerRange(0, 5, 7)).toBe('1–5 von 7')
    expect(pagerRange(1, 5, 7)).toBe('6–7 von 7')
    expect(pagerRange(0, 15, 0)).toBe('Keine Einträge')
  })
})
