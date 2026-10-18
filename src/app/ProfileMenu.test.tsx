import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithApp } from '../test/render'
import { ProfileMenu } from './ProfileMenu'

describe('ProfileMenu', () => {
  it('öffnet das Menü mit dem Link zu den Einstellungen', async () => {
    const { user, router } = renderWithApp(<ProfileMenu />)
    const trigger = screen.getByRole('button', { name: 'Profilmenü' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    const link = screen.getByRole('link', { name: 'Einstellungen' })
    expect(link).toHaveAttribute('href', '/einstellungen')

    await user.click(link)
    expect(router.state.location.pathname).toBe('/einstellungen')
    expect(screen.queryByRole('link', { name: 'Einstellungen' })).not.toBeInTheDocument()
  })

  it('wechselt das Erscheinungsbild', async () => {
    const { user } = renderWithApp(<ProfileMenu />)
    await user.click(screen.getByRole('button', { name: 'Profilmenü' }))
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked()

    await user.click(screen.getByRole('radio', { name: 'Dunkel' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(screen.getByRole('radio', { name: 'Dunkel' })).toBeChecked()
  })

  it('schließt mit Escape und gibt den Fokus an den Knopf zurück', async () => {
    const { user } = renderWithApp(<ProfileMenu />)
    const trigger = screen.getByRole('button', { name: 'Profilmenü' })
    await user.click(trigger)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('link', { name: 'Einstellungen' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()
  })
})
