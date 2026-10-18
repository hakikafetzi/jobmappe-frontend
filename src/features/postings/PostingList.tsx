import { useEffect, useRef, type ReactNode } from 'react'
import { Link } from 'react-router'
import type { JobPostingCompact } from '../../api/types'
import { fmtDate } from '../../shared/lib/format'
import { ApplicationPresenceChip } from './ApplicationPresenceChip'
import { cardTransitionStyle } from './pageTransition'
import styles from './PostingList.module.css'

type Props = {
  postings: JobPostingCompact[]
  selectedId: string | undefined
  hrefFor: (id: string) => string
  /** „Bewerbung angelegt“/„Noch nicht beworben“ zeigen — nur sinnvoll, wenn die Liste beides mischt */
  showApplicationState: boolean
  /** Wird statt der Liste gezeigt, wenn sie leer ist */
  empty: ReactNode
}

export function PostingList({ postings, selectedId, hrefFor, showApplicationState, empty }: Props) {
  const listRef = useRef<HTMLDivElement>(null)

  // Gewählte Karte sichtbar halten (z. B. bei Pfeiltasten)
  useEffect(() => {
    if (!selectedId) return
    listRef.current
      ?.querySelector(`[data-id="${CSS.escape(selectedId)}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  if (!postings.length) return <div className={styles.list}>{empty}</div>

  return (
    <div className={styles.list} ref={listRef} aria-label="Stellen">
      {postings.map((p, i) => (
        <Link
          key={p.id}
          to={hrefFor(p.id)}
          className={styles.card}
          style={cardTransitionStyle(i)}
          data-id={p.id}
          aria-current={p.id === selectedId}
        >
          <h3 className={styles.title}>{p.title}</h3>
          <div className={styles.company}>{p.companyName}</div>
          <div className={styles.location}>{p.location || 'Ort offen'}</div>
          <div className={styles.footer}>
            {showApplicationState && <ApplicationPresenceChip hasApplication={p.hasApplication} />}
            <span className={styles.date}>{fmtDate(p.createdAt)}</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
