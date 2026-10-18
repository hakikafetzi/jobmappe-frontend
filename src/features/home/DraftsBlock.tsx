import { Link } from 'react-router'
import type { ApplicationCompact, JobPostingCompact } from '../../api/types'
import { paths, type ApplicationOrigin } from '../../app/paths'
import { shortTitle } from '../../shared/lib/format'
import { Button, ButtonLink } from '../../shared/ui/Button'
import { EmptyState } from '../../shared/ui/EmptyState'
import { PenIcon } from '../../shared/ui/icons'
import { Pager } from '../../shared/ui/Pager'
import { Panel } from '../../shared/ui/Panel'
import { TextLink } from '../../shared/ui/TextButton'
import { useStartAndOpenApplication } from '../applications/useStartApplication'
import styles from './HomeList.module.css'

const fromHome: ApplicationOrigin = { from: 'home' }

/** Bewerbungen „In Bearbeitung“ (noch nicht verschickt), seitenweise aus dem Backend. */
export function DraftsBlock({
  drafts,
  count,
  page,
  pageSize,
  totalPages,
  onPageChange,
  newest,
}: {
  drafts: ApplicationCompact[]
  /** Alle Bewerbungen in Bearbeitung (totalElements) */
  count: number
  /** Seite (0-basiert), Seitengröße und Seitenzahl der Liste; Blättern über onPageChange */
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
  newest?: JobPostingCompact
}) {
  const start = useStartAndOpenApplication('home')

  return (
    <Panel
      title="In Bearbeitung"
      count={count}
      actions={<TextLink to={paths.applications()}>Zum Board</TextLink>}
    >
      {drafts.length ? (
        <>
          <ul className={styles.list}>
            {drafts.map((a) => (
              <li key={a.id} className={styles.row}>
                <div className={styles.main}>
                  <Link to={paths.application(a.id)} state={fromHome} className={styles.link}>
                    {shortTitle(a.jobTitle)}
                  </Link>
                  <div className={styles.sub}>{a.companyName}</div>
                </div>
                <ButtonLink
                  size="sm"
                  className={styles.action}
                  to={paths.application(a.id)}
                  state={fromHome}
                  tabIndex={-1}
                >
                  Weitermachen
                </ButtonLink>
              </li>
            ))}
          </ul>
          {totalPages > 1 && (
            <div className={styles.pager}>
              <Pager
                page={page}
                totalPages={totalPages}
                range={{ size: pageSize, total: count }}
                onChange={onPageChange}
              />
            </div>
          )}
        </>
      ) : (
        <EmptyState
          compact
          fill
          icon={<PenIcon />}
          title="Nichts in Bearbeitung"
          actions={
            newest && (
              <Button size="sm" disabled={start.isPending} onClick={() => start.run(newest.id)}>
                Mit der neuesten Stelle anfangen
              </Button>
            )
          }
        >
          Gerade liegt keine Bewerbung in Arbeit.
        </EmptyState>
      )}
    </Panel>
  )
}
