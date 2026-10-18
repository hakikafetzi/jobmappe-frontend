import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithApp } from '../test/render'
import { AppShell } from './AppShell'

const palette = () => screen.queryByRole('dialog', { name: 'Befehle und Suche' })

describe('AppShell: Command Palette', () => {
  it('öffnet mit ⌘K bzw. Strg+K, auch aus einem Eingabefeld, und mit der Lupe', async () => {
    const { user } = renderWithApp(<AppShell />)
    expect(palette()).not.toBeInTheDocument()

    fireEvent.keyDown(document.body, { key: 'k', metaKey: true })
    expect(palette()).toBeInTheDocument()
    // ⌘K in der Palette schließt sie wieder
    await user.keyboard('{Meta>}k{/Meta}')
    expect(palette()).not.toBeInTheDocument()

    fireEvent.keyDown(document.body, { key: 'K', ctrlKey: true })
    expect(palette()).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Abbrechen' }))
    expect(palette()).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Befehle und Suche' }))
    expect(palette()).toBeInTheDocument()
  })

  it('öffnet nicht über einem anderen Modal', async () => {
    const { user } = renderWithApp(<AppShell />)
    // „Neue Stelle“ (N) ist ein Modal
    await user.keyboard('n')
    expect(screen.getByRole('dialog', { name: 'Stelle erfassen' })).toBeInTheDocument()
    fireEvent.keyDown(screen.getByLabelText('Link zur Anzeige'), { key: 'k', metaKey: true })
    expect(palette()).not.toBeInTheDocument()
  })
})
