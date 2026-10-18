import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import type { ApplicationDetail } from '../../api/types'
import { NOTES_VIEW_KEY } from '../../shared/settings/viewPreferences'
import { seedId } from '../../test/fake-backend/seedIds'
import { currentBackend } from '../../test/msw'
import { renderWithApp } from '../../test/render'
import { NotesPage } from './NotesPage'

afterEach(() => localStorage.clear())

async function renderPage(route = '/notizen') {
  const rendered = renderWithApp(<NotesPage />, { route })
  await screen.findByRole('button', { name: /Gehaltsvorstellung/ })
  return rendered
}

const db = () => currentBackend().db
const note = (title: string) => db().notes.find((n) => n.title === title)
const titles = () => screen.queryAllByLabelText('Titel der Notiz')
const applicationOf = (n: number) =>
  currentBackend().handle('GET', `/applications/${seedId('application', n)}`).body as ApplicationDetail

describe('NotesPage', () => {
  it('zeigt Notizkarten mit Ordner, Datum, Titel und der zugeordneten Bewerbung', async () => {
    await renderPage()
    const app = applicationOf(1)
    const card = screen.getByRole('button', { name: /Unterlagen angepasst/ })
    expect(card).toHaveTextContent('Vorbereitung')
    expect(card).toHaveTextContent('15.08.2026')
    expect(card).toHaveTextContent(app.jobPosting.title)
    expect(card).toHaveTextContent(app.company.name)
    const loose = screen.getByRole('button', { name: /Gehaltsvorstellung/ })
    expect(loose).not.toHaveTextContent('Vorbereitung')
    expect(loose).toHaveTextContent('Ohne Bewerbung')
    expect(screen.getByRole('tab', { name: 'Alle' })).toHaveAttribute('aria-selected', 'true')
  })

  it('sucht über das Backend; ein Ordner beendet die Suche', async () => {
    const { user, router } = await renderPage()
    await user.type(screen.getByRole('searchbox'), 'gehalt{Enter}')
    await waitFor(() => expect(router.state.location.search).toBe('?suche=gehalt'))
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /Unterlagen angepasst/ })).not.toBeInTheDocument(),
    )

    await user.click(screen.getByRole('tab', { name: 'Recherche' }))
    expect(router.state.location.search).toBe(`?ordner=${seedId('category', 4)}`)
    expect(await screen.findByRole('button', { name: /Standort und Team/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Gehaltsvorstellung/ })).not.toBeInTheDocument()
  })

  it('legt über das Plus in der Ordnerleiste einen neuen Ordner an', async () => {
    const { user } = await renderPage()
    await user.click(screen.getByRole('button', { name: 'Neuer Ordner' }))
    const dialog = await screen.findByRole('dialog', { name: 'Neuer Ordner' })
    await user.type(within(dialog).getByLabelText('Name'), 'Gehalt')
    await user.click(within(dialog).getByRole('button', { name: 'Speichern' }))

    expect(await screen.findByRole('tab', { name: 'Gehalt' })).toBeInTheDocument()
    expect(db().categories.some((c) => c.name === 'Gehalt')).toBe(true)
  })

  it('wechselt zwischen Galerie und Tabelle; nur die Tabelle hat eine Seitengröße zur Auswahl', async () => {
    const { user, router } = renderWithApp(<NotesPage />, {
      route: `/notizen?ordner=${seedId('category', 1)}`,
    })
    await screen.findByRole('button', { name: /Unterlagen angepasst/ })
    await user.click(screen.getByRole('button', { name: 'Tabelle' }))
    expect(router.state.location.search).toBe(`?ansicht=tabelle&ordner=${seedId('category', 1)}`)
    const app = applicationOf(1)
    const row = await screen.findByRole('row', { name: /Unterlagen angepasst/ })
    expect(row).toHaveTextContent(app.jobPosting.title)
    expect(row).toHaveTextContent(app.company.name)
    expect(row).toHaveTextContent('Vorbereitung')
    expect(row).toHaveTextContent('15.08.2026')
    expect(screen.getByRole('tab', { name: 'Vorbereitung' })).toHaveAttribute('aria-selected', 'true')

    await user.selectOptions(screen.getByRole('combobox', { name: 'Einträge pro Seite' }), '25')
    expect(router.state.location.search).toBe(`?ansicht=tabelle&ordner=${seedId('category', 1)}&anzahl=25`)

    await user.click(screen.getByRole('button', { name: 'Galerie' }))
    expect(router.state.location.search).toBe(`?ordner=${seedId('category', 1)}`)
    expect(await screen.findByRole('button', { name: 'Tabelle' })).toBeInTheDocument()
    expect(screen.queryByRole('combobox', { name: 'Einträge pro Seite' })).not.toBeInTheDocument()
  })

  it('öffnet mit gespeicherter Standardansicht Tabelle die Tabelle; die Galerie steht dann in der URL', async () => {
    localStorage.setItem(NOTES_VIEW_KEY, 'table')
    const { user, router } = renderWithApp(<NotesPage />)
    expect(await screen.findByRole('row', { name: /Gehaltsvorstellung/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Galerie' }))
    expect(router.state.location.search).toBe('?ansicht=galerie')
    expect(await screen.findByRole('button', { name: /Gehaltsvorstellung/ })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tabelle' }))
    expect(router.state.location.search).toBe('')
  })

  it('sortiert die Tabelle per Spaltenkopf über das Backend', async () => {
    const { user, router } = renderWithApp(<NotesPage />, { route: '/notizen?ansicht=tabelle' })
    await screen.findByRole('row', { name: /Gehaltsvorstellung/ })
    expect(screen.getByRole('columnheader', { name: /Erstellt/ })).toHaveAttribute('aria-sort', 'descending')

    await user.click(screen.getByRole('button', { name: 'Erstellt' }))
    expect(router.state.location.search).toBe('?ansicht=tabelle&sortierung=old')
    // älteste zuerst: „Gehaltsvorstellung“ (05.08.) steht oben
    await waitFor(() => expect(screen.getAllByRole('row')[1]).toHaveTextContent('Gehaltsvorstellung'))

    await user.click(screen.getByRole('button', { name: 'Titel' }))
    expect(router.state.location.search).toBe('?ansicht=tabelle&sortierung=title')
    expect(screen.getByRole('columnheader', { name: /Titel/ })).toHaveAttribute('aria-sort', 'ascending')
  })

  it('zeigt im Editor unten, wann die Notiz angelegt und zuletzt bearbeitet wurde', async () => {
    const { user } = await renderPage()
    await user.click(screen.getByRole('button', { name: /Elevator Pitch/ }))
    expect(
      await screen.findByText('Angelegt am 10.08.2026 · Zuletzt bearbeitet 29.08.2026'),
    ).toBeInTheDocument()
  })

  it('legt eine Notiz ohne Bewerbung an', async () => {
    const { user } = await renderPage()
    await user.click(screen.getByRole('button', { name: 'Notiz' }))
    expect(screen.getByRole('button', { name: 'Bewerbung: Ohne Bewerbung' })).toBeInTheDocument()
    await user.type(await screen.findByLabelText('Titel der Notiz'), 'Fragen an jede Firma')
    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    await waitFor(() => expect(titles()).toHaveLength(0))
    expect(note('Fragen an jede Firma')).toMatchObject({ applicationId: null, categoryId: null })
  })

  it('ordnet eine Notiz einer Bewerbung zu und löst die Zuordnung wieder', async () => {
    const { user } = await renderPage()
    const app = applicationOf(2)
    await user.click(screen.getByRole('button', { name: /Gehaltsvorstellung/ }))
    await user.click(await screen.findByRole('button', { name: 'Bewerbung: Ohne Bewerbung' }))
    const picker = await screen.findByRole('dialog', { name: 'Bewerbung zuordnen' })
    await user.type(within(picker).getByRole('searchbox', { name: 'Bewerbung suchen' }), app.company.name)
    await user.click(
      await within(picker).findByRole('button', { name: (n) => n.includes(app.jobPosting.title) }),
    )
    expect(
      screen.getByRole('button', { name: `Bewerbung: ${app.jobPosting.title} · ${app.company.name}` }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Speichern' }))
    await waitFor(() => expect(note('Gehaltsvorstellung')?.applicationId).toBe(app.id))

    // Zuordnung lösen; der Ordner bleibt (PUT ist ein Vollupdate)
    await user.click(screen.getByRole('button', { name: /Unterlagen angepasst/ }))
    await user.click(await screen.findByRole('button', { name: /^Bewerbung: / }))
    const again = await screen.findByRole('dialog', { name: 'Bewerbung zuordnen' })
    await user.click(within(again).getByRole('button', { name: /^Ohne Bewerbung/ }))
    await user.click(screen.getByRole('button', { name: 'Speichern' }))
    await waitFor(() =>
      expect(db().notes.find((n) => n.id === seedId('note', 1))).toMatchObject({
        applicationId: null,
        categoryId: seedId('category', 1),
      }),
    )
  })

  describe('Minimieren', () => {
    const tray = () => screen.queryByRole('region', { name: 'Minimierte Notizen' })

    it('legt die Notiz unten in die Leiste; ein Klick holt sie mit Entwurf zurück', async () => {
      const { user } = await renderPage()
      await user.click(screen.getByRole('button', { name: /Elevator Pitch/ }))
      const title = await screen.findByDisplayValue('Elevator Pitch')
      await user.type(title, ' kurz')
      await user.click(screen.getByRole('button', { name: 'Minimieren' }))

      expect(titles()).toHaveLength(0)
      const chip = within(tray()!).getByRole('button', { name: /Elevator Pitch kurz.*wiederherstellen/ })
      expect(chip).toHaveAccessibleName('Notiz „Elevator Pitch kurz“ wiederherstellen (ungespeichert)')
      await user.click(chip)
      expect(await screen.findByDisplayValue('Elevator Pitch kurz')).toBeInTheDocument()
      expect(tray()).not.toBeInTheDocument()
    })

    it('minimiert offene Notizen beim Seitenwechsel und merkt sie sich im Browser', async () => {
      const { user, router } = await renderPage()
      await user.click(screen.getByRole('button', { name: /Gehaltsvorstellung/ }))
      await screen.findByDisplayValue('Gehaltsvorstellung')
      await router.navigate('/bewerbungen')

      await waitFor(() => expect(titles()).toHaveLength(0))
      expect(
        within(tray()!).getByRole('button', { name: 'Notiz „Gehaltsvorstellung“ wiederherstellen' }),
      ).toBeInTheDocument()
      expect(JSON.parse(localStorage.getItem('jobmappe.noteWindows') ?? '[]')).toMatchObject([
        { noteId: seedId('note', 10) },
      ])
    })

    it('fragt vor dem Schließen einer minimierten Notiz mit ungespeicherten Änderungen nach', async () => {
      const { user } = await renderPage()
      await user.click(screen.getByRole('button', { name: 'Notiz' }))
      await user.type(await screen.findByLabelText('Titel der Notiz'), 'Entwurf')
      await user.click(screen.getByRole('button', { name: 'Minimieren' }))
      await user.click(within(tray()!).getByRole('button', { name: 'Notiz „Entwurf“ schließen' }))

      const confirm = await screen.findByRole('dialog', { name: 'Änderungen verwerfen?' })
      await user.click(within(confirm).getByRole('button', { name: 'Verwerfen' }))
      await waitFor(() => expect(tray()).not.toBeInTheDocument())
    })
  })
})
