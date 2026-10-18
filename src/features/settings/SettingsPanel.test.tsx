import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DISPLAY_NAME_KEY } from '../../shared/settings/displayName'
import { APPLICATIONS_VIEW_KEY, NOTES_VIEW_KEY } from '../../shared/settings/viewPreferences'
import { MOTION_STORAGE_KEY } from '../../shared/theme/motionPreference'
import { THEME_STORAGE_KEY } from '../../shared/theme/theme'
import { renderWithApp } from '../../test/render'
import { SettingsPanel } from './SettingsPanel'

describe('SettingsPanel', () => {
  it('schaltet das Erscheinungsbild um und merkt es sich im Browser', async () => {
    const { user } = renderWithApp(<SettingsPanel />)
    const group = screen.getByRole('radiogroup', { name: 'Erscheinungsbild' })
    expect(screen.getByRole('radio', { name: 'System' })).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getByRole('radio', { name: 'Dunkel' }))

    expect(screen.getByRole('radio', { name: 'Dunkel' })).toHaveAttribute('aria-checked', 'true')
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(group).toBeEnabled()
  })

  it('schaltet Animationen aus und wieder an und merkt es sich im Browser', async () => {
    const { user } = renderWithApp(<SettingsPanel />)
    expect(screen.getByRole('radiogroup', { name: 'Animationen' })).toBeEnabled()
    expect(screen.getByRole('radio', { name: 'An' })).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getByRole('radio', { name: 'Aus' }))
    expect(screen.getByRole('radio', { name: 'Aus' })).toHaveAttribute('aria-checked', 'true')
    expect(document.documentElement.dataset.motion).toBe('off')
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBe('off')

    await user.click(screen.getByRole('radio', { name: 'An' }))
    expect(document.documentElement.dataset.motion).toBeUndefined()
    expect(localStorage.getItem(MOTION_STORAGE_KEY)).toBeNull()
  })

  it('merkt sich die Standardansicht von Bewerbungen und Notizen im Browser', async () => {
    const { user } = renderWithApp(<SettingsPanel />)
    const applications = screen.getByRole('radiogroup', { name: 'Ansicht der Bewerbungen' })
    const notes = screen.getByRole('radiogroup', { name: 'Ansicht der Notizen' })
    expect(within(applications).getByRole('radio', { name: 'Kanban' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(within(notes).getByRole('radio', { name: 'Galerie' })).toHaveAttribute('aria-checked', 'true')

    await user.click(within(applications).getByRole('radio', { name: 'Tabelle' }))
    await user.click(within(notes).getByRole('radio', { name: 'Tabelle' }))
    expect(within(applications).getByRole('radio', { name: 'Tabelle' })).toHaveAttribute(
      'aria-checked',
      'true',
    )
    expect(localStorage.getItem(APPLICATIONS_VIEW_KEY)).toBe('table')
    expect(localStorage.getItem(NOTES_VIEW_KEY)).toBe('table')

    await user.click(within(applications).getByRole('radio', { name: 'Kanban' }))
    await user.click(within(notes).getByRole('radio', { name: 'Galerie' }))
    expect(localStorage.getItem(APPLICATIONS_VIEW_KEY)).toBeNull()
    expect(localStorage.getItem(NOTES_VIEW_KEY)).toBeNull()
  })

  it('merkt sich den Namen für die Begrüßung im Browser', async () => {
    const { user } = renderWithApp(<SettingsPanel />)
    const input = screen.getByRole('textbox', { name: 'Dein Name' })
    expect(input).toHaveValue('')

    await user.type(input, 'Anna Beispiel')
    expect(input).toHaveValue('Anna Beispiel')
    expect(localStorage.getItem(DISPLAY_NAME_KEY)).toBe('Anna Beispiel')

    await user.clear(input)
    expect(localStorage.getItem(DISPLAY_NAME_KEY)).toBeNull()
  })

  it('speichert keinen Namen mit Ziffern oder Sonderzeichen', async () => {
    localStorage.setItem(DISPLAY_NAME_KEY, 'Anna')
    const { user } = renderWithApp(<SettingsPanel />)
    const input = screen.getByRole('textbox', { name: 'Dein Name' })

    await user.type(input, '2')
    expect(screen.getByRole('alert')).toHaveTextContent('Bitte nur Buchstaben verwenden.')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(localStorage.getItem(DISPLAY_NAME_KEY)).toBe('Anna')

    await user.type(input, '{Backspace}-Lena')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(localStorage.getItem(DISPLAY_NAME_KEY)).toBe('Anna-Lena')
  })
})
