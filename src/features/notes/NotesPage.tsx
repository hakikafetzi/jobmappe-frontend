import { useState } from 'react'
import { LIST_PAGE_SIZES } from '../../app/paths'
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle'
import { cx } from '../../shared/lib/cx'
import { EmptyState } from '../../shared/ui/EmptyState'
import { FilterSelect } from '../../shared/ui/FilterSelect'
import { IconButton } from '../../shared/ui/IconButton'
import { ListPanel } from '../../shared/ui/ListPanel'
import { GridIcon, NoteIcon, PlusIcon, SearchIcon, TableIcon } from '../../shared/ui/icons'
import { Pager } from '../../shared/ui/Pager'
import { ErrorState, LoadingState } from '../../shared/ui/QueryState'
import { SearchBox } from '../../shared/ui/SearchBox'
import { SlidingTabs } from '../../shared/ui/SlidingTabs'
import { TextButton } from '../../shared/ui/TextButton'
import { CategoryDialog } from '../categories/CategoryDialog'
import { PageSwitchButton, PageToolbar, ToolbarAction } from '../postings/PageToolbar'
import { NoteGallery } from './NoteGallery'
import { NoteRows } from './NoteRows'
import { PageSlide } from './PageSlide'
import styles from './NotesPage.module.css'
import { ALL_NOTES } from './noteText'
import { useNoteWindows } from './noteWorkspaceContext'
import { NOTE_SORTS, noteDateField } from './selectNotes'
import { useFitPageSize } from './useFitPageSize'
import { useNotesView } from './useNotesView'

/**
 * Alle Notizen, mit und ohne Bewerbung, als Galerie oder Tabelle: Suche in Titel und Inhalt, Ordner-Tabs,
 * Sortierung und Pager. Ein Eintrag öffnet die Notiz als schwebendes Fenster (wie in der Bewerbung).
 */
export function NotesPage() {
  // Galerie: Seitengröße = so viele Karten, wie gerade in die Fläche passen (Tabelle: Auswahl im Pager)
  const [contentRef, fitSize] = useFitPageSize<HTMLDivElement>()
  const view = useNotesView(fitSize)
  const { notes, tabs, search, sort, page } = view
  const isTable = view.view === 'table'
  // Notizfenster der ganzen App (bleiben beim Seitenwechsel unten in der Leiste)
  const noteWindows = useNoteWindows()
  const [creatingCategory, setCreatingCategory] = useState(false)
  useDocumentTitle('Notizen')

  const list = notes.data?.content ?? []
  // Blättern animiert nur innerhalb derselben Liste (nicht bei anderer Suche, Ordner, Sortierung, Größe)
  const slideScope = JSON.stringify([search, tabs.categoryId, sort, fitSize])

  return (
    <section className={styles.page} aria-label="Notizen">
      <div className={styles.top}>
        <PageToolbar>
          <SearchBox
            value={search}
            onSearch={view.setSearch}
            placeholder="Titel oder Inhalt suchen"
            label="Notizen durchsuchen"
          />
          <ToolbarAction onClick={() => noteWindows.open(null, { categoryName: tabs.categoryName })}>
            <PlusIcon />
            Notiz
          </ToolbarAction>
          {isTable ? (
            <PageSwitchButton onClick={() => view.setView('gallery')}>
              <GridIcon />
              Galerie
            </PageSwitchButton>
          ) : (
            <PageSwitchButton onClick={() => view.setView('table')}>
              <TableIcon />
              Tabelle
            </PageSwitchButton>
          )}
        </PageToolbar>
      </div>

      <div className={styles.body}>
        {/* Wie das Notizen-Panel im Bewerbungsdetail: eine Karte mit Ordner-Tabs, Notizen und Pager */}
        <ListPanel
          fill
          title="Notizen"
          count={notes.data?.totalElements}
          actions={
            <FilterSelect label="Sortieren" value={sort} onChange={view.setSort} options={NOTE_SORTS} />
          }
        >
          <SlidingTabs
            label="Ordner"
            value={tabs.activeTab}
            onChange={view.setCategory}
            tabs={tabs.tabs}
            trailing={
              <IconButton aria-label="Neuer Ordner" size="md" onClick={() => setCreatingCategory(true)}>
                <PlusIcon className={styles.plus} />
              </IconButton>
            }
          />
          {/* Grauer Grund nur hinter Karten; leer, beim Laden und bei Fehlern bleibt die Fläche weiß */}
          <div
            className={cx(styles.content, !isTable && list.length > 0 && styles.withCards)}
            ref={contentRef}
          >
            {notes.isPending ? (
              <LoadingState />
            ) : notes.error ? (
              <ErrorState error={notes.error} onRetry={() => void notes.refetch()} />
            ) : list.length && isTable ? (
              // Innenabstand der Fläche bleibt in beiden Ansichten gleich (sonst rechnete die Galerie
              // nach dem Wechsel neu); die Tabelle reicht trotzdem bis an die Ränder
              <div className={styles.rowsBleed}>
                <NoteRows
                  notes={list}
                  onOpen={(id) => noteWindows.open(id)}
                  sort={sort}
                  onSort={view.setSort}
                />
              </div>
            ) : list.length ? (
              // Nur die Galerie blättert mit Schwung
              <PageSlide
                slideKey={{ page: notes.data?.page ?? page, scope: slideScope }}
                pending={notes.isPlaceholderData}
              >
                <NoteGallery
                  notes={list}
                  onOpen={(id) => noteWindows.open(id)}
                  dateField={noteDateField(sort)}
                />
              </PageSlide>
            ) : search ? (
              <EmptyState
                fill
                icon={<SearchIcon />}
                title="Keine Treffer"
                actions={<TextButton onClick={() => view.setSearch('')}>Suche zurücksetzen</TextButton>}
              >
                Keine Notiz passt zu „{search}“.
              </EmptyState>
            ) : (
              <EmptyState fill icon={<NoteIcon />} title="Keine Notizen">
                {tabs.activeTab === ALL_NOTES
                  ? 'Notizen kannst du hier frei anlegen oder einer Bewerbung zuordnen.'
                  : 'In diesem Ordner ist noch nichts.'}
              </EmptyState>
            )}
          </div>
          {/* Immer da (vor dem Laden unsichtbar): Sonst wäre die Fläche kurz größer und die
              berechnete Seitengröße der Galerie änderte sich nach dem ersten Laden */}
          <div className={cx(styles.footer, !notes.data && styles.footerPending)}>
            <Pager
              page={page}
              totalPages={notes.data?.totalPages ?? 1}
              range={{ size: notes.data?.size ?? 0, total: notes.data?.totalElements ?? 0 }}
              sizes={
                isTable
                  ? { value: view.tableSize, options: LIST_PAGE_SIZES, onChange: view.setSize }
                  : undefined
              }
              alwaysVisible
              hrefFor={view.pageHref}
            />
          </div>
        </ListPanel>
      </div>

      {creatingCategory && <CategoryDialog category={null} onClose={() => setCreatingCategory(false)} />}
    </section>
  )
}
