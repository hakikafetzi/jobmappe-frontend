import { Link } from 'react-router'
import type { JobPostingCompact } from '../../api/types'
import { paths } from '../../app/paths'
import { daysSince, shortTitle } from '../../shared/lib/format'
import { Button } from '../../shared/ui/Button'
import { Chip } from '../../shared/ui/Chip'
import { EmptyState } from '../../shared/ui/EmptyState'
import { BriefcaseIcon } from '../../shared/ui/icons'
import { Pager } from '../../shared/ui/Pager'
import { Panel } from '../../shared/ui/Panel'
import { TextLink } from '../../shared/ui/TextButton'
import { useStartAndOpenApplication } from '../applications/useStartApplication'
import { FindPostingsActions } from '../postings/FindPostingsActions'
import styles from './HomeList.module.css'
import { capturedLabel } from './homeText'

/** Stellen ohne Bewerbung, neueste zuerst, seitenweise aus dem Backend. */
export function OpenPostingsBlock({
  open,
  count,
  page,
  pageSize,
  totalPages,
  onPageChange,
  now,
}: {
  open: JobPostingCompact[]
  /** Alle offenen Stellen (totalElements) */
  count: number
  /** Seite (0-basiert), Seitengröße und Seitenzahl der Liste; Blättern über onPageChange */
  page: number
  pageSize: number
  totalPages: number
  onPageChange: (page: number) => void
  now: Date
}) {
  const start = useStartAndOpenApplication('home')

  return (
    <Panel
      title="Offene Stellen"
      count={count}
      actions={<TextLink to={paths.postings('open')}>Zu den Stellen</TextLink>}
    >
      {open.length ? (
        <>
          <ul className={styles.list}>
            {open.map((p) => (
              <li key={p.id} className={styles.row}>
                <div className={styles.main}>
                  <Link to={paths.posting(p.id, 'all')} className={styles.link}>
                    {shortTitle(p.title)}
                  </Link>
                  <div className={styles.sub}>
                    {p.companyName}
                    {p.location && `, ${p.location}`}
                  </div>
                  <div className={styles.chips}>
                    <Chip>{capturedLabel(daysSince(p.createdAt, now) ?? 0)}</Chip>
                  </div>
                </div>
                <Button
                  size="sm"
                  className={styles.action}
                  disabled={start.isPending}
                  onClick={() => start.run(p.id)}
                >
                  Bewerbung starten
                </Button>
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
          icon={<BriefcaseIcon />}
          title="Keine offenen Stellen"
          actions={<FindPostingsActions />}
        >
          Erfasse deine erste Stelle von Hand.
        </EmptyState>
      )}
    </Panel>
  )
}
