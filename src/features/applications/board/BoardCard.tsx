import { useState, type CSSProperties } from 'react'
import { Link } from 'react-router'
import type { ApplicationCompact } from '../../../api/types'
import { paths, type ApplicationOrigin } from '../../../app/paths'
import { cx } from '../../../shared/lib/cx'
import { shortTitle } from '../../../shared/lib/format'
import { useSettings } from '../../../shared/settings/useSettings'
import { ageLevel } from '../age'
import { PriorityLabel } from '../components/PriorityLabel'
import styles from './BoardCard.module.css'

const LEVEL_CLASS = [styles.level0, styles.level1, styles.level2, styles.level3]

type Props = {
  application: ApplicationCompact
  onDragStart: (application: ApplicationCompact) => void
  onDragEnd: () => void
  /** Name für den Wechsel zur Tabelle (boardCardStyle) */
  style?: CSSProperties
}

export function BoardCard({ application: a, onDragStart, onDragEnd, style }: Props) {
  const { followUpDays } = useSettings()
  const [dragging, setDragging] = useState(false)
  const state: ApplicationOrigin = { from: 'board' }

  return (
    <Link
      to={paths.application(a.id)}
      state={state}
      className={cx(styles.card, dragging && styles.dragging)}
      style={style}
      data-vt-card
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', a.id)
        setDragging(true)
        onDragStart(a)
      }}
      onDragEnd={() => {
        setDragging(false)
        onDragEnd()
      }}
    >
      <div className={styles.title} title={a.jobTitle}>
        {shortTitle(a.jobTitle)}
      </div>
      <div className={styles.company}>{a.companyName}</div>
      <div className={styles.footer}>
        <PriorityLabel priority={a.priority} card />
        <AgePill days={a.daysSinceApplication} status={a.status} followUpDays={followUpDays} />
      </div>
    </Link>
  )
}

function AgePill({
  days,
  status,
  followUpDays,
}: {
  days: number | null
  status: ApplicationCompact['status']
  followUpDays: number
}) {
  if (days === null)
    return (
      <span className={cx(styles.age, styles.level0)} title="Noch nicht verschickt">
        offen
      </span>
    )
  const tip = status === 'APPLIED' ? `seit ${days} Tagen ohne Rückmeldung` : `${days} Tage seit der Bewerbung`
  return (
    <span className={cx(styles.age, LEVEL_CLASS[ageLevel(days, followUpDays)])} title={tip}>
      {days} Tage
    </span>
  )
}
