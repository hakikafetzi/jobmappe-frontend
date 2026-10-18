import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { seedId } from '../../test/fake-backend/seedIds'
import { currentBackend } from '../../test/msw'
import { renderWithApp } from '../../test/render'
import { NOTE_DIALOG_STORAGE_KEY } from './noteDialogPrefs'
import { NotesPanel } from './NotesPanel'

const applicationId = seedId('application', 1)
const application = { id: applicationId, jobTitle: 'Java-Entwickler', companyName: 'Finanz Informatik' }

afterEach(() => localStorage.clear())

async function renderPanel() {
  const rendered = renderWithApp(<NotesPanel application={application} />)
  await screen.findByRole('button', { name: /Unterlagen angepasst/ })
  return rendered
}

/** Eintrag der Notizliste auf der Seite (steht im DOM vor den Fenstern) */
const inPanel = (name: RegExp) => screen.getAllByRole('button', { name })[0]!
const titles = () => screen.queryAllByLabelText('Titel der Notiz')
const prefs = () =>
  JSON.parse(localStorage.getItem(NOTE_DIALOG_STORAGE_KEY) ?? '{}') as Record<string, unknown>

describe('NoteWorkspace', () => {
  it('lädt die Notiz, ordnet den Ordner über den Namen zu und speichert', async () => {
    const { user } = await renderPanel()
    await user.click(inPanel(/Unterlagen angepasst/))

    const title = await screen.findByDisplayValue('Unterlagen angepasst')
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Ordner' })).toHaveDisplayValue('Vorbereitung'),
    )
    await user.clear(title)
    await user.type(title, 'Unterlagen fertig')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Ordner' }), 'Recherche')
    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    await waitFor(() => expect(titles()).toHaveLength(0))
    const note = currentBackend().db.notes.find((n) => n.id === seedId('note', 1))
    expect(note).toMatchObject({ title: 'Unterlagen fertig', categoryId: seedId('category', 4) })
  })

  it('legt eine neue Notiz im Ordner des gewählten Tabs an', async () => {
    const { user } = await renderPanel()
    await user.click(screen.getByRole('tab', { name: 'Recherche' }))
    await user.click(screen.getByRole('button', { name: '+ Notiz' }))
    await user.type(await screen.findByLabelText('Titel der Notiz'), 'Nach dem Gespräch')
    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    await waitFor(() => expect(titles()).toHaveLength(0))
    const note = currentBackend().db.notes.find((n) => n.title === 'Nach dem Gespräch')
    expect(note).toMatchObject({ applicationId, categoryId: seedId('category', 4) })
  })

  it('verlangt einen Titel und zeigt die Wortzahl in der Fußzeile', async () => {
    const { user } = await renderPanel()
    await user.click(screen.getByRole('button', { name: '+ Notiz' }))
    expect(await screen.findByText('0 Wörter · 0 Zeichen')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Speichern' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Bitte einen Titel eingeben.')
  })

  it('löscht eine bestehende Notiz nach Rückfrage; neue haben kein Löschen', async () => {
    const { user } = await renderPanel()
    await user.click(screen.getByRole('button', { name: '+ Notiz' }))
    await screen.findByLabelText('Titel der Notiz')
    expect(screen.queryByRole('button', { name: 'Löschen' })).not.toBeInTheDocument()

    await user.click(inPanel(/Unterlagen angepasst/))
    await user.click(await screen.findByRole('button', { name: 'Löschen' }))
    const confirm = await screen.findByRole('dialog', { name: 'Notiz löschen?' })
    await user.click(within(confirm).getByRole('button', { name: 'Löschen' }))

    await waitFor(() => expect(titles()).toHaveLength(1)) // die neue Notiz bleibt offen
    expect(currentBackend().db.notes.some((n) => n.id === seedId('note', 1))).toBe(false)
    expect(screen.queryByText(/nicht gefunden/)).not.toBeInTheDocument()
  })

  it('öffnet weitere Notizen parallel und holt offene nach vorn', async () => {
    const { user } = await renderPanel()
    await user.click(inPanel(/Unterlagen angepasst/))
    await screen.findByDisplayValue('Unterlagen angepasst')
    await user.click(inPanel(/Meine Fragen/))
    await screen.findByDisplayValue('Meine Fragen')
    expect(titles()).toHaveLength(2)

    await user.click(inPanel(/Unterlagen angepasst/))
    expect(titles()).toHaveLength(2)
  })

  describe('Vollbild', () => {
    async function openFullscreen() {
      const rendered = await renderPanel()
      await rendered.user.click(inPanel(/Unterlagen angepasst/))
      await screen.findByDisplayValue('Unterlagen angepasst')
      await rendered.user.click(screen.getByRole('button', { name: 'Vollbild' }))
      const sidebar = screen.getByRole('complementary', { name: 'Alle Notizen' })
      await within(sidebar).findByRole('button', { name: /Meine Fragen/ })
      return { ...rendered, sidebar }
    }

    it('zeigt links die Notizen, öffnet rechts die gewählte und merkt sich das Vollbild', async () => {
      const { user, sidebar } = await openFullscreen()
      expect(prefs()).toMatchObject({ fullscreen: true })
      await user.click(within(sidebar).getByRole('button', { name: /Meine Fragen/ }))
      expect(await screen.findByDisplayValue('Meine Fragen')).toBeInTheDocument()
      expect(within(sidebar).getByRole('button', { name: /Meine Fragen/ })).toHaveAttribute(
        'aria-current',
        'true',
      )
    })

    it('behält ungespeicherte Eingaben beim Umschalten und fragt vor dem Ersetzen', async () => {
      const { user } = await openFullscreen()
      await user.type(screen.getByLabelText('Titel der Notiz'), ' (neu)')

      await user.click(screen.getByRole('button', { name: 'Vollbild beenden' }))
      expect(screen.getByLabelText('Titel der Notiz')).toHaveValue('Unterlagen angepasst (neu)')
      await user.click(screen.getByRole('button', { name: 'Vollbild' }))

      const list = screen.getByRole('complementary', { name: 'Alle Notizen' })
      await user.click(within(list).getByRole('button', { name: /Meine Fragen/ }))
      const confirm = await screen.findByRole('dialog', { name: 'Änderungen verwerfen?' })
      await user.click(within(confirm).getByRole('button', { name: 'Abbrechen' }))
      expect(screen.getByLabelText('Titel der Notiz')).toHaveValue('Unterlagen angepasst (neu)')
    })

    it('zeigt in der Liste alle Notizen (nicht nur die der Bewerbung) und sucht darin', async () => {
      const { user, sidebar } = await openFullscreen()
      // „Bewerbung raus“ gehört zu einer anderen Bewerbung, „Gehaltsvorstellung“ zu keiner
      expect(await within(sidebar).findByRole('button', { name: /Bewerbung raus/ })).toBeInTheDocument()
      expect(within(sidebar).getByRole('button', { name: /Gehaltsvorstellung/ })).toBeInTheDocument()

      await user.click(within(sidebar).getByRole('tab', { name: 'Recherche' }))
      await user.type(within(sidebar).getByRole('searchbox', { name: 'Notizen durchsuchen' }), 'gehalt')
      // Treffer aus allen Ordnern (Gehaltsvorstellung liegt in keinem), sonst nichts
      expect(await within(sidebar).findByRole('button', { name: /Gehaltsvorstellung/ })).toBeInTheDocument()
      expect(within(sidebar).queryByRole('button', { name: /Bewerbung raus/ })).not.toBeInTheDocument()
      // Die Suche gilt über alle Ordner
      expect(within(sidebar).getByRole('tab', { name: 'Alle' })).toHaveAttribute('aria-selected', 'true')

      // Ein Ordner beendet die Suche
      await user.click(within(sidebar).getByRole('tab', { name: 'Vorbereitung' }))
      expect(within(sidebar).getByRole('searchbox', { name: 'Notizen durchsuchen' })).toHaveValue('')
    })

    it('zeigt beim Ziehen statt der Zeile ein Quadrat mit Blatt und Titel', async () => {
      const { sidebar } = await openFullscreen()
      const row = within(sidebar)
        .getByRole('button', { name: /Absage/ })
        .closest('li')!
      const setDragImage = vi.fn<(image: Element, x: number, y: number) => void>()
      fireEvent.dragStart(row, {
        dataTransfer: { setData: () => {}, setDragImage, effectAllowed: 'none', types: [] },
      })
      expect(setDragImage).toHaveBeenCalledOnce()
      const [image] = setDragImage.mock.calls[0]!
      expect(image).toHaveTextContent('Absage — was ich mitnehme')
      expect(image).not.toHaveTextContent('Rückblick')

      fireEvent.dragEnd(row)
      expect(image).toBeEmptyDOMElement()
    })

    it('öffnet eine zweite Notiz daneben und schließt Seiten einzeln', async () => {
      const { user, sidebar } = await openFullscreen()
      await user.click(within(sidebar).getAllByRole('button', { name: 'Daneben öffnen' })[0]!) // „Termin steht“
      await waitFor(() => expect(titles()).toHaveLength(2))
      expect(titles()[0]).toHaveValue('Unterlagen angepasst')
      expect(titles()[1]).toHaveValue('Termin steht')

      await user.click(screen.getAllByRole('button', { name: 'Schließen' })[0]!)
      await waitFor(() => expect(titles()).toHaveLength(1))
      expect(titles()[0]).toHaveValue('Termin steht')
    })

    it('klappt die Notizliste ein und aus und ändert ihre Breite', async () => {
      const { user } = await openFullscreen()
      const separator = screen.getByRole('separator', { name: /Breite der Notizliste/ })
      separator.focus()
      await user.keyboard('{ArrowRight}{ArrowRight}')
      expect(separator).toHaveAttribute('aria-valuenow', '400')
      expect(prefs()).toMatchObject({ sidebarWidth: 400 })

      await user.click(screen.getByRole('button', { name: 'Notizliste einklappen' }))
      expect(screen.queryByRole('complementary', { name: 'Alle Notizen' })).not.toBeInTheDocument()
      expect(prefs()).toMatchObject({ sidebarCollapsed: true })
      await user.click(screen.getByRole('button', { name: 'Notizliste ausklappen' }))
      expect(screen.getByRole('complementary', { name: 'Alle Notizen' })).toBeInTheDocument()
    })

    it('zeigt eine neue Notiz sofort als Entwurf in der Liste', async () => {
      const { user, sidebar } = await openFullscreen()
      await user.click(within(sidebar).getByRole('button', { name: '+ Notiz' }))
      const draft = await within(sidebar).findByRole('button', { name: /Neue Notiz\s*Entwurf/ })
      expect(draft).toHaveAttribute('aria-current', 'true')

      await user.type(screen.getByLabelText('Titel der Notiz'), 'Gehalt recherchiert')
      expect(
        within(sidebar).getByRole('button', { name: /Gehalt recherchiert\s*Entwurf/ }),
      ).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Speichern' }))
      // Gespeichert: mit Bewerbung und Datum statt „Entwurf“
      const saved = await within(sidebar).findByRole('button', {
        name: /Gehalt recherchiert.*\d{2}\.\d{2}\./,
      })
      expect(saved).toHaveAttribute('aria-current', 'true')
      expect(within(sidebar).queryByText('Entwurf')).not.toBeInTheDocument()
    })

    it('bleibt nach dem Speichern offen und öffnet nach dem Löschen die nächste Notiz', async () => {
      const { user, sidebar } = await openFullscreen()
      await user.click(screen.getByRole('button', { name: 'Speichern' }))
      await screen.findByText('Notiz gespeichert')
      expect(titles()).toHaveLength(1)

      await user.click(screen.getByRole('button', { name: 'Löschen' }))
      const confirm = await screen.findByRole('dialog', { name: 'Notiz löschen?' })
      await user.click(within(confirm).getByRole('button', { name: 'Löschen' }))
      await waitFor(() =>
        expect(
          within(sidebar).queryByRole('button', { name: /Unterlagen angepasst/ }),
        ).not.toBeInTheDocument(),
      )
      const title = await screen.findByLabelText('Titel der Notiz')
      expect(title).not.toHaveValue('Unterlagen angepasst')
      expect(title).not.toHaveValue('')
    })
  })

  it('setzt Größe, Lage und Vollbild zurück', async () => {
    localStorage.setItem(
      NOTE_DIALOG_STORAGE_KEY,
      JSON.stringify({
        width: 600,
        height: 500,
        position: { x: 10, y: 10 },
        fullscreen: false,
        sidebarWidth: 300,
      }),
    )
    const { user } = await renderPanel()
    await user.click(screen.getByRole('button', { name: '+ Notiz' }))
    await user.click(await screen.findByRole('button', { name: 'Originalgröße und Position' }))
    expect(prefs()).toEqual({
      width: 860,
      height: 820,
      position: null,
      fullscreen: false,
      sidebarWidth: 360,
      sidebarCollapsed: false,
    })
  })
})
