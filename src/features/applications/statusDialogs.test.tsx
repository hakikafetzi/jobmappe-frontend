import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { seedId } from '../../test/fake-backend/seedIds'
import { currentBackend } from '../../test/msw'
import { renderWithApp } from '../../test/render'
import { MarkAppliedDialog } from './MarkAppliedDialog'
import { ReopenDialog } from './ReopenDialog'
import { ResetToDraftDialog } from './ResetToDraftDialog'

const subject = { jobTitle: 'Junior Backend Developer', companyName: 'Musterflug AG' }
const draft = { ...subject, id: seedId('application', 4), status: 'IN_PROGRESS' as const }
const interview = { ...subject, id: seedId('application', 1), status: 'INTERVIEW' as const }
const rejected = { ...subject, id: seedId('application', 5), status: 'REJECTED' as const }
const stored = (id: string) => currentBackend().db.applications.find((a) => a.id === id)

describe('MarkAppliedDialog', () => {
  it('setzt „Beworben“ zusammen mit dem Bewerbungsweg', async () => {
    const onClose = vi.fn<() => void>()
    const { user } = renderWithApp(<MarkAppliedDialog app={draft} onClose={onClose} />)

    await user.click(screen.getByRole('radio', { name: 'Telefon' }))
    await user.click(screen.getByRole('button', { name: 'Als beworben markieren' }))

    await waitFor(() => expect(stored(draft.id)?.status).toBe('APPLIED'))
    expect(stored(draft.id)?.appliedVia).toBe('PHONE')
    expect(stored(draft.id)?.appliedAt).not.toBeNull()
    expect(onClose).toHaveBeenCalled()
  })

  it('lässt den Status beim Abbrechen unverändert', async () => {
    const onClose = vi.fn<() => void>()
    const { user } = renderWithApp(<MarkAppliedDialog app={draft} onClose={onClose} />)

    await user.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(onClose).toHaveBeenCalled()
    expect(stored(draft.id)?.status).toBe('IN_PROGRESS')
  })
})

describe('ResetToDraftDialog', () => {
  it('setzt nach Bestätigung Datum, Weg und Link zurück', async () => {
    const { user } = renderWithApp(<ResetToDraftDialog app={interview} onClose={() => {}} />)

    await user.click(screen.getByRole('button', { name: 'Zurücksetzen' }))
    await waitFor(() => expect(stored(interview.id)?.status).toBe('IN_PROGRESS'))
    expect(stored(interview.id)).toMatchObject({ appliedAt: null, appliedVia: null, portalUrl: null })
  })
})

describe('ReopenDialog', () => {
  it('öffnet erst nach der Wahl eines Status wieder', async () => {
    const { user } = renderWithApp(<ReopenDialog app={rejected} onClose={() => {}} />)
    const submit = screen.getByRole('button', { name: 'Wieder öffnen' })
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole('radio', { name: 'Gespräch' }))
    await user.click(submit)
    await waitFor(() => expect(stored(rejected.id)?.status).toBe('INTERVIEW'))
    expect(stored(rejected.id)?.closedAt).toBeNull()
  })

  it('weist bei „In Bearbeitung“ auf das Zurücksetzen hin', async () => {
    const { user } = renderWithApp(<ReopenDialog app={rejected} onClose={() => {}} />)
    await user.click(screen.getByRole('radio', { name: 'In Bearbeitung' }))
    expect(screen.getByText(/werden zurückgesetzt/)).toBeInTheDocument()
  })
})
