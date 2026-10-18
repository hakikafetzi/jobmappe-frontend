import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ToolAnchor, ToolButton } from './ToolButton'

describe('ToolButton', () => {
  it('trägt das Label als Namen und führt die Aktion aus', async () => {
    const onClick = vi.fn<() => void>()
    render(
      <ToolButton label="Stelle bearbeiten" onClick={onClick}>
        <svg />
      </ToolButton>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Stelle bearbeiten' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('öffnet Links in einem neuen Tab', () => {
    render(
      <ToolAnchor href="https://example.com/job" label="Originalanzeige">
        <svg />
      </ToolAnchor>,
    )
    const link = screen.getByRole('link', { name: 'Originalanzeige' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
