import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { currentBackend } from '../../test/msw'
import { renderWithApp } from '../../test/render'
import { CategorySettings } from './CategorySettings'

const names = () => currentBackend().db.categories.map((c) => c.name)

describe('CategorySettings', () => {
  it('legt einen Ordner an, benennt ihn um und löscht ihn nach Rückfrage', async () => {
    const { user } = renderWithApp(<CategorySettings />)
    expect(await screen.findByText('Vorbereitung')).toBeInTheDocument()

    // Anlegen
    await user.click(screen.getByRole('button', { name: '+ Ordner' }))
    await user.type(screen.getByLabelText('Name'), 'Gehalt')
    await user.click(screen.getByRole('button', { name: 'Speichern' }))
    expect(await screen.findByText('Gehalt')).toBeInTheDocument()
    expect(names()).toContain('Gehalt')

    // Umbenennen
    await user.click(screen.getByRole('button', { name: 'Gehalt umbenennen' }))
    const input = screen.getByLabelText('Name')
    await user.clear(input)
    await user.type(input, 'Gehaltsverhandlung')
    await user.click(screen.getByRole('button', { name: 'Speichern' }))
    expect(await screen.findByText('Gehaltsverhandlung')).toBeInTheDocument()

    // Löschen mit Rückfrage
    await user.click(screen.getByRole('button', { name: 'Gehaltsverhandlung löschen' }))
    const confirm = screen.getByRole('dialog', { name: 'Ordner löschen?' })
    await user.click(within(confirm).getByRole('button', { name: 'Löschen' }))
    await waitFor(() => expect(names()).not.toContain('Gehaltsverhandlung'))
  })

  it('meldet einen vorhandenen Namen am Feld, unabhängig von der Schreibweise', async () => {
    const { user } = renderWithApp(<CategorySettings />)
    await user.click(await screen.findByRole('button', { name: '+ Ordner' }))
    await user.type(screen.getByLabelText('Name'), 'recherche')
    await user.click(screen.getByRole('button', { name: 'Speichern' }))

    const dialog = screen.getByRole('dialog', { name: 'Neuer Ordner' })
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Einen Ordner mit diesem Namen gibt es bereits.',
    )
    expect(within(dialog).getByLabelText('Name')).toHaveValue('recherche')
    expect(screen.queryByText(/konnte nicht gespeichert werden/)).not.toBeInTheDocument()
    expect(names().filter((n) => n.toLowerCase() === 'recherche')).toHaveLength(1)
  })

  it('bricht das Löschen ab, ohne etwas zu ändern', async () => {
    const { user } = renderWithApp(<CategorySettings />)
    await user.click(await screen.findByRole('button', { name: 'Recherche löschen' }))
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(names()).toContain('Recherche')
  })
})
