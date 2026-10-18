import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { applicationsApi } from '../../../api/applications'
import type { ApplicationStatus } from '../../../api/types'
import { seedId } from '../../../test/fake-backend/seedIds'
import { renderWithApp } from '../../../test/render'
import { ApplicationHeader } from './ApplicationHeader'

async function renderHeader(status: ApplicationStatus) {
  const app = await applicationsApi.get(seedId('application', 1))
  const onClose = vi.fn<() => void>()
  const onReopen = vi.fn<() => void>()
  const result = renderWithApp(
    <ApplicationHeader app={{ ...app, status }} onClose={onClose} onReopen={onReopen} />,
  )
  return { ...result, onClose, onReopen }
}

describe('ApplicationHeader', () => {
  it('bietet „Bewerbung abschließen“ bei laufenden Bewerbungen an', async () => {
    const { user, onClose } = await renderHeader('INTERVIEW')
    await user.click(screen.getByRole('button', { name: 'Bewerbung abschließen' }))
    expect(onClose).toHaveBeenCalledOnce()
  })

  it('bietet bei abgeschlossenen Bewerbungen „Wieder öffnen“ statt „abschließen“ an', async () => {
    const { user, onReopen } = await renderHeader('REJECTED')
    expect(screen.queryByRole('button', { name: 'Bewerbung abschließen' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Wieder öffnen' }))
    expect(onReopen).toHaveBeenCalledOnce()
  })
})
