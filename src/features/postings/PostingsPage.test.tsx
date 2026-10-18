import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { emptyData, sampleData } from '../../test/fake-backend/fakeBackend'
import { seedId } from '../../test/fake-backend/seedIds'
import { currentBackend, resetBackend, server } from '../../test/msw'
import { renderWithApp } from '../../test/render'
import { companiesPageQuery, companyQuery } from '../../api/companies'
import type { CompanyCompact, Page } from '../../api/types'
import { LIST_PAGE_SIZE } from '../../app/paths'
import { companiesListParams } from './pageSwitch'
import { PostingsPage } from './PostingsPage'

describe('PostingsPage', () => {
  it('verlinkt die Firmen-Seite', async () => {
    renderWithApp(<PostingsPage />, { route: '/stellen' })
    expect(await screen.findByRole('link', { name: 'Firmen' })).toHaveAttribute('href', '/firmen')
  })

  it('lädt beim Wechsel zu den Firmen erst deren Daten, dann geht es los (für den Übergang)', async () => {
    const { user, router, client } = renderWithApp(<PostingsPage />, { route: '/stellen' })
    await user.click(await screen.findByRole('link', { name: 'Firmen' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/firmen'))
    const list = client.getQueryData<Page<CompanyCompact>>(
      companiesPageQuery(companiesListParams(0, LIST_PAGE_SIZE)).queryKey,
    )
    expect(list?.content.length).toBeGreaterThan(0)
    // Die erste Firma (Detailkarte) ist auch schon da
    expect(client.getQueryData(companyQuery(list!.content[0]!.id).queryKey)).toBeDefined()
  })

  it('zeigt die Filter ohne Zahlen und lädt „Archiviert“ aus dem Backend', async () => {
    const seed = sampleData()
    const applied = new Set(seed.applications.map((a) => a.jobPostingId))
    const archived = seed.postings.find((p) => !applied.has(p.id))!
    archived.archivedAt = '2026-08-20'
    resetBackend(seed)
    const { user } = renderWithApp(<PostingsPage />, { route: '/stellen' })
    const filters = await screen.findByRole('group', { name: 'Filter' })
    await waitFor(() =>
      expect(
        within(filters)
          .getAllByRole('button')
          .map((b) => b.textContent),
      ).toEqual(['Offen', 'Beworben', 'Inaktiv', 'Archiviert', 'Alle']),
    )

    await user.click(within(filters).getByRole('button', { name: /Archiviert/ }))
    await waitFor(() =>
      expect(within(filters).getByRole('button', { name: 'Archiviert' })).toHaveAttribute(
        'aria-pressed',
        'true',
      ),
    )
    await waitFor(() => expect(screen.getByText('1 Stelle')).toBeInTheDocument())
    const list = screen.getByRole('generic', { name: 'Stellen' })
    expect(within(list).getAllByRole('link')).toHaveLength(1)
    expect(within(list).getByRole('link')).toHaveTextContent(archived.title)
  })

  it('blättert seitenweise und behält Filter und Sortierung in der URL', async () => {
    const seed = sampleData()
    const base = seed.postings[0]!
    const more = Array.from({ length: 30 }, (_, i) => ({
      ...base,
      id: seedId('posting', 100 + i),
      title: `Zusatzstelle ${String(i + 1).padStart(2, '0')}`,
    }))
    resetBackend({ ...seed, postings: [...seed.postings, ...more] })
    const { user, router } = renderWithApp(<PostingsPage />, { route: '/stellen?filter=all' })

    const pager = await screen.findByRole('navigation', { name: 'Seiten' })
    // Standard: 15 pro Seite wie im Backend (38 Stellen → 3 Seiten)
    expect(within(pager).getAllByRole('link', { name: /^Seite \d+$/ })).toHaveLength(3)
    expect(within(pager).getByRole('link', { name: 'Seite 1' })).toHaveAttribute('aria-current', 'page')
    await user.click(within(pager).getByRole('link', { name: 'Nächste Seite' }))
    await waitFor(() => expect(router.state.location.search).toBe('?filter=all&seite=2'))
    await waitFor(() =>
      expect(within(pager).getByRole('link', { name: 'Seite 2' })).toHaveAttribute('aria-current', 'page'),
    )

    // Sortierung ändern: zurück auf Seite 1, das Backend sortiert
    await user.selectOptions(screen.getByRole('combobox', { name: /Sortieren/ }), 'title')
    await waitFor(() => expect(router.state.location.search).toBe('?filter=all&sortierung=title'))

    // Seitengröße ändern: steht in der URL, zurück auf Seite 1
    await user.selectOptions(within(pager).getByRole('combobox', { name: 'Einträge pro Seite' }), '50')
    await waitFor(() => expect(router.state.location.search).toBe('?filter=all&sortierung=title&anzahl=50'))
    await waitFor(() =>
      expect(within(pager).queryByRole('link', { name: 'Seite 2' })).not.toBeInTheDocument(),
    )
    expect(within(pager).getByRole('button', { name: 'Nächste Seite' })).toBeDisabled()
  })

  it('zeigt den Pager auch bei nur einer Seite', async () => {
    renderWithApp(<PostingsPage />, { route: '/stellen?filter=all' })
    const pager = await screen.findByRole('navigation', { name: 'Seiten' })
    await waitFor(() =>
      expect(within(pager).getByRole('link', { name: 'Seite 1' })).toHaveAttribute('aria-current', 'page'),
    )
    expect(within(pager).getByRole('combobox', { name: 'Einträge pro Seite' })).toHaveValue('15')
    expect(within(pager).getByRole('button', { name: 'Vorherige Seite' })).toBeDisabled()
    expect(within(pager).getByRole('button', { name: 'Nächste Seite' })).toBeDisabled()
  })

  it('sucht beim Tippen in Titel und Firma über alle Stellen; ein Filter beendet die Suche', async () => {
    const { user, router } = renderWithApp(<PostingsPage />, { route: '/stellen' })
    const box = await screen.findByRole('searchbox', { name: 'Stellen durchsuchen' })
    const titles = () =>
      within(screen.getByLabelText('Stellen', { selector: 'div' }))
        .queryAllByRole('heading', { level: 3 })
        .map((h) => h.textContent)

    // Firmenname: Musterflug AG hat genau eine Stelle
    await user.type(box, 'musterflug')
    await waitFor(() => expect(router.state.location.search).toBe('?filter=all&suche=musterflug'))
    await waitFor(() => expect(titles()).toEqual(['Junior Backend Developer (m/w/d)']))
    const filters = screen.getByRole('group', { name: 'Filter' })
    expect(within(filters).getByRole('button', { name: 'Alle' })).toHaveAttribute('aria-pressed', 'true')

    // Titel, ohne Rücksicht auf Groß-/Kleinschreibung
    await user.clear(box)
    await user.type(box, 'DJANGO{Enter}')
    await waitFor(() => expect(titles()).toEqual(['Softwareentwickler Python/Django (m/w/d)']))

    await user.click(within(filters).getByRole('button', { name: 'Beworben' }))
    await waitFor(() => expect(router.state.location.search).toBe('?filter=with'))
    expect(box).toHaveValue('')
  })

  it('zeigt „Bewerbung angelegt“/„Noch nicht beworben“ nur unter „Alle“ und „Inaktiv“', async () => {
    const { user } = renderWithApp(<PostingsPage />, { route: '/stellen?filter=with' })
    const list = await screen.findByLabelText('Stellen', { selector: 'div' })
    expect(within(list).queryByText('Bewerbung angelegt')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Alle' }))
    await waitFor(() => expect(within(list).getAllByText('Bewerbung angelegt').length).toBeGreaterThan(0))
    expect(within(list).getByText('Noch nicht beworben')).toBeInTheDocument()

    // Die inaktive Seed-Stelle hat keine Bewerbung
    await user.click(screen.getByRole('button', { name: 'Inaktiv' }))
    await waitFor(() => expect(within(list).queryByText('Bewerbung angelegt')).not.toBeInTheDocument())
    expect(within(list).getByText('Noch nicht beworben')).toBeInTheDocument()
  })

  it('zeigt ohne Treffer einen Hinweis und setzt die Suche zurück', async () => {
    const { user, router } = renderWithApp(<PostingsPage />, { route: '/stellen?suche=gibtsnicht' })
    expect(await screen.findByText('Keine Treffer')).toBeInTheDocument()
    expect(screen.getByRole('searchbox', { name: 'Stellen durchsuchen' })).toHaveValue('gibtsnicht')

    await user.click(screen.getByRole('button', { name: 'Suche zurücksetzen' }))
    await waitFor(() => expect(router.state.location.search).toBe('?filter=all'))
    expect(screen.getByRole('searchbox', { name: 'Stellen durchsuchen' })).toHaveValue('')
  })

  it('schickt die Suche nie zusammen mit einem Filter ans Backend', async () => {
    renderWithApp(<PostingsPage />, { route: '/stellen?filter=with&suche=java' })
    // Filter aus der URL wird bei aktiver Suche ignoriert (sonst 400 Invalid request combination)
    expect(await screen.findAllByText(/Java/, { selector: 'h3' })).not.toHaveLength(0)
    const filters = screen.getByRole('group', { name: 'Filter' })
    expect(within(filters).getByRole('button', { name: 'Alle' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('PostingsPage ohne Stellen', () => {
  it('bietet „Stelle erfassen“ an', async () => {
    resetBackend(emptyData())
    const { user, actions } = renderWithApp(<PostingsPage />, { route: '/stellen?filter=all' })

    expect(await screen.findByText('Noch keine Stellen')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Stelle erfassen' }))
    expect(actions.openNewPosting).toHaveBeenCalledOnce()
  })

  it('zeigt ohne offene Stellen die Aktionen in der Detailkarte, „Alle Stellen“ in der Liste', async () => {
    const seed = sampleData()
    const applied = new Set(seed.applications.map((a) => a.jobPostingId))
    resetBackend({ ...seed, postings: seed.postings.filter((p) => applied.has(p.id)) })
    renderWithApp(<PostingsPage />, { route: '/stellen?filter=open' })

    expect(await screen.findByText('Keine offenen Stellen')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Alle Stellen anzeigen' })).toBeInTheDocument()

    // Die Aktionen gibt es genau einmal — in der Detailkarte, nicht zusätzlich in der Liste
    expect(screen.getByText('Neue Stellen finden')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Stelle erfassen' })).toHaveLength(1)
  })
})

describe('PostingsPage mit Bewerbung', () => {
  const requested: string[] = []
  const track = ({ request }: { request: Request }) => void requested.push(new URL(request.url).pathname)
  afterEach(() => {
    server.events.removeListener('request:start', track)
    requested.length = 0
  })

  /** Nur die Stelle der Bewerbung a1, damit sie in der Liste vorausgewählt ist. */
  function seedWithOneApplication() {
    const seed = sampleData()
    const app = seed.applications.find((a) => a.id === seedId('application', 1))!
    resetBackend({
      ...seed,
      postings: seed.postings.filter((p) => p.id === app.jobPostingId),
      applications: [app],
    })
    return app
  }

  it('verlinkt „Zur Bewerbung“ über die applicationId, ohne alle Bewerbungen zu laden', async () => {
    const app = seedWithOneApplication()
    server.events.on('request:start', track)
    renderWithApp(<PostingsPage />, { route: '/stellen?filter=with' })

    const link = await screen.findByRole('link', { name: 'Zur Bewerbung' })
    expect(link).toHaveAttribute('href', `/bewerbungen/${app.id}`)
    expect(requested).toContain(`/api/job-postings/${app.jobPostingId}`)
    expect(requested).not.toContain('/api/applications')
  })

  it('zeigt die Anschrift der Firma in der Stellen-Detailkarte', async () => {
    seedWithOneApplication()
    renderWithApp(<PostingsPage />, { route: '/stellen?filter=with' })

    const address = (await screen.findByText('Anschrift')).nextElementSibling
    expect(address).toHaveTextContent('Musterstraße 90')
    expect(address).toHaveTextContent('60486 Frankfurt am Main')
  })

  it('bearbeitet die Stelle', async () => {
    const app = seedWithOneApplication()
    const { user } = renderWithApp(<PostingsPage />, { route: '/stellen?filter=with' })

    await user.click(await screen.findByRole('button', { name: 'Stelle bearbeiten' }))
    const dialog = screen.getByRole('dialog', { name: 'Stelle bearbeiten' })
    const title = within(dialog).getByLabelText('Titel der Stelle')
    await user.clear(title)
    await user.type(title, 'Senior Java Entwickler (m/w/d)')
    await user.clear(within(dialog).getByLabelText('Ort'))
    await user.selectOptions(within(dialog).getByLabelText('Anzeige'), 'Offline')
    await user.click(within(dialog).getByRole('button', { name: 'Speichern' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(currentBackend().db.postings.find((p) => p.id === app.jobPostingId)).toMatchObject({
      title: 'Senior Java Entwickler (m/w/d)',
      location: null,
      status: 'INACTIVE',
    })
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Senior Java Entwickler (m/w/d)' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Anzeige offline')).toBeInTheDocument()
  })

  it('bearbeitet die Firma direkt aus der Stellen-Detailkarte', async () => {
    const app = seedWithOneApplication()
    const { user } = renderWithApp(<PostingsPage />, { route: '/stellen?filter=with' })

    await user.click(await screen.findByRole('button', { name: 'Firma bearbeiten' }))
    const dialog = screen.getByRole('dialog', { name: 'Firma bearbeiten' })
    const name = within(dialog).getByLabelText('Name')
    await user.clear(name)
    await user.type(name, 'Mustermann Neu')
    await user.click(within(dialog).getByRole('button', { name: 'Speichern' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    const companyId = currentBackend().db.postings.find((p) => p.id === app.jobPostingId)?.companyId
    expect(currentBackend().db.companies.find((c) => c.id === companyId)?.name).toBe('Mustermann Neu')
    await waitFor(() =>
      expect(screen.getByText('Firma', { selector: 'dt' }).nextElementSibling).toHaveTextContent(
        'Mustermann Neu',
      ),
    )
    expect(screen.getByRole('link', { name: 'Firmenseite öffnen' })).toHaveAttribute(
      'href',
      `/firmen/${companyId}`,
    )
  })

  it('verlangt beim Bearbeiten einen Titel', async () => {
    seedWithOneApplication()
    const { user } = renderWithApp(<PostingsPage />, { route: '/stellen?filter=with' })

    await user.click(await screen.findByRole('button', { name: 'Stelle bearbeiten' }))
    const dialog = screen.getByRole('dialog', { name: 'Stelle bearbeiten' })
    await user.clear(within(dialog).getByLabelText('Titel der Stelle'))
    await user.click(within(dialog).getByRole('button', { name: 'Speichern' }))

    expect(within(dialog).getByRole('alert')).toHaveTextContent('Bitte einen Titel eingeben.')
    expect(within(dialog).getByLabelText('Titel der Stelle')).toHaveFocus()
  })

  it('öffnet die Bewerbung der gewählten Stelle mit Enter', async () => {
    const app = seedWithOneApplication()
    const { user, router } = renderWithApp(<PostingsPage />, { route: '/stellen?filter=with' })

    await screen.findByRole('link', { name: 'Zur Bewerbung' })
    await user.keyboard('{Enter}')
    await waitFor(() => expect(router.state.location.pathname).toBe(`/bewerbungen/${app.id}`))
  })
})
