import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { seedId } from '../../test/fake-backend/seedIds'
import { currentBackend } from '../../test/msw'
import { renderWithApp } from '../../test/render'
import { PostingDetail } from './PostingDetail'

const withoutApplication = seedId('posting', 8)
const stored = (id: string) => currentBackend().db.postings.find((p) => p.id === id)

describe('PostingDetail: Archiv', () => {
  it('archiviert eine Stelle ohne Bewerbung und stellt sie wieder her', async () => {
    const { user } = renderWithApp(<PostingDetail postingId={withoutApplication} />)

    await user.click(await screen.findByRole('button', { name: 'Archivieren' }))
    expect(await screen.findByText('Archiviert am 01.09.2026')).toBeInTheDocument()
    expect(stored(withoutApplication)?.archivedAt).toBe('2026-09-01')
    expect(screen.queryByRole('button', { name: 'Bewerbung starten' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Archivieren' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Wiederherstellen' }))
    expect(await screen.findByRole('button', { name: 'Bewerbung starten' })).toBeInTheDocument()
    expect(stored(withoutApplication)?.archivedAt).toBeNull()
    expect(screen.queryByText(/Archiviert am/)).not.toBeInTheDocument()
  })

  it('bietet bei Stellen mit Bewerbung kein Archivieren an', async () => {
    renderWithApp(<PostingDetail postingId={seedId('posting', 1)} />)

    expect(await screen.findByRole('link', { name: 'Zur Bewerbung' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Archivieren/ })).not.toBeInTheDocument()
  })
})
