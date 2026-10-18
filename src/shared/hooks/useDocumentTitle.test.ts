import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { documentTitle, useDocumentTitle } from './useDocumentTitle'

describe('useDocumentTitle', () => {
  it('setzt „JobMappe | Seite“ und folgt Änderungen', () => {
    const { rerender } = renderHook(({ page }) => useDocumentTitle(page), {
      initialProps: { page: 'Startseite' as string | null },
    })
    expect(document.title).toBe('JobMappe | Startseite')

    rerender({ page: 'Stellen' })
    expect(document.title).toBe('JobMappe | Stellen')

    // null: Titel bleibt, eine Unterkomponente setzt ihn
    rerender({ page: null })
    expect(document.title).toBe('JobMappe | Stellen')
  })

  it('nutzt ohne Seite nur den App-Namen', () => {
    expect(documentTitle()).toBe('JobMappe')
  })
})
