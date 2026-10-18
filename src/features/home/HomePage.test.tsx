import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { emptyData, sampleData } from '../../test/fake-backend/fakeBackend'
import { seedId } from '../../test/fake-backend/seedIds'
import { resetBackend } from '../../test/msw'
import { renderWithApp } from '../../test/render'
import { HomePage } from './HomePage'
import { DISPLAY_NAME_KEY } from '../../shared/settings/displayName'

describe('HomePage', () => {
  it('öffnet über den Schnellzugriff „Notiz erstellen“ eine neue Notiz', async () => {
    const { user } = renderWithApp(<HomePage />)
    await user.click(await screen.findByRole('button', { name: /Notiz erstellen/ }))
    expect(await screen.findByLabelText('Titel der Notiz')).toHaveValue('')
  })

  it('zeigt je Liste 5 Einträge und blättert über den Pager', async () => {
    // 7 weitere aktive Stellen ohne Bewerbung (die im Seed ist inaktiv, also nicht offen)
    const seed = sampleData()
    const base = seed.postings[0]!
    const more = Array.from({ length: 7 }, (_, i) => ({
      ...base,
      id: seedId('posting', 300 + i),
      title: `Offene Zusatzstelle ${i + 1}`,
    }))
    resetBackend({ ...seed, postings: [...seed.postings, ...more] })
    const { user } = renderWithApp(<HomePage />)

    const panel = (await screen.findByRole('heading', { name: 'Offene Stellen' })).closest('section')!
    const rows = () => within(panel).getAllByRole('listitem')
    expect(rows()).toHaveLength(5)
    const pager = within(panel).getByRole('navigation', { name: 'Seiten' })
    expect(pager).toHaveTextContent('1–5 von 7')
    expect(within(pager).getByRole('button', { name: 'Seite 1' })).toHaveAttribute('aria-current', 'page')

    await user.click(within(pager).getByRole('button', { name: 'Nächste Seite' }))
    await waitFor(() => expect(pager).toHaveTextContent('6–7 von 7'))
    expect(within(pager).getByRole('button', { name: 'Seite 2' })).toHaveAttribute('aria-current', 'page')
    expect(within(pager).getByRole('button', { name: 'Nächste Seite' })).toBeDisabled()
    await waitFor(() => expect(rows()).toHaveLength(2))

    // „In Bearbeitung“ hat nur eine Seite: kein Pager
    const drafts = screen.getByRole('heading', { name: 'In Bearbeitung' }).closest('section')!
    expect(within(drafts).queryByRole('navigation', { name: 'Seiten' })).not.toBeInTheDocument()
  })

  it('zeigt ohne offene Stellen einen Leerzustand', async () => {
    resetBackend(emptyData())
    renderWithApp(<HomePage />)
    expect(await screen.findByText('Keine offenen Stellen')).toBeInTheDocument()
  })

  it('begrüßt mit dem Namen aus den Einstellungen', async () => {
    localStorage.setItem(DISPLAY_NAME_KEY, 'Anna Beispiel')
    renderWithApp(<HomePage />)
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(/, Anna$/)
  })
})
