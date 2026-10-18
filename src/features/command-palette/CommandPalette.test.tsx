import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { sampleData } from '../../test/fake-backend/fakeBackend'
import { seedId } from '../../test/fake-backend/seedIds'
import { resetBackend } from '../../test/msw'
import { renderWithApp } from '../../test/render'
import { setMotionPreference } from '../../shared/theme/motionPreference'
import { setThemePreference } from '../../shared/theme/theme'
import { CommandPalette } from './CommandPalette'

function renderPalette() {
  const onClose = vi.fn<() => void>()
  const app = renderWithApp(<CommandPalette onClose={onClose} />, { route: '/bewerbungen' })
  const input = screen.getByRole('combobox', { name: 'Befehl oder Suche' })
  const options = () => within(screen.getByRole('listbox')).queryAllByRole('option')
  return { ...app, onClose, input, options }
}

afterEach(() => {
  setThemePreference('system')
  setMotionPreference('on')
})

describe('CommandPalette', () => {
  it('zeigt ohne Eingabe alle Befehle nach Gruppen', () => {
    renderPalette()
    for (const group of ['Suchen', 'Neu', 'Gehe zu', 'Stellen', 'Erscheinungsbild'])
      expect(screen.getByRole('group', { name: group })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Befehl oder Suche' })).toHaveFocus()
  })

  it('öffnet Seiten per Eingabe und Enter', async () => {
    const { user, input, router, onClose } = renderPalette()
    await user.type(input, 'einstellungen{Enter}')
    expect(router.state.location.pathname).toBe('/einstellungen')
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('wählt mit den Pfeiltasten und führt Aktionen aus', async () => {
    const { user, input, actions, options } = renderPalette()
    await user.type(input, 'neu')
    expect(options().map((o) => o.textContent)).toEqual([
      expect.stringContaining('Neue Stelle erfassen'),
      expect.stringContaining('Neue Firma anlegen'),
      expect.stringContaining('Neue Notiz'),
    ])
    expect(options()[0]).toHaveAttribute('aria-selected', 'true')
    await user.keyboard('{ArrowDown}')
    expect(options()[1]).toHaveAttribute('aria-selected', 'true')
    expect(input).toHaveAttribute('aria-activedescendant', options()[1]!.id)
    await user.keyboard('{Enter}')
    expect(actions.openNewCompany).toHaveBeenCalledOnce()
    expect(actions.openNewPosting).not.toHaveBeenCalled()
  })

  it('schaltet das Erscheinungsbild und Animationen sofort um', async () => {
    const { user, input } = renderPalette()
    await user.type(input, 'dark mode{Enter}')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(await screen.findByText('Dunkles Design aktiv')).toBeInTheDocument()

    await user.clear(input)
    await user.type(input, 'animationen{Enter}')
    expect(document.documentElement.dataset.motion).toBe('off')
  })

  it('meldet, wenn kein Befehl passt', async () => {
    const { user, input } = renderPalette()
    await user.type(input, 'xyz')
    expect(screen.getByText(/Kein Befehl passt zu „xyz“/)).toBeInTheDocument()
  })

  it('sucht nach „Stellen suchen“ im Backend und öffnet den Treffer', async () => {
    const { user, input, router, options } = renderPalette()
    await user.type(input, 'stellen suchen{Enter}')
    const search = screen.getByRole('combobox', { name: 'Stellen durchsuchen' })
    expect(search).toHaveValue('')
    expect(screen.getByText(/Suchbegriff eingeben/)).toBeInTheDocument()

    await user.type(search, 'django')
    await waitFor(() => expect(options()[0]).toHaveTextContent('Softwareentwickler Python/Django (m/w/d)'))
    expect(options().at(-1)).toHaveTextContent('Alle 1 in der Liste anzeigen')
    await user.keyboard('{Enter}')
    expect(router.state.location).toMatchObject({
      pathname: `/stellen/${seedId('posting', 2)}`,
      search: '?filter=all',
    })
  })

  it('verlässt den Such-Modus mit Escape oder Backspace, erst dann schließt Escape', async () => {
    const { user, input, onClose } = renderPalette()
    await user.type(input, 'firmen suchen{Enter}')
    expect(screen.getByRole('combobox', { name: 'Firmen durchsuchen' })).toBeInTheDocument()
    await user.keyboard('{Backspace}')
    expect(screen.getByRole('combobox', { name: 'Befehl oder Suche' })).toBeInTheDocument()

    await user.type(screen.getByRole('combobox'), 'bewerbungen suchen{Enter}')
    await user.keyboard('{Escape}')
    expect(screen.getByRole('combobox', { name: 'Befehl oder Suche' })).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  it('lädt weitere Treffer und führt zur ganzen Liste', async () => {
    const seed = sampleData()
    const more = Array.from({ length: 25 }, (_, i) => ({
      ...seed.companies[0]!,
      id: seedId('company', 100 + i),
      name: `Zusatzfirma ${String(i + 1).padStart(2, '0')}`,
    }))
    resetBackend({ ...seed, companies: [...seed.companies, ...more] })
    const { user, input, options, router } = renderPalette()
    await user.type(input, 'firmen suchen{Enter}zusatz')

    // 20 Treffer + „Weitere laden“ + „Alle 25 …“
    await waitFor(() => expect(options()).toHaveLength(22))
    await user.click(screen.getByRole('option', { name: 'Weitere laden' }))
    await waitFor(() => expect(options()).toHaveLength(26))
    await user.click(screen.getByRole('option', { name: 'Alle 25 in der Liste anzeigen' }))
    expect(router.state.location).toMatchObject({ pathname: '/firmen', search: '?suche=zusatz' })
  })

  it('zeigt Bewerbungen mit Status', async () => {
    const { user, input, options } = renderPalette()
    await user.type(input, 'bewerbungen suchen{Enter}musterflug')
    await waitFor(() => expect(options()[0]).toHaveTextContent('Junior Backend Developer (m/w/d)'))
    expect(options()[0]).toHaveTextContent('Musterflug AG')
    expect(options()[0]).toHaveTextContent('Zusage')
  })

  it('sucht Notizen und öffnet den Treffer im Fenster auf der aktuellen Seite', async () => {
    const { user, input, options, router, onClose } = renderPalette()
    await user.type(input, 'notizen suchen{Enter}gehalt')
    await waitFor(() => expect(options()[0]).toHaveTextContent('Gehaltsvorstellung'))
    expect(options()[0]).toHaveTextContent('Ohne Bewerbung')
    await user.keyboard('{Enter}')
    expect(onClose).toHaveBeenCalled()
    expect(router.state.location.pathname).toBe('/bewerbungen')
    expect(await screen.findByDisplayValue('Gehaltsvorstellung')).toBeInTheDocument()
  })

  it('legt per „Neue Notiz“ eine Notiz auf der aktuellen Seite an', async () => {
    const { user, input, router } = renderPalette()
    await user.type(input, 'neue notiz{Enter}')
    expect(await screen.findByLabelText('Titel der Notiz')).toHaveValue('')
    expect(router.state.location.pathname).toBe('/bewerbungen')
  })
})
