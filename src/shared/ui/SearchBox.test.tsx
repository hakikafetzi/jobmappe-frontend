import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchBox } from './SearchBox'

function Harness({ onSearch }: { onSearch: (q: string) => void }) {
  const [value, setValue] = useState('')
  return (
    <>
      <SearchBox
        value={value}
        onSearch={(q) => {
          onSearch(q)
          setValue(q)
        }}
        placeholder="Suchen"
        label="Liste durchsuchen"
      />
      <button type="button" onClick={() => setValue('')}>
        Von außen leeren
      </button>
    </>
  )
}

describe('SearchBox', () => {
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
  afterEach(() => vi.useRealTimers())

  it('sucht entprellt beim Tippen, sofort bei Enter und getrimmt', async () => {
    const onSearch = vi.fn<(q: string) => void>()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<Harness onSearch={onSearch} />)
    const box = screen.getByRole('searchbox', { name: 'Liste durchsuchen' })

    await user.type(box, ' java ')
    expect(onSearch).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(300))
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('java')
    // Die eigene Eingabe bleibt stehen, auch wenn der Begriff getrimmt zurückkommt
    expect(box).toHaveValue(' java ')

    await user.type(box, 'script{Enter}')
    expect(onSearch).toHaveBeenLastCalledWith('java script')
  })

  it('übernimmt Änderungen von außen und verwirft eine wartende Suche', async () => {
    const onSearch = vi.fn<(q: string) => void>()
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<Harness onSearch={onSearch} />)
    const box = screen.getByRole('searchbox', { name: 'Liste durchsuchen' })

    await user.type(box, 'java{Enter}')
    await user.type(box, 'x')
    await user.click(screen.getByRole('button', { name: 'Von außen leeren' }))
    expect(box).toHaveValue('')
    act(() => vi.advanceTimersByTime(1000))
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('java')
  })
})
