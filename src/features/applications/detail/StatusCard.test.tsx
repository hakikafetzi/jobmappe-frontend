import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { applicationsApi } from '../../../api/applications'
import type { ApplicationDetail, ApplicationPriority, ApplicationStatus } from '../../../api/types'
import { seedId } from '../../../test/fake-backend/seedIds'
import { renderWithApp } from '../../../test/render'
import { StatusCard } from './StatusCard'

async function renderCard(status?: ApplicationStatus) {
  const app: ApplicationDetail = await applicationsApi.get(seedId('application', 1))
  const props = {
    onStatusChange: vi.fn<(s: ApplicationStatus) => void>(),
    onPriorityChange: vi.fn<(p: ApplicationPriority) => void>(),
  }
  const result = renderWithApp(<StatusCard app={status ? { ...app, status } : app} {...props} />)
  return { ...result, ...props }
}

const radios = (group: HTMLElement) =>
  within(group)
    .getAllByRole('radio')
    .map((r) => r.textContent)

describe('StatusCard', () => {
  it('zeigt nur die laufenden Status als Pillen und wechselt per Klick', async () => {
    const { user, onStatusChange } = await renderCard('INTERVIEW')
    const group = screen.getByRole('radiogroup', { name: 'Status' })

    expect(radios(group)).toEqual(['In Bearbeitung', 'Beworben', 'Gespräch', 'Warten', 'Zusage'])
    expect(within(group).getByRole('radio', { name: 'Gespräch' })).toBeChecked()

    await user.click(within(group).getByRole('radio', { name: 'Gespräch' }))
    expect(onStatusChange).not.toHaveBeenCalled()
    await user.click(within(group).getByRole('radio', { name: 'Zusage' }))
    expect(onStatusChange).toHaveBeenCalledWith('OFFER')
  })

  it('sperrt aus „In Bearbeitung“ alle Status außer „Beworben“', async () => {
    await renderCard('IN_PROGRESS')
    const group = screen.getByRole('radiogroup', { name: 'Status' })

    expect(within(group).getByRole('radio', { name: 'Beworben' })).toBeEnabled()
    for (const name of ['Gespräch', 'Warten', 'Zusage'])
      expect(within(group).getByRole('radio', { name })).toBeDisabled()
  })

  it('zeigt bei einer abgeschlossenen Bewerbung den Ausgang und sperrt alle Pillen', async () => {
    await renderCard('REJECTED')

    expect(screen.getByText('Abgeschlossen:')).toBeInTheDocument()
    expect(screen.getByText('Absage')).toBeInTheDocument()
    const status = screen.getByRole('radiogroup', { name: 'Status' })
    expect(within(status).queryByRole('radio', { checked: true })).not.toBeInTheDocument()
    for (const name of ['Status', 'Priorität'])
      for (const pill of within(screen.getByRole('radiogroup', { name })).getAllByRole('radio'))
        expect(pill).toBeDisabled()
  })

  it('wechselt die Priorität über Pillen', async () => {
    const { user, onPriorityChange } = await renderCard()
    const group = screen.getByRole('radiogroup', { name: 'Priorität' })

    expect(radios(group)).toEqual(['Hoch', 'Mittel', 'Niedrig', 'Keine'])
    expect(within(group).getByRole('radio', { name: 'Hoch' })).toBeChecked()

    await user.click(within(group).getByRole('radio', { name: 'Niedrig' }))
    expect(onPriorityChange).toHaveBeenCalledWith('LOW')
  })

  it('verlinkt das Bewerbungsportal unter der Priorität, wenn eines hinterlegt ist', async () => {
    await renderCard()
    expect(screen.getByRole('heading', { name: 'Bewerbungsstand' })).toBeInTheDocument()
    const link = screen.getByRole('link', { name: 'Bewerbungsportal ↗' })
    expect(link).toHaveAttribute('href', 'https://karriere.mustermann.example/bewerbung/status/99182')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
