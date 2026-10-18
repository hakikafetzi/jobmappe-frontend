import { useState } from 'react'
import { useApplicationsPage } from '../../api/applications'
import { usePostingsPage } from '../../api/jobPostings'
import { clampedPage } from '../../api/pagination'
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle'
import { useNow } from '../../shared/hooks/useNow'
import { cx } from '../../shared/lib/cx'
import { ErrorState, LoadingState } from '../../shared/ui/QueryState'
import { DraftsBlock } from './DraftsBlock'
import { HomeHero } from './HomeHero'
import styles from './HomePage.module.css'
import { OpenPostingsBlock } from './OpenPostingsBlock'
import { QuickLinks } from './QuickLinks'

/** Zeilen je Liste auf der Startseite */
const ROWS = 5

/**
 * Startseite: lädt gezielt nur, was sie zeigt — offene Stellen und Bewerbungen in Bearbeitung
 * (je eine Seite, blätterbar).
 */
export function HomePage() {
  const [openPage, setOpenPage] = useState(0)
  const [draftsPage, setDraftsPage] = useState(0)
  const open = usePostingsPage({ filter: 'OPEN', page: openPage, size: ROWS, sort: ['createdAt,desc'] })
  const drafts = useApplicationsPage({
    status: 'IN_PROGRESS',
    page: draftsPage,
    size: ROWS,
    sort: ['createdAt,desc'],
  })

  // Seite leer geworden (z. B. Bewerbung zur letzten Stelle der Seite gestartet): direkt beim
  // Rendern zurückblättern; die neue Seite ist bis zum Laden Platzhalter, also kein Kreislauf
  const openClamped = clampedPage(open.isPlaceholderData ? undefined : open.data, openPage)
  const draftsClamped = clampedPage(drafts.isPlaceholderData ? undefined : drafts.data, draftsPage)
  if (openClamped !== null) setOpenPage(openClamped)
  if (draftsClamped !== null) setDraftsPage(draftsClamped)
  const now = useNow()
  useDocumentTitle('Startseite')

  const queries = [open, drafts]
  if (queries.some((q) => q.isPending)) return <LoadingState page />
  const error = queries.find((q) => q.error)?.error
  if (error || !open.data || !drafts.data)
    return <ErrorState page error={error} onRetry={() => queries.forEach((q) => void q.refetch())} />

  // Beide Listen leer: gleich hohe Karten
  const bothEmpty = !open.data.content.length && !drafts.data.content.length

  return (
    <div className={styles.page}>
      <HomeHero now={now} />
      <QuickLinks />
      <div className={cx(styles.grid, bothEmpty && styles.even)}>
        <OpenPostingsBlock
          open={open.data.content}
          count={open.data.totalElements}
          page={openPage}
          pageSize={ROWS}
          totalPages={open.data.totalPages}
          onPageChange={setOpenPage}
          now={now}
        />
        <DraftsBlock
          drafts={drafts.data.content}
          count={drafts.data.totalElements}
          page={draftsPage}
          pageSize={ROWS}
          totalPages={drafts.data.totalPages}
          onPageChange={setDraftsPage}
          // Nur die erste Seite beginnt mit der neuesten Stelle
          newest={openPage === 0 ? open.data.content[0] : undefined}
        />
      </div>
    </div>
  )
}
