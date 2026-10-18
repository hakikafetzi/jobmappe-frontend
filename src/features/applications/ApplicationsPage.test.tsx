import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { applicationsPageQuery } from '../../api/applications'
import type { ApplicationStatus } from '../../api/types'
import { LIST_PAGE_SIZE } from '../../app/paths'
import { APPLICATIONS_VIEW_KEY } from '../../shared/settings/viewPreferences'
import { emptyData, sampleData } from '../../test/fake-backend/fakeBackend'
import { seedId } from '../../test/fake-backend/seedIds'
import { resetBackend } from '../../test/msw'
import { renderWithApp } from '../../test/render'
import { ApplicationsPage } from './ApplicationsPage'

/** Beispieldaten plus `count` Bewerbungen mit `status` (jede mit eigener Stelle). */
function seedWith(count: number, status: ApplicationStatus) {
  const seed = sampleData()
  const posting = seed.postings[0]!
  const app = seed.applications[0]!
  for (let i = 0; i < count; i++) {
    const postingId = seedId('posting', 200 + i)
    seed.postings.push({ ...posting, id: postingId, title: `Zusatz ${i + 1}` })
    seed.applications.push({
      ...app,
      id: seedId('application', 200 + i),
      jobPostingId: postingId,
      status,
      appliedAt: status === 'IN_PROGRESS' ? null : '2026-08-10',
      closedAt: null,
    })
  }
  return seed
}

describe('ApplicationsPage', () => {
  it('wechselt per Knopf zur jeweils anderen Ansicht und behält den Prioritätsfilter', async () => {
    const { user, router } = renderWithApp(<ApplicationsPage />, { route: '/bewerbungen?prioritaet=HIGH' })

    expect(await screen.findByRole('region', { name: 'Beworben' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Board' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tabelle' }))
    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(router.state.location.search).toBe('?prioritaet=HIGH&ansicht=tabelle')
    expect(screen.getByRole('combobox', { name: 'Status' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Board' }))
    expect(await screen.findByRole('region', { name: 'Beworben' })).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(router.state.location.search).toBe('?prioritaet=HIGH')
  })

  it('öffnet mit gespeicherter Standardansicht Tabelle die Tabelle; das Board steht dann in der URL', async () => {
    localStorage.setItem(APPLICATIONS_VIEW_KEY, 'table')
    const { user, router } = renderWithApp(<ApplicationsPage />, { route: '/bewerbungen' })
    expect(await screen.findByRole('table')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Board' }))
    expect(await screen.findByRole('region', { name: 'Beworben' })).toBeInTheDocument()
    expect(router.state.location.search).toBe('?ansicht=kanban')

    await user.click(screen.getByRole('button', { name: 'Tabelle' }))
    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(router.state.location.search).toBe('')
  })

  it('zeigt Suchtreffer aus dem Board in der Tabelle, ohne Filter', async () => {
    const { user, router } = renderWithApp(<ApplicationsPage />, { route: '/bewerbungen?prioritaet=HIGH' })
    expect(await screen.findByRole('region', { name: 'Beworben' })).toBeInTheDocument()

    await user.type(screen.getByRole('searchbox', { name: 'Bewerbungen durchsuchen' }), 'django')
    await waitFor(() => expect(router.state.location.search).toBe('?suche=django&ansicht=tabelle'))
    const table = await screen.findByRole('table')
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(2))
    expect(table).toHaveTextContent('Softwareentwickler Python/Django')
    expect(screen.getByRole('combobox', { name: 'Priorität' })).toHaveValue('all')

    // Ein Filter beendet die Suche; die Tabelle bleibt
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'APPLIED')
    await waitFor(() => expect(router.state.location.search).toBe('?ansicht=tabelle&status=APPLIED'))
    expect(screen.getByRole('searchbox', { name: 'Bewerbungen durchsuchen' })).toHaveValue('')
  })

  it('setzt eine Suche ohne Treffer zurück', async () => {
    const { user, router } = renderWithApp(<ApplicationsPage />, {
      route: '/bewerbungen?ansicht=tabelle&suche=gibtsnicht',
    })
    expect(await screen.findByText(/Keine Bewerbung passt zu „gibtsnicht“/)).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Suche zurücksetzen' })[0]!)
    await waitFor(() => expect(router.state.location.search).toBe('?ansicht=tabelle'))
  })

  it('lädt die Tabelle vor dem Wechsel, damit der animierte Übergang sie erfasst', async () => {
    const { user, router, client } = renderWithApp(<ApplicationsPage />, { route: '/bewerbungen' })
    await screen.findByRole('region', { name: 'Beworben' })
    const tableKey = applicationsPageQuery({
      page: 0,
      size: LIST_PAGE_SIZE,
      sort: ['appliedAt,asc'],
    }).queryKey
    expect(client.getQueryData(tableKey)).toBeUndefined()
    // Beim Umstellen der URL (= Übergang) müssen die Daten schon da sein
    let loadedAtSwitch: unknown
    const unsubscribe = router.subscribe((state) => {
      if (state.location.search.includes('ansicht=tabelle')) loadedAtSwitch ??= client.getQueryData(tableKey)
    })

    await user.click(screen.getByRole('button', { name: 'Tabelle' }))
    await screen.findByRole('table')
    unsubscribe()
    expect(loadedAtSwitch).toBeDefined()
  })

  it('lädt jede Board-Spalte seitenweise und zeigt die Gesamtzahl aus dem Backend', async () => {
    resetBackend(seedWith(25, 'WAITING'))
    const { user } = renderWithApp(<ApplicationsPage />, { route: '/bewerbungen' })

    const column = await screen.findByRole('region', { name: 'Warten' })
    const cards = () => within(column).getAllByRole('link')
    await waitFor(() => expect(cards()).toHaveLength(20))
    const total = Number(
      within(column)
        .getByRole('button', { name: /Warten/ })
        .textContent?.match(/\d+/)?.[0],
    )
    expect(total).toBeGreaterThanOrEqual(25)

    await user.click(within(column).getByRole('button', { name: 'Mehr laden' }))
    await waitFor(() => expect(cards()).toHaveLength(total))
    expect(within(column).queryByRole('button', { name: 'Mehr laden' })).not.toBeInTheDocument()
    // Für „alle abgeschlossenen“ gibt es keinen Filter: die Ablage zeigt keine Zahl
    expect(screen.getByRole('button', { name: 'Abgeschlossen' })).toHaveTextContent(/^Abgeschlossen$/)
  })

  it('filtert, blättert und sortiert die Tabelle über das Backend', async () => {
    resetBackend(seedWith(25, 'APPLIED'))
    const { user, router } = renderWithApp(<ApplicationsPage />, {
      route: '/bewerbungen?ansicht=tabelle&status=APPLIED',
    })

    const table = await screen.findByRole('table')
    // Standard: 15 je Seite wie im Backend (+ Kopfzeile)
    await waitFor(() => expect(within(table).getAllByRole('row')).toHaveLength(16))
    const pager = screen.getByRole('navigation', { name: 'Seiten' })
    await user.click(within(pager).getByRole('link', { name: 'Nächste Seite' }))
    await waitFor(() => expect(router.state.location.search).toContain('seite=2'))
    await waitFor(() =>
      expect(within(pager).getByRole('link', { name: 'Seite 2' })).toHaveAttribute('aria-current', 'page'),
    )

    // Neue Sortierung beginnt wieder auf Seite 1
    await user.click(within(table).getByRole('button', { name: 'Stelle' }))
    await waitFor(() =>
      expect(router.state.location.search).toBe('?ansicht=tabelle&status=APPLIED&sortierung=title-auf'),
    )

    // Seitengröße ändern: steht in der URL, zurück auf Seite 1
    await user.click(within(pager).getByRole('link', { name: 'Nächste Seite' }))
    await waitFor(() => expect(router.state.location.search).toContain('seite=2'))
    await user.selectOptions(within(pager).getByRole('combobox', { name: 'Einträge pro Seite' }), '50')
    await waitFor(() =>
      expect(router.state.location.search).toBe(
        '?ansicht=tabelle&status=APPLIED&sortierung=title-auf&anzahl=50',
      ),
    )
    await waitFor(() => expect(within(table).getAllByRole('row').length).toBeGreaterThan(25))
    expect(within(pager).getByRole('button', { name: 'Nächste Seite' })).toBeDisabled()
  })

  it('zeigt den Pager der Tabelle auch bei nur einer Seite', async () => {
    renderWithApp(<ApplicationsPage />, { route: '/bewerbungen?ansicht=tabelle' })
    const pager = await screen.findByRole('navigation', { name: 'Seiten' })
    await waitFor(() =>
      expect(within(pager).getByRole('link', { name: 'Seite 1' })).toHaveAttribute('aria-current', 'page'),
    )
    expect(within(pager).getByRole('combobox', { name: 'Einträge pro Seite' })).toHaveValue('15')
    expect(within(pager).getByRole('button', { name: 'Nächste Seite' })).toBeDisabled()
  })
})

describe('ApplicationsPage ohne Bewerbungen', () => {
  it('zeigt im Board leere Spalten, in der Tabelle einen Hinweis mit Aktionen', async () => {
    resetBackend(emptyData())
    const { user } = renderWithApp(<ApplicationsPage />, { route: '/bewerbungen' })

    expect(await screen.findByRole('region', { name: 'Beworben' })).toBeInTheDocument()
    expect(screen.queryByText('Noch keine Bewerbungen')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tabelle' }))
    expect(await screen.findByText('Noch keine Bewerbungen')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Zu den offenen Stellen' })).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
