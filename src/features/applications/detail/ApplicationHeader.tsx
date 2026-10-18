import { Link } from 'react-router'
import type { ApplicationDetail } from '../../../api/types'
import { paths } from '../../../app/paths'
import { PRIORITY_COLOR, PRIORITY_LABEL, isClosedStatus } from '../../../domain/labels'
import { Button } from '../../../shared/ui/Button'
import { Chip } from '../../../shared/ui/Chip'
import { CheckCircleIcon, UndoIcon } from '../../../shared/ui/icons'
import { StatusChip } from '../components/StatusChip'
import styles from './ApplicationHeader.module.css'

type Props = {
  app: ApplicationDetail
  /** Öffnet „Bewerbung abschließen“ (nur bei laufenden Bewerbungen sichtbar) */
  onClose: () => void
  /** Öffnet „Bewerbung wieder öffnen“ (nur bei abgeschlossenen Bewerbungen sichtbar) */
  onReopen: () => void
}

export function ApplicationHeader({ app, onClose, onReopen }: Props) {
  const { jobPosting: posting, company } = app
  return (
    <header className={styles.card}>
      <div className={styles.text}>
        <h1 className={styles.title}>{posting.title}</h1>
        <div className={styles.sub}>
          <Link to={paths.company(company.id)} className={styles.company}>
            {company.name}
          </Link>
          {posting.location && `, ${posting.location}`}
        </div>
        <div className={styles.facts}>
          <StatusChip status={app.status} plain={isClosedStatus(app.status)} />
          <Chip color={PRIORITY_COLOR[app.priority]}>
            {app.priority === 'NONE'
              ? 'Keine Priorität'
              : `Priorität ${PRIORITY_LABEL[app.priority].toLowerCase()}`}
          </Chip>
        </div>
      </div>
      <div className={styles.actions}>
        {isClosedStatus(app.status) ? (
          <Button onClick={onReopen}>
            <UndoIcon width={15} height={15} />
            Wieder öffnen
          </Button>
        ) : (
          <Button onClick={onClose}>
            <CheckCircleIcon width={15} height={15} />
            Bewerbung abschließen
          </Button>
        )}
      </div>
    </header>
  )
}
