import { useEffect, useId, useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import { errorReason } from '../../api/errors'
import { cx } from '../../shared/lib/cx'
import { plural } from '../../shared/lib/format'
import { modKeyLabel } from '../../shared/lib/platform'
import { Avatar } from '../../shared/ui/Avatar'
import { Dialog } from '../../shared/ui/Dialog'
import { ArrowRightIcon, CloseIcon, NoteIcon, SearchIcon } from '../../shared/ui/icons'
import { StatusChip } from '../applications/components/StatusChip'
import { applicationLabel } from '../notes/noteText'
import styles from './CommandPalette.module.css'
import type { PaletteEntry } from './paletteEntries'
import { SEARCH_SCOPES } from './searchScopes'
import { useCommandPalette } from './useCommandPalette'
import type { ScopeResult } from './useScopeSearch'

/** So lange laufen die Einblend-Animationen der Einträge beim Öffnen (siehe .intro im CSS) */
const INTRO_MS = 700

/**
 * Command Palette (⌘K): Befehle tippen und ausführen — Seiten öffnen, Neues anlegen, Erscheinungsbild
 * umschalten — oder über „… suchen“ in einen Such-Modus wechseln, der Stellen, Bewerbungen bzw.
 * Firmen über das Backend durchsucht. Bedienung wie eine ARIA-Combobox: Der Fokus bleibt im Feld,
 * ↑/↓ wählen, Enter führt aus.
 */
export function CommandPalette({ onClose }: { onClose: () => void }) {
  const p = useCommandPalette(onClose)
  const listId = useId()
  const optionId = (index: number) => `${listId}-${index}`
  const scope = p.scope ? SEARCH_SCOPES[p.scope] : null
  // Beim Öffnen rollen die Einträge gestaffelt herein — danach nicht mehr (sonst bei jedem Tastendruck)
  const [intro, setIntro] = useState(true)
  useEffect(() => {
    const timer = setTimeout(() => setIntro(false), INTRO_MS)
    return () => clearTimeout(timer)
  }, [])

  // Gewählten Eintrag sichtbar halten
  useEffect(() => {
    document.getElementById(`${listId}-${p.activeIndex}`)?.scrollIntoView?.({ block: 'nearest' })
  }, [p.activeIndex, listId])

  let index = 0
  const renderEntry = (entry: PaletteEntry) => {
    const i = index++
    const common = {
      id: optionId(i),
      role: 'option',
      'aria-selected': i === p.activeIndex,
      tabIndex: -1,
      className: styles.option,
      style: { '--i': i } as CSSProperties,
      // Fokus bleibt im Eingabefeld
      onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
      onMouseMove: () => i !== p.activeIndex && p.setActive(i),
    } as const
    // Links öffnen selbst (auch in neuem Tab); die Palette schließt nur beim normalen Klick
    const closeOnPlainClick = (e: React.MouseEvent) => {
      if (!e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) onClose()
    }

    if (entry.kind === 'result')
      // Notizen öffnen im Fenster (kein Ziel), die übrigen Treffer sind Links
      return entry.result.kind === 'note' ? (
        <button key={entry.key} type="button" {...common} onClick={() => p.execute(entry)}>
          <ResultRow result={entry.result} />
        </button>
      ) : (
        <Link key={entry.key} to={entry.result.to} {...common} onClick={closeOnPlainClick}>
          <ResultRow result={entry.result} />
        </Link>
      )
    if (entry.kind === 'all')
      return (
        <Link key={entry.key} to={entry.to} {...common} onClick={closeOnPlainClick}>
          <span className={styles.icon}>
            <ArrowRightIcon />
          </span>
          <span className={styles.label}>Alle {entry.total} in der Liste anzeigen</span>
        </Link>
      )
    if (entry.kind === 'more')
      return (
        <button key={entry.key} type="button" {...common} onClick={() => p.execute(entry)}>
          <span className={styles.icon} />
          <span className={styles.label}>{p.search.loadingMore ? 'Wird geladen …' : 'Weitere laden'}</span>
        </button>
      )

    const { command } = entry
    const Icon = command.icon
    const content = (
      <>
        <span className={styles.icon}>
          <Icon />
        </span>
        <span className={styles.label}>{command.label}</span>
        {command.hint && <span className={styles.hint}>{command.hint}</span>}
        {p.input.trim() && <span className={styles.group}>{command.group}</span>}
      </>
    )
    return command.target.kind === 'go' ? (
      <Link key={entry.key} to={command.target.to} {...common} onClick={closeOnPlainClick}>
        {content}
      </Link>
    ) : (
      <button key={entry.key} type="button" {...common} onClick={() => p.execute(entry)}>
        {content}
      </button>
    )
  }

  return (
    <Dialog size="palette" aria-label="Befehle und Suche" onClose={onClose}>
      <div className={styles.bar}>
        <SearchIcon className={styles.barIcon} />
        {scope && (
          <span className={styles.chip}>
            {scope.chip}
            <button
              type="button"
              className={styles.chipClose}
              aria-label="Such-Modus beenden"
              onClick={p.exitScope}
            >
              <CloseIcon />
            </button>
          </span>
        )}
        <input
          className={styles.input}
          data-autofocus
          role="combobox"
          aria-expanded
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={p.entries.length ? optionId(p.activeIndex) : undefined}
          aria-label={scope ? `${scope.chip} durchsuchen` : 'Befehl oder Suche'}
          placeholder={scope ? scope.placeholder : 'Befehl eingeben …'}
          autoComplete="off"
          spellCheck={false}
          value={p.input}
          onChange={(e) => p.changeInput(e.target.value)}
          onKeyDown={p.onKeyDown}
        />
        {p.search.loading && <span className={styles.spinner} role="status" aria-label="Sucht …" />}
        <kbd className={styles.kbd} title="Öffnet und schließt die Palette">
          {modKeyLabel('K')}
        </kbd>
        <button type="button" className={styles.cancel} onClick={onClose}>
          Abbrechen
        </button>
      </div>

      <div
        className={cx(styles.list, intro && styles.intro)}
        id={listId}
        role="listbox"
        aria-label={scope ? 'Treffer' : 'Befehle'}
      >
        {p.sections.map((section, s) => (
          <div key={section.label ?? s} role="group" aria-label={section.label ?? undefined}>
            {section.label && (
              <div className={styles.groupLabel} style={{ '--i': index } as CSSProperties} aria-hidden="true">
                {section.label}
              </div>
            )}
            {section.entries.map(renderEntry)}
          </div>
        ))}
        {!p.entries.length && (
          <p className={styles.empty}>
            {!scope
              ? `Kein Befehl passt zu „${p.input.trim()}“. Mit „Stellen suchen“ durchsuchst du deine Daten.`
              : !p.query
                ? `Suchbegriff eingeben. ${scope.searchesIn}`
                : p.search.error
                  ? `Die Suche ist fehlgeschlagen. ${errorReason(p.search.error)}`
                  : p.search.loading
                    ? 'Sucht …'
                    : `Keine Treffer für „${p.query}“.`}
          </p>
        )}
      </div>

      <div className={styles.footer} aria-hidden="true">
        <span>
          <kbd className={styles.kbd}>↑</kbd>
          <kbd className={styles.kbd}>↓</kbd> wählen
        </span>
        <span>
          <kbd className={styles.kbd}>↵</kbd> ausführen
        </span>
        <span>
          <kbd className={styles.kbd}>esc</kbd> {scope ? 'Such-Modus verlassen' : 'schließen'}
        </span>
      </div>
    </Dialog>
  )
}

/** Inhalt einer Treffer-Zeile je nach Bereich */
function ResultRow({ result }: { result: ScopeResult }) {
  if (result.kind === 'company')
    return (
      <>
        <Avatar name={result.item.name} size="sm" />
        <span className={styles.text}>
          <span className={styles.label}>{result.item.name}</span>
          <span className={styles.sub}>{plural(result.item.jobsCount, 'Stelle', 'Stellen')} erfasst</span>
        </span>
      </>
    )
  if (result.kind === 'note')
    return (
      <>
        <span className={styles.icon}>
          <NoteIcon />
        </span>
        <span className={styles.text}>
          <span className={styles.label}>{result.item.title}</span>
          <span className={styles.sub}>
            {result.item.applicationId ? applicationLabel(result.item) : 'Ohne Bewerbung'}
          </span>
        </span>
        {result.item.noteCategory && <span className={styles.hint}>{result.item.noteCategory}</span>}
      </>
    )
  if (result.kind === 'posting')
    return (
      <>
        <Avatar name={result.item.companyName} size="sm" />
        <span className={styles.text}>
          <span className={styles.label}>{result.item.title}</span>
          <span className={styles.sub}>
            {[result.item.companyName, result.item.location].filter(Boolean).join(' · ')}
          </span>
        </span>
        {result.item.hasApplication && <span className={styles.hint}>Beworben</span>}
      </>
    )
  return (
    <>
      <Avatar name={result.item.companyName} size="sm" />
      <span className={styles.text}>
        <span className={styles.label}>{result.item.jobTitle}</span>
        <span className={styles.sub}>{result.item.companyName}</span>
      </span>
      <StatusChip status={result.item.status} />
    </>
  )
}
