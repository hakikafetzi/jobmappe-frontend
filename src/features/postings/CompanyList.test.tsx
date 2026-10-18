import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithApp } from '../../test/render'
import { CompanyList } from './CompanyList'

const companies = [
  { id: 'c1', name: 'beispiel consulting SE', jobsCount: 2 },
  { id: 'c3', name: 'Kraftwerk Nord AG', jobsCount: 0 },
  { id: 'c2', name: 'Musterwerk AG', jobsCount: 1 },
]

describe('CompanyList', () => {
  it('listet die Firmen in Backend-Reihenfolge, verlinkt sie und markiert die gewählte', () => {
    renderWithApp(<CompanyList companies={companies} selectedId="c2" query={{ page: 0, size: 15 }} />)

    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.querySelector('h3')?.textContent)).toEqual([
      'beispiel consulting SE',
      'Kraftwerk Nord AG',
      'Musterwerk AG',
    ])
    expect(links[0]).toHaveAttribute('href', '/firmen/c1')
    expect(links[0]).toHaveTextContent('2 Stellen erfasst')
    expect(screen.getByRole('link', { current: true })).toHaveTextContent('Musterwerk AG')
  })

  it('behält Seite und Seitengröße in den Links', () => {
    renderWithApp(<CompanyList companies={companies} selectedId={undefined} query={{ page: 2, size: 50 }} />)
    expect(screen.getAllByRole('link')[0]).toHaveAttribute('href', '/firmen/c1?seite=3&anzahl=50')
  })
})
