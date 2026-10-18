import type { CSSProperties } from 'react'
import type { ApplicationPriority } from '../../../api/types'
import { PRIORITY_COLOR, PRIORITY_LABEL } from '../../../domain/labels'
import { cx } from '../../../shared/lib/cx'
import styles from './PriorityLabel.module.css'

/** Punkt + Label der Priorität (Board, Tabelle); `card`: etwas größer auf den Board-Karten. */
export function PriorityLabel({ priority, card }: { priority: ApplicationPriority; card?: boolean }) {
  return (
    <span
      className={cx(styles.priority, card && styles.card, priority === 'NONE' && styles.none)}
      style={{ '--dot': PRIORITY_COLOR[priority] } as CSSProperties}
    >
      <span className={styles.dot} aria-hidden="true" />
      {PRIORITY_LABEL[priority]}
    </span>
  )
}
