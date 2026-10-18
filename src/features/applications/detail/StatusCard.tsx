import { useId } from 'react'
import type { ApplicationDetail, ApplicationPriority, ApplicationStatus } from '../../../api/types'
import {
  APP_STATUS,
  BOARD_COLUMNS,
  PRIORITY_LABEL,
  PRIORITY_OPTIONS,
  isClosedStatus,
} from '../../../domain/labels'
import { canMoveTo } from '../../../domain/transitions'
import { cx } from '../../../shared/lib/cx'
import { ButtonAnchor } from '../../../shared/ui/Button'
import { Panel } from '../../../shared/ui/Panel'
import { PillGroup } from '../../../shared/ui/PillGroup'
import { StatusChip } from '../components/StatusChip'
import styles from './SideCards.module.css'

type Props = {
  app: ApplicationDetail
  onStatusChange: (status: ApplicationStatus) => void
  onPriorityChange: (priority: ApplicationPriority) => void
}

const PRIORITY_PILLS = PRIORITY_OPTIONS.map((p) => ({ value: p, label: PRIORITY_LABEL[p] }))

/**
 * Bewerbungsstand: laufende Status (wie die Board-Spalten) und Priorität als Pillen, darunter der
 * Link zum Bewerbungsportal (falls hinterlegt), wo man den Stand beim Unternehmen verfolgt; nicht erlaubte Wechsel
 * (transitions.ts) sind ausgegraut. Die Ausgänge setzt „Bewerbung abschließen“ im Kopf der Seite.
 * Abgeschlossene Bewerbungen sind hier gesperrt und lassen sich nur über „Wieder öffnen“ im Kopf öffnen.
 */
export function StatusCard({ app, onStatusChange, onPriorityChange }: Props) {
  const statusLabelId = useId()
  const priorityLabelId = useId()
  const closed = isClosedStatus(app.status)
  const statusPills = BOARD_COLUMNS.map((c) => ({
    value: c.status,
    label: APP_STATUS[c.status].short,
    disabled: c.status !== app.status && !canMoveTo(app.status, c.status),
  }))

  return (
    <Panel title="Bewerbungsstand">
      <div className={cx(styles.body, styles.form)}>
        <div className={styles.field}>
          <span id={statusLabelId}>Status</span>
          {closed && (
            <div className={styles.closed}>
              Abgeschlossen: <StatusChip status={app.status} plain />
            </div>
          )}
          <PillGroup
            labelledBy={statusLabelId}
            value={app.status}
            onChange={onStatusChange}
            options={statusPills}
            disabled={closed}
          />
        </div>
        <div className={styles.field}>
          <span id={priorityLabelId}>Priorität</span>
          <PillGroup
            labelledBy={priorityLabelId}
            value={app.priority}
            onChange={onPriorityChange}
            options={PRIORITY_PILLS}
            disabled={closed}
          />
        </div>
        {app.portalUrl && (
          <ButtonAnchor block href={app.portalUrl}>
            Bewerbungsportal ↗
          </ButtonAnchor>
        )}
      </div>
    </Panel>
  )
}
