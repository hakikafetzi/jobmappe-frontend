import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { DateInput } from './DateInput'

function Harness({ initial = '', max }: { initial?: string; max?: string }) {
  const [value, setValue] = useState(initial)
  return (
    <>
      <label htmlFor="d">Datum</label>
      <DateInput id="d" value={value} onChange={setValue} max={max} />
      <output aria-label="Wert">{value}</output>
    </>
  )
}

const valueOf = () => screen.getByRole('status', { name: 'Wert' }).textContent

describe('DateInput', () => {
  it('zeigt deutsch an, setzt beim Tippen die Punkte und gibt ISO weiter', async () => {
    const user = userEvent.setup()
    render(<Harness initial="2026-09-01" />)
    const input = screen.getByLabelText('Datum')
    expect(input).toHaveValue('01.09.2026')

    await user.clear(input)
    expect(valueOf()).toBe('')
    await user.type(input, '24122026')
    expect(input).toHaveValue('24.12.2026')
    expect(valueOf()).toBe('2026-12-24')
  })

  it('springt bei ungültiger Eingabe beim Verlassen zurück', async () => {
    const user = userEvent.setup()
    render(<Harness initial="2026-09-01" />)
    const input = screen.getByLabelText('Datum')
    await user.clear(input)
    await user.type(input, '31042026')
    expect(input).toHaveValue('31.04.2026')
    await user.tab()
    expect(input).toHaveValue('')
    expect(valueOf()).toBe('')
  })

  it('wählt im Kalender per Klick und per Tastatur', async () => {
    const user = userEvent.setup()
    render(<Harness initial="2026-09-01" max="2026-09-10" />)
    await user.click(screen.getByRole('button', { name: 'Kalender öffnen' }))
    expect(screen.getByRole('grid', { name: /September 2026/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Dienstag, 1. September 2026' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Freitag, 11. September 2026' })).toBeDisabled()

    await user.keyboard('{ArrowDown}{Enter}')
    expect(valueOf()).toBe('2026-09-08')
    expect(screen.getByLabelText('Datum')).toHaveValue('08.09.2026')
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
  })

  it('springt über Monat und Jahr und schließt mit Escape', async () => {
    const user = userEvent.setup()
    render(<Harness initial="2026-09-15" />)
    await user.click(screen.getByRole('button', { name: 'Kalender öffnen' }))
    await user.click(screen.getByRole('button', { name: 'September 2026, Monat wählen' }))
    await user.click(screen.getByRole('button', { name: '2026, Jahr wählen' }))
    await user.click(screen.getByRole('button', { name: '2030' }))
    await user.click(screen.getByRole('button', { name: 'März' }))
    expect(screen.getByRole('grid', { name: /März 2030/ })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('grid')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kalender öffnen' })).toHaveFocus()
    expect(valueOf()).toBe('2026-09-15')
  })
})
