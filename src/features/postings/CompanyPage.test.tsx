import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { sampleData } from '../../test/fake-backend/fakeBackend'
import { seedId } from '../../test/fake-backend/seedIds'
import { currentBackend, resetBackend } from '../../test/msw'
import { renderWithApp } from '../../test/render'
import { CompanyPage } from './CompanyPage'

const listNames = () =>
  screen.getAllByRole('link', { name: /Stelle(n)? erfasst/ }).map((l) => l.querySelector('h3')?.textContent)

describe('CompanyPage', () => {
  it('listet die Firmen alphabetisch aus dem Backend', async () => {
    renderWithApp(<CompanyPage />, { route: '/firmen' })
    await screen.findByText('Beispiel Energie AG', { selector: 'h3' })
    expect(listNames()).toHaveLength(8)
    expect(listNames()).toEqual(listNames().toSorted((a, b) => a!.localeCompare(b!)))
  })

  it('sucht Firmen beim Tippen im Namen und behält die Suche beim Wählen', async () => {
    const { user, router } = renderWithApp(<CompanyPage />, { route: '/firmen' })
    await screen.findByText('Beispiel Energie AG', { selector: 'h3' })

    await user.type(screen.getByRole('searchbox', { name: 'Firmen durchsuchen' }), 'beispiel')
    await waitFor(() => expect(router.state.location.search).toBe('?suche=beispiel'))
    await waitFor(() =>
      expect(listNames()).toEqual(['Beispiel Consulting SE', 'Beispiel Energie AG', 'Beispielbank AG']),
    )

    await user.click(screen.getByText('Beispielbank AG', { selector: 'h3' }))
    await waitFor(() =>
      expect(router.state.location).toMatchObject({
        pathname: `/firmen/${seedId('company', 5)}`,
        search: '?suche=beispiel',
      }),
    )
  })

  it('zeigt ohne Treffer einen Hinweis mit „Suche zurücksetzen“', async () => {
    const { user, router } = renderWithApp(<CompanyPage />, { route: '/firmen?suche=xyz' })
    expect(await screen.findByText('Keine Treffer')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Suche zurücksetzen' }))
    await waitFor(() => expect(router.state.location.search).toBe(''))
    await waitFor(() => expect(listNames()).toHaveLength(8))
  })

  it('blättert seitenweise und wählt die Seitengröße über die URL', async () => {
    const seed = sampleData()
    const more = Array.from({ length: 15 }, (_, i) => ({
      ...seed.companies[0]!,
      id: seedId('company', 100 + i),
      name: `Zusatzfirma ${String(i + 1).padStart(2, '0')}`,
    }))
    resetBackend({ ...seed, companies: [...seed.companies, ...more] })
    const { user, router } = renderWithApp(<CompanyPage />, { route: '/firmen' })

    // Standard: 15 pro Seite wie im Backend (23 Firmen → 2 Seiten)
    const pager = await screen.findByRole('navigation', { name: 'Seiten' })
    expect(listNames()).toHaveLength(15)
    expect(within(pager).getByRole('link', { name: 'Seite 1' })).toHaveAttribute('aria-current', 'page')
    await user.click(within(pager).getByRole('link', { name: 'Nächste Seite' }))
    await waitFor(() => expect(router.state.location.search).toBe('?seite=2'))
    await waitFor(() => expect(listNames()).toHaveLength(8))

    // Neue Seitengröße: steht in der URL, zurück auf Seite 1
    await user.selectOptions(within(pager).getByRole('combobox', { name: 'Einträge pro Seite' }), '25')
    await waitFor(() => expect(router.state.location.search).toBe('?anzahl=25'))
    await waitFor(() => expect(listNames()).toHaveLength(23))
    expect(within(pager).getByRole('button', { name: 'Nächste Seite' })).toBeDisabled()
  })

  it('zeigt den Pager auch bei nur einer Seite', async () => {
    renderWithApp(<CompanyPage />, { route: '/firmen' })
    const pager = await screen.findByRole('navigation', { name: 'Seiten' })
    expect(within(pager).getByRole('link', { name: 'Seite 1' })).toHaveAttribute('aria-current', 'page')
    expect(within(pager).getByRole('combobox', { name: 'Einträge pro Seite' })).toHaveValue('15')
  })

  it('legt über „+ Firma“ eine neue Firma an und öffnet sie', async () => {
    const { user, router } = renderWithApp(<CompanyPage />, { route: '/firmen' })

    await user.click(await screen.findByRole('button', { name: 'Firma' }))
    const dialog = screen.getByRole('dialog', { name: 'Neue Firma' })
    await user.type(within(dialog).getByLabelText('Name'), 'Neu GmbH')
    await user.type(within(dialog).getByLabelText('Stadt'), 'Kassel')
    await user.click(within(dialog).getByRole('button', { name: 'Speichern' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const created = currentBackend().db.companies.find((c) => c.name === 'Neu GmbH')
    expect(created).toMatchObject({ city: 'Kassel', website: null })
    expect(router.state.location.pathname).toBe(`/firmen/${created?.id}`)
    expect(screen.getByText('Firma angelegt')).toBeInTheDocument()
  })

  it('meldet einen vorhandenen Namen beim Anlegen am Feld', async () => {
    const { user } = renderWithApp(<CompanyPage />, { route: '/firmen' })

    await user.click(await screen.findByRole('button', { name: 'Firma' }))
    const dialog = screen.getByRole('dialog', { name: 'Neue Firma' })
    await user.type(within(dialog).getByLabelText('Name'), 'beispiel energie ag')
    await user.click(within(dialog).getByRole('button', { name: 'Speichern' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Eine Firma mit diesem Namen gibt es bereits.',
    )
  })

  it('verlinkt zurück zu den Stellen', async () => {
    renderWithApp(<CompanyPage />, { route: '/firmen' })
    expect(await screen.findByRole('link', { name: 'Stellen' })).toHaveAttribute('href', '/stellen')
  })
})
