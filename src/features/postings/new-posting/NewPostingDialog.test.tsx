import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { sampleData } from '../../../test/fake-backend/fakeBackend'
import { seedId } from '../../../test/fake-backend/seedIds'
import { currentBackend, resetBackend, server } from '../../../test/msw'
import { renderWithApp } from '../../../test/render'
import { NewPostingDialog } from './NewPostingDialog'

describe('NewPostingDialog', () => {
  it('legt eine neue Firma und die Stelle an', async () => {
    const onClose = vi.fn<() => void>()
    const { user, router } = renderWithApp(<NewPostingDialog onClose={onClose} />)

    await user.type(screen.getByLabelText('Link zur Anzeige'), 'https://neu.example/jobs/1')
    await user.type(screen.getByLabelText('Titel der Stelle'), 'React Entwickler (m/w/d)')
    await user.type(screen.getByRole('combobox', { name: 'Firma' }), 'Neu GmbH')
    await user.click(await screen.findByRole('option', { name: /„Neu GmbH“ als neue Firma anlegen/ }))
    await user.type(screen.getByLabelText('Webseite'), 'neu.example')
    await user.type(screen.getByLabelText('PLZ'), '60311')
    await user.type(screen.getByLabelText('Stadt'), 'Frankfurt am Main')
    await user.click(screen.getByRole('button', { name: 'Stelle speichern' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    const { db } = currentBackend()
    const company = db.companies.find((c) => c.name === 'Neu GmbH')
    expect(company).toMatchObject({
      website: 'neu.example',
      postalCode: '60311',
      city: 'Frankfurt am Main',
      street: null,
    })
    const posting = db.postings.find((p) => p.title === 'React Entwickler (m/w/d)')
    expect(posting).toMatchObject({
      companyId: company?.id,
      url: 'https://neu.example/jobs/1',
      status: 'ACTIVE',
    })
    expect(router.state.location.pathname).toBe(`/stellen/${posting?.id}`)
  })

  it('wählt eine vorhandene Firma und legt keine doppelt an', async () => {
    const { user } = renderWithApp(<NewPostingDialog onClose={() => {}} />)
    const before = currentBackend().db.companies.length

    await user.type(screen.getByLabelText('Link zur Anzeige'), 'https://x')
    await user.type(screen.getByLabelText('Titel der Stelle'), 'Dev')
    // Die Liste öffnet erst beim Tippen und zeigt die Treffer der Backend-Suche
    await user.click(screen.getByRole('combobox', { name: 'Firma' }))
    expect(screen.queryByRole('listbox', { name: 'Firmen' })).not.toBeInTheDocument()
    await user.keyboard('ENERGIE')
    const listbox = await screen.findByRole('listbox', { name: 'Firmen' })
    await waitFor(() =>
      expect(
        within(listbox)
          .getAllByRole('option')
          .map((o) => o.textContent),
      ).toEqual(['＋ „ENERGIE“ als neue Firma anlegen', expect.stringContaining('Beispiel Energie AG')]),
    )
    await user.click(within(listbox).getByRole('option', { name: /Beispiel Energie AG/ }))
    expect(screen.getByText('Beispiel Energie AG')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Stelle speichern' }))

    await waitFor(() => expect(currentBackend().db.postings.some((p) => p.title === 'Dev')).toBe(true))
    expect(currentBackend().db.companies).toHaveLength(before)
  })

  it('lädt weitere Treffer seitenweise nach', async () => {
    const seed = sampleData()
    const more = Array.from({ length: 25 }, (_, i) => ({
      ...seed.companies[0]!,
      id: seedId('company', 100 + i),
      name: `Zusatzfirma ${String(i + 1).padStart(2, '0')}`,
    }))
    resetBackend({ ...seed, companies: [...seed.companies, ...more] })
    const { user } = renderWithApp(<NewPostingDialog onClose={() => {}} />)

    await user.type(screen.getByRole('combobox', { name: 'Firma' }), 'zusatz')
    const listbox = await screen.findByRole('listbox', { name: 'Firmen' })
    // „neu anlegen“ + 20 Treffer + „Weitere Firmen laden“
    await waitFor(() => expect(within(listbox).getAllByRole('option')).toHaveLength(22))
    await user.click(within(listbox).getByRole('option', { name: 'Weitere Firmen laden' }))
    await waitFor(() => expect(within(listbox).getAllByRole('option')).toHaveLength(26))
    expect(within(listbox).queryByRole('option', { name: 'Weitere Firmen laden' })).not.toBeInTheDocument()
  })

  it('markiert die Pflichtfelder', () => {
    renderWithApp(<NewPostingDialog onClose={() => {}} />)
    expect(screen.getByRole('textbox', { name: 'Link zur Anzeige' })).toBeRequired()
    expect(screen.getByRole('textbox', { name: 'Titel der Stelle' })).toBeRequired()
    expect(screen.getByRole('combobox', { name: 'Firma' })).toHaveAttribute('aria-required', 'true')
    expect(screen.getByRole('textbox', { name: 'Ort' })).not.toBeRequired()
  })

  it('meldet alle fehlenden Pflichtfelder am Feld', async () => {
    const { user } = renderWithApp(<NewPostingDialog onClose={() => {}} />)
    await user.click(screen.getByRole('button', { name: 'Stelle speichern' }))
    const alerts = screen.getAllByRole('alert').map((a) => a.textContent)
    expect(alerts).toEqual([
      'Bitte den Link zur Anzeige eintragen.',
      'Bitte einen Titel eingeben.',
      'Bitte eine Firma auswählen oder anlegen.',
    ])
    expect(screen.getByLabelText('Link zur Anzeige')).toHaveFocus()

    await user.type(screen.getByLabelText('Titel der Stelle'), 'Dev')
    expect(screen.queryByText('Bitte einen Titel eingeben.')).not.toBeInTheDocument()
  })

  it('lehnt einen Link ab, der sich nicht öffnen lässt', async () => {
    const before = currentBackend().db.postings.length
    const { user } = renderWithApp(<NewPostingDialog onClose={() => {}} />)
    await user.type(screen.getByLabelText('Link zur Anzeige'), 'javascript:alert(1)')
    await user.type(screen.getByLabelText('Titel der Stelle'), 'Dev')
    await user.type(screen.getByRole('combobox', { name: 'Firma' }), 'energie')
    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('button', { name: 'Stelle speichern' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Bitte einen gültigen Link eingeben')
    expect(screen.getByLabelText('Link zur Anzeige')).toHaveFocus()
    expect(currentBackend().db.postings).toHaveLength(before)
  })

  it('zeigt Feldfehler des Backends auf Deutsch am Feld', async () => {
    server.use(
      http.post('*/api/companies/:id/job-postings', () =>
        HttpResponse.json(
          {
            status: 400,
            title: 'Validation failed',
            detail: '…',
            errors: { url: ['size must be at most 1000'] },
          },
          { status: 400 },
        ),
      ),
    )
    const { user } = renderWithApp(<NewPostingDialog onClose={() => {}} />)
    await user.type(screen.getByLabelText('Link zur Anzeige'), 'https://x')
    await user.type(screen.getByLabelText('Titel der Stelle'), 'Dev')
    await user.type(screen.getByRole('combobox', { name: 'Firma' }), 'energie')
    await user.keyboard('{Enter}')
    await user.click(screen.getByRole('button', { name: 'Stelle speichern' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Dieser Wert ist ungültig.')
    expect(screen.getByLabelText('Link zur Anzeige')).toHaveFocus()
    expect(screen.queryByText(/size must be/)).not.toBeInTheDocument()
    expect(screen.queryByText(/konnte nicht gespeichert werden/)).not.toBeInTheDocument()
  })

  it('legt die neue Firma beim erneuten Versuch nicht doppelt an', async () => {
    server.use(
      http.post('*/api/companies/:id/job-postings', () => new HttpResponse(null, { status: 500 }), {
        once: true,
      }),
    )
    const onClose = vi.fn<() => void>()
    const { user } = renderWithApp(<NewPostingDialog onClose={onClose} />)
    const before = currentBackend().db.companies.length

    await user.type(screen.getByLabelText('Link zur Anzeige'), 'https://neu.example/jobs/1')
    await user.type(screen.getByLabelText('Titel der Stelle'), 'Dev')
    await user.type(screen.getByRole('combobox', { name: 'Firma' }), 'Neu GmbH')
    await user.click(await screen.findByRole('option', { name: /„Neu GmbH“ als neue Firma anlegen/ }))
    await user.click(screen.getByRole('button', { name: 'Stelle speichern' }))
    expect(
      await screen.findByText('Die Stelle konnte nicht gespeichert werden. Bitte später erneut versuchen.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Stelle speichern' }))
    await waitFor(() => expect(onClose).toHaveBeenCalled())
    const { db } = currentBackend()
    expect(db.companies).toHaveLength(before + 1)
    const company = db.companies.find((c) => c.name === 'Neu GmbH')
    expect(db.postings.find((p) => p.title === 'Dev')?.companyId).toBe(company?.id)
  })
})
