import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import type { NoteCompact, Page } from '../../api/types'
import { CountBadge } from '../../shared/ui/Badge'
import { Button } from '../../shared/ui/Button'
import { EmptyState } from '../../shared/ui/EmptyState'
import { useDebouncedCallback } from '../../shared/hooks/useDebouncedCallback'
import { NoteIcon, PanelIcon, SearchIcon } from '../../shared/ui/icons'
import { QueryView } from '../../shared/ui/QueryState'
import { SlidingTabs } from '../../shared/ui/SlidingTabs'
import { ToolButton } from '../../shared/ui/ToolButton'
import { NoteSidebarList } from './NoteSidebarList'
import styles from './NoteSidebar.module.css'
import { ALL_NOTES } from './noteText'
import type { DraftEntry } from './noteWindows'

type Props = {
  query: UseInfiniteQueryResult<InfiniteData<Page<NoteCompact>>>
  /** Ordner-Tabs (Wert = Kategorie-ID) und der aktive */
  tabs: { value: string; label: string }[]
  tab: string
  onTabChange: (tab: string) => void
  /** Aktive Suche ('' = keine); live beim Tippen (entprellt) */
  search: string
  onSearch: (q: string) => void
  activeId: string | null
  onOpen: (id: string) => void
  /** Rechts daneben öffnen (Split) */
  onOpenBeside: (id: string) => void
  onNew: () => void
  onCollapse: () => void
  /** Neue, noch nicht gespeicherte Notizen der offenen Fenster */
  drafts: DraftEntry[]
  onOpenDraft: (wid: number) => void
}

/** Wartezeit nach dem letzten Tastendruck, bevor gesucht wird */
const SEARCH_DELAY_MS = 250

/** Notizliste links im Vollbild des Notiz-Dialogs: alle Notizen, nach Ordner oder Suche (Backend). */
export function NoteSidebar({
  query,
  tabs,
  tab,
  onTabChange,
  search,
  onSearch,
  activeId,
  onOpen,
  onOpenBeside,
  onNew,
  onCollapse,
  drafts,
  onOpenDraft,
}: Props) {
  const [input, setInput] = useState(search)
  // Zuletzt gemeldeter Begriff: kommt er als `search` zurück, bleibt die Eingabe, wie sie ist
  const sent = useRef(search)
  const debounced = useDebouncedCallback((q: string) => {
    sent.current = q
    onSearch(q)
  }, SEARCH_DELAY_MS)
  // Von außen geleert (Ordner gewählt): Eingabe übernehmen, wartende Suche verwerfen
  useEffect(() => {
    if (search === sent.current) return
    sent.current = search
    debounced.cancel()
    setInput(search)
  }, [search, debounced])

  const shown = query.data?.pages.flatMap((p) => p.content) ?? []
  const total = query.data?.pages[0]?.totalElements
  return (
    <aside className={styles.sidebar} aria-label="Alle Notizen">
      <div className={styles.head}>
        <h2 className={styles.title}>Notizen</h2>
        {total !== undefined && <CountBadge value={total} />}
        <Button size="sm" variant="primary" className={styles.add} onClick={onNew}>
          + Notiz
        </Button>
        <ToolButton label="Notizliste einklappen" onClick={onCollapse}>
          <PanelIcon />
        </ToolButton>
      </div>
      <label className={styles.search}>
        <SearchIcon className={styles.searchIcon} />
        <input
          type="search"
          className={styles.searchInput}
          aria-label="Notizen durchsuchen"
          placeholder="Titel oder Inhalt suchen …"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            debounced.run(e.target.value.trim())
          }}
          onKeyDown={(e) => {
            // Escape leert erst die Suche, statt das Vollbild zu schließen
            if (e.key !== 'Escape' || !input) return
            e.preventDefault()
            e.stopPropagation()
            setInput('')
            debounced.flush('')
          }}
        />
      </label>
      <SlidingTabs label="Ordner" value={tab} onChange={onTabChange} tabs={tabs} />
      <div className={styles.scroll}>
        <QueryView query={query}>
          {() =>
            shown.length || drafts.length ? (
              <NoteSidebarList
                notes={shown}
                drafts={drafts}
                activeId={activeId}
                onOpen={onOpen}
                onOpenDraft={onOpenDraft}
                onOpenBeside={onOpenBeside}
                more={
                  query.hasNextPage
                    ? { loading: query.isFetchingNextPage, onLoad: () => void query.fetchNextPage() }
                    : undefined
                }
              />
            ) : search ? (
              <EmptyState compact icon={<SearchIcon />} title="Keine Treffer">
                Keine Notiz passt zu „{search}“.
              </EmptyState>
            ) : (
              <EmptyState compact icon={<NoteIcon />} title="Keine Notizen">
                {tab === ALL_NOTES ? 'Noch nichts notiert.' : 'In diesem Ordner ist noch nichts.'}
              </EmptyState>
            )
          }
        </QueryView>
      </div>
    </aside>
  )
}
