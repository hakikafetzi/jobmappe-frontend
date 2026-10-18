import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { sampleData } from '../../test/fake-backend/fakeBackend'
import { seedId } from '../../test/fake-backend/seedIds'
import { currentBackend, resetBackend } from '../../test/msw'
import { renderWithApp } from '../../test/render'
import { CompanyDetail } from './CompanyDetail'

describe('CompanyDetail', () => {
  const companyId = seedId('company', 4)

  it('zeigt Webseite und Anschrift', async () => {
    renderWithApp(<CompanyDetail companyId={companyId} />)

    const address = (await screen.findByText('Anschrift')).nextElementSibling
    expect(address).toHaveTextContent('Musterstraße 90')
    expect(address).toHaveTextContent('60486 Frankfurt am Main')
    expect(screen.getByRole('link', { name: 'mustermann.example ↗' })).toBeInTheDocument()
  })

  it('blättert seitenweise durch die Stellen der Firma', async () => {
    // 24 weitere Stellen: 25 insgesamt, 20 pro Seite
    const seed = sampleData()
    const posting = seed.postings.find((p) => p.companyId === companyId)!
    const more = Array.from({ length: 24 }, (_, i) => ({
      ...posting,
      id: seedId('posting', 100 + i),
      title: `Weitere Stelle ${i + 1}`,
    }))
    resetBackend({ ...seed, postings: [...seed.postings, ...more] })
    const { user } = renderWithApp(<CompanyDetail companyId={companyId} />)

    expect(await screen.findByText('25 Stellen erfasst')).toBeInTheDocument()
    const jobLinks = () => screen.getAllByRole('link', { name: /erfasst am/ })
    await waitFor(() => expect(jobLinks()).toHaveLength(20))
    const pager = screen.getByRole('navigation', { name: 'Seiten' })
    expect(pager).toHaveTextContent('1–20 von 25')

    await user.click(within(pager).getByRole('button', { name: 'Nächste Seite' }))
    await waitFor(() => expect(pager).toHaveTextContent('21–25 von 25'))
    await waitFor(() => expect(jobLinks()).toHaveLength(5))
  })

  it('bearbeitet die Firma und entfernt geleerte Angaben', async () => {
    const { user } = renderWithApp(<CompanyDetail companyId={companyId} />)

    await user.click(await screen.findByRole('button', { name: 'Firma bearbeiten' }))
    const dialog = screen.getByRole('dialog', { name: 'Firma bearbeiten' })
    await user.clear(within(dialog).getByLabelText('Straße und Hausnummer'))
    await user.type(within(dialog).getByLabelText('Straße und Hausnummer'), 'Neue Straße 5')
    await user.clear(within(dialog).getByLabelText('Webseite'))
    await user.click(within(dialog).getByRole('button', { name: 'Speichern' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(currentBackend().db.companies.find((c) => c.id === companyId)).toMatchObject({
      street: 'Neue Straße 5',
      postalCode: '60486',
      website: null,
    })
    await waitFor(() =>
      expect(screen.getByText('Anschrift').nextElementSibling).toHaveTextContent('Neue Straße 5'),
    )
    expect(screen.getByText('Webseite').nextElementSibling).toHaveTextContent('nicht hinterlegt')
  })

  it('meldet den Namen einer anderen Firma am Feld', async () => {
    const { user } = renderWithApp(<CompanyDetail companyId={companyId} />)

    await user.click(await screen.findByRole('button', { name: 'Firma bearbeiten' }))
    const dialog = screen.getByRole('dialog', { name: 'Firma bearbeiten' })
    await user.clear(within(dialog).getByLabelText('Name'))
    await user.type(within(dialog).getByLabelText('Name'), 'BEISPIEL ENERGIE AG')
    await user.click(within(dialog).getByRole('button', { name: 'Speichern' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Eine Firma mit diesem Namen gibt es bereits.',
    )
    expect(within(dialog).getByLabelText('Name')).toHaveFocus()
    expect(screen.queryByText(/konnte nicht gespeichert werden/)).not.toBeInTheDocument()
  })

  it('zeigt bei einer ungültigen ID „nicht gefunden“ ohne Wiederholen', async () => {
    renderWithApp(<CompanyDetail companyId="kein-uuid" />)

    expect(await screen.findByText('Der Eintrag wurde nicht gefunden.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Erneut versuchen' })).not.toBeInTheDocument()
  })

  it('verlangt einen Namen', async () => {
    const { user } = renderWithApp(<CompanyDetail companyId={companyId} />)

    await user.click(await screen.findByRole('button', { name: 'Firma bearbeiten' }))
    const dialog = screen.getByRole('dialog', { name: 'Firma bearbeiten' })
    await user.clear(within(dialog).getByLabelText('Name'))
    await user.click(within(dialog).getByRole('button', { name: 'Speichern' }))

    expect(within(dialog).getByRole('alert')).toHaveTextContent('Bitte einen Namen eingeben.')
    expect(currentBackend().db.companies.find((c) => c.id === companyId)?.name).toBe(
      'Mustermann GmbH & Co. KG',
    )
  })
})
