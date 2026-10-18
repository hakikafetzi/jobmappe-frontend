import { useId, useMemo, useRef, useState } from 'react'
import { useCompaniesInfinite } from '../../../api/companies'
import { useClickOutside } from '../../../shared/hooks/useClickOutside'
import { useDebouncedCallback } from '../../../shared/hooks/useDebouncedCallback'
import { cx } from '../../../shared/lib/cx'
import { plural } from '../../../shared/lib/format'
import { Avatar } from '../../../shared/ui/Avatar'
import { Button } from '../../../shared/ui/Button'
import { TextInput } from '../../../shared/ui/Field'
import styles from './CompanyCombobox.module.css'
import { companyOptions, type CompanyChoice } from './companyOptions'

/** Wartezeit nach dem letzten Tastendruck, bevor das Backend gefragt wird */
const SEARCH_DELAY_MS = 250

type Props = {
  id: string
  value: CompanyChoice | null
  onChange: (value: CompanyChoice | null) => void
  /** Pflichtfeld (für Screenreader) */
  required?: boolean
}

/**
 * Firma wählen oder neu anlegen (ARIA-Combobox mit Tastatursteuerung). Die Liste öffnet sich erst
 * beim Tippen: Das Backend sucht die Eingabe im Firmennamen (`q`), die Treffer kommen seitenweise.
 * Die Eingabe ist zugleich der Name einer neuen Firma.
 */
export function CompanyCombobox({ id, value, onChange, required }: Props) {
  const [input, setInput] = useState('')
  // Suchbegriff fürs Backend: die Eingabe, entprellt
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listId = useId()

  const search = useDebouncedCallback(setQuery, SEARCH_DELAY_MS)
  const result = useCompaniesInfinite(query)
  const companies = useMemo(() => result.data?.pages.flatMap((p) => p.content) ?? [], [result.data])
  const hasMore = result.hasNextPage
  const loading = result.isFetching
  const options = useMemo(() => companyOptions(companies, input, hasMore), [companies, input, hasMore])
  const hasInput = input.trim() !== ''
  const expanded = open && hasInput
  useClickOutside(wrapRef, () => setOpen(false), expanded)

  const pick = (index: number) => {
    const option = options[index]
    if (!option) return
    // Liste bleibt offen; die neuen Firmen erscheinen an der Stelle des Eintrags
    if (option.kind === 'more') return void result.fetchNextPage()
    onChange(
      option.kind === 'existing'
        ? { kind: 'existing', company: option.company }
        : { kind: 'new', name: option.name },
    )
    setOpen(false)
  }

  const clear = () => {
    onChange(null)
    setInput('')
    search.cancel()
    setQuery('')
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  if (value) {
    return (
      <div className={styles.picked}>
        {value.kind === 'existing' ? (
          <Avatar name={value.company.name} size="md" />
        ) : (
          <Avatar size="md">＋</Avatar>
        )}
        <div className={styles.pickedText}>
          <div className={styles.pickedName}>
            {value.kind === 'existing' ? value.company.name : value.name}
          </div>
          <div className={styles.pickedMeta}>
            {value.kind === 'existing'
              ? `${plural(value.company.jobsCount, 'Stelle', 'Stellen')} erfasst`
              : 'Neue Firma anlegen'}
          </div>
        </div>
        <Button size="sm" onClick={clear}>
          Ändern
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.combo} ref={wrapRef}>
      <TextInput
        ref={inputRef}
        id={id}
        role="combobox"
        aria-expanded={expanded}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-required={required}
        aria-activedescendant={expanded && options[active] ? `${listId}-${active}` : undefined}
        placeholder="Firma wählen oder neuen Namen eingeben"
        autoComplete="off"
        maxLength={255}
        value={input}
        onChange={(e) => {
          setInput(e.target.value)
          search.run(e.target.value.trim())
          setActive(0)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!expanded) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((i) => Math.min(options.length - 1, i + 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((i) => Math.max(0, i - 1))
          } else if (e.key === 'Enter') {
            e.preventDefault()
            pick(active)
          } else if (e.key === 'Escape') {
            // Nur die Liste schließen, nicht den Dialog
            e.preventDefault()
            e.stopPropagation()
            setOpen(false)
          }
        }}
      />
      {expanded && (
        <div className={styles.list} id={listId} role="listbox" aria-label="Firmen" aria-busy={loading}>
          {options.map((o, i) => (
            <div
              key={o.key}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              tabIndex={-1}
              className={cx(styles.option, i === active && styles.active)}
              onMouseDown={(e) => {
                e.preventDefault() // Fokus im Eingabefeld behalten
                pick(i)
              }}
              onMouseEnter={() => setActive(i)}
            >
              {o.kind === 'existing' ? (
                <>
                  <Avatar name={o.company.name} size="sm" />
                  <div className={styles.optionText}>
                    <div className={styles.name}>{o.company.name}</div>
                    <div className={styles.meta}>
                      {plural(o.company.jobsCount, 'Stelle', 'Stellen')} erfasst
                    </div>
                  </div>
                </>
              ) : o.kind === 'new' ? (
                <span className={styles.create}>＋ „{o.name}“ als neue Firma anlegen</span>
              ) : (
                <span className={styles.more}>
                  {result.isFetchingNextPage ? 'Wird geladen …' : 'Weitere Firmen laden'}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
