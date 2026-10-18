import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { seedId } from '../../test/fake-backend/seedIds'
import { currentBackend } from '../../test/msw'
import { renderWithApp } from '../../test/render'
import { CloseApplicationDialog } from './CloseApplicationDialog'

const offer = {
  id: seedId('application', 7),
  status: 'OFFER' as const,
  jobTitle: 'Junior Backend Developer',
  companyName: 'Musterflug AG',
}
const applied = { ...offer, id: seedId('application', 2), status: 'APPLIED' as const }
const statusOf = (id: string) => currentBackend().db.applications.find((a) => a.id === id)

describe('CloseApplicationDialog', () => {
  it('bietet je nach Status die passenden Ausgänge ohne Vorauswahl an', async () => {
    const { user } = renderWithApp(<CloseApplicationDialog app={applied} onClose={() => {}} />)

    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual([
      'Absage bekommen',
      'Zurückgezogen',
      'Keine Rückmeldung',
    ])
    expect(screen.queryByRole('radio', { checked: true })).not.toBeInTheDocument()
    const submit = screen.getByRole('button', { name: 'Abschließen' })
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'Zurückgezogen' }))
    expect(screen.getByRole('radio', { name: 'Zurückgezogen' })).toBeChecked()
    expect(submit).toBeEnabled()
  })

  it('bietet bei einer Zusage nur Annehmen oder Ablehnen an', () => {
    renderWithApp(<CloseApplicationDialog app={offer} onClose={() => {}} />)
    expect(screen.getAllByRole('radio').map((r) => r.textContent)).toEqual([
      'Zusage angenommen',
      'Zusage abgelehnt',
    ])
  })

  it('fragt aus „In Bearbeitung“ nur nach, ob zurückgezogen werden soll', async () => {
    const draft = { ...offer, id: seedId('application', 4), status: 'IN_PROGRESS' as const }
    const { user } = renderWithApp(<CloseApplicationDialog app={draft} onClose={() => {}} />)

    expect(screen.getByRole('dialog', { name: 'Bewerbung zurückziehen?' })).toBeInTheDocument()
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Zurückziehen' }))
    await waitFor(() => expect(statusOf(draft.id)?.status).toBe('WITHDRAWN'))
  })

  it('schließt ab und lässt sich rückgängig machen', async () => {
    const onClose = vi.fn<() => void>()
    const { user } = renderWithApp(<CloseApplicationDialog app={offer} onClose={onClose} />)

    await user.click(screen.getByRole('radio', { name: 'Zusage angenommen' }))
    await user.click(screen.getByRole('button', { name: 'Abschließen' }))
    await waitFor(() => expect(statusOf(offer.id)?.status).toBe('OFFER_ACCEPTED'))
    expect(statusOf(offer.id)?.closedAt).not.toBeNull() // setzt das Backend
    expect(onClose).toHaveBeenCalled()

    await user.click(await screen.findByRole('button', { name: 'Rückgängig' }))
    await waitFor(() => expect(statusOf(offer.id)?.status).toBe('OFFER'))
    expect(statusOf(offer.id)?.closedAt).toBeNull()
  })
})
