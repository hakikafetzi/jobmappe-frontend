import { useEffect, useRef, useState } from 'react'
import { useDebouncedCallback } from '../hooks/useDebouncedCallback'
import { Button } from './Button'
import { SearchIcon } from './icons'
import styles from './SearchBox.module.css'

/** Wartezeit nach dem letzten Tastendruck, bevor gesucht wird */
const SEARCH_DELAY_MS = 300

type Props = {
  /** Aktiver Suchbegriff (aus der URL); '' = keine Suche */
  value: string
  /** Neuer Suchbegriff (getrimmt); live beim Tippen (entprellt) und sofort beim Abschicken */
  onSearch: (q: string) => void
  placeholder: string
  label: string
}

/** Große Suchleiste (Stellen, Firmen, Bewerbungen). Sucht beim Tippen; die Liste lädt das Backend. */
export function SearchBox({ value, onSearch, placeholder, label }: Props) {
  const [input, setInput] = useState(value)
  // Zuletzt gemeldeter Begriff: kommt er als `value` zurück, bleibt die Eingabe, wie sie ist
  const sent = useRef(value)
  const search = useDebouncedCallback((q: string) => {
    sent.current = q
    onSearch(q)
  }, SEARCH_DELAY_MS)

  // Von außen geändert (z. B. Filter gewählt, „Suche zurücksetzen“): Eingabe übernehmen und
  // eine noch wartende Suche verwerfen, sonst überschriebe sie die Änderung
  useEffect(() => {
    if (value === sent.current) return
    sent.current = value
    search.cancel()
    setInput(value)
  }, [value, search])

  return (
    <form
      role="search"
      className={styles.box}
      onSubmit={(e) => {
        e.preventDefault()
        search.flush(input.trim())
      }}
    >
      <input
        type="search"
        className={styles.input}
        placeholder={placeholder}
        aria-label={label}
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          search.run(e.target.value.trim())
        }}
      />
      <Button type="submit" variant="primary" iconOnly aria-label="Suchen">
        <SearchIcon />
      </Button>
    </form>
  )
}
