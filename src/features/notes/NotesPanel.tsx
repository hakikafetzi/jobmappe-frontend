import { useState } from 'react'
import { useCategories } from '../../api/noteCategories'
import { useNotesInfinite } from '../../api/notes'
import { Button } from '../../shared/ui/Button'
import { EmptyState } from '../../shared/ui/EmptyState'
import { NoteIcon } from '../../shared/ui/icons'
import { ListPanel } from '../../shared/ui/ListPanel'
import { QueryView } from '../../shared/ui/QueryState'
import { SlidingTabs } from '../../shared/ui/SlidingTabs'
import { NoteList } from './NoteList'
import { ALL_NOTES, categoryTabs } from './noteText'
import type { NoteApplication } from './noteWindows'
import { useNoteWindows } from './noteWorkspaceContext'

/** Notizen einer Bewerbung (Bewerbungsdetail): Ordner-Tabs, neueste zuerst, „Mehr laden“. */
export function NotesPanel({ application }: { application: NoteApplication }) {
  const categories = useCategories()
  const [tab, setTab] = useState(ALL_NOTES)
  const { tabs, activeTab, categoryId, categoryName } = categoryTabs(categories.data, tab)
  // Bewerbung + Ordner zusammen filtern (Ordner-Tabs im Panel)
  const query = useNotesInfinite({ applicationId: application.id, noteCategoryId: categoryId })
  // Offene Notizen: Die Fenster sind nicht modal, jede weitere öffnet daneben
  const noteWindows = useNoteWindows()

  return (
    <ListPanel
      title="Notizen"
      count={query.data?.pages[0]?.totalElements ?? 0}
      actions={
        <Button
          size="sm"
          variant="primary"
          onClick={() => noteWindows.open(null, { categoryName, application, scope: application })}
        >
          + Notiz
        </Button>
      }
    >
      <SlidingTabs label="Ordner" value={activeTab} onChange={setTab} tabs={tabs} />
      <QueryView query={query}>
        {(data) => {
          const notes = data.pages.flatMap((p) => p.content)
          return notes.length ? (
            <NoteList
              notes={notes}
              onOpen={(id) => noteWindows.open(id, { scope: application })}
              more={
                query.hasNextPage
                  ? { loading: query.isFetchingNextPage, onLoad: () => void query.fetchNextPage() }
                  : undefined
              }
            />
          ) : (
            <EmptyState icon={<NoteIcon />} title="Keine Notizen">
              {activeTab === ALL_NOTES
                ? 'Zu dieser Bewerbung ist noch nichts notiert.'
                : 'In diesem Ordner ist noch nichts.'}
            </EmptyState>
          )
        }}
      </QueryView>
    </ListPanel>
  )
}
