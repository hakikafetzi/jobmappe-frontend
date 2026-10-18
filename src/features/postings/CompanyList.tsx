import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import type { CompanyCompact } from '../../api/types'
import { paths, type CompanyListQuery } from '../../app/paths'
import { plural } from '../../shared/lib/format'
import { Avatar } from '../../shared/ui/Avatar'
import styles from './CompanyList.module.css'
import { cardTransitionStyle } from './pageTransition'

type Props = {
  /** Eine Seite der Firmen, vom Backend sortiert */
  companies: CompanyCompact[]
  selectedId: string | undefined
  /** Suche, Seite (0-basiert) und Seitengröße — bleiben beim Wählen einer Firma erhalten */
  query: CompanyListQuery
}

/** Firmen als Karten (linke Spalte der Firmen-Seite). */
export function CompanyList({ companies, selectedId, query }: Props) {
  const listRef = useRef<HTMLDivElement>(null)

  // Gewählte Karte sichtbar halten (z. B. beim Öffnen aus einer Stelle)
  useEffect(() => {
    if (!selectedId) return
    listRef.current
      ?.querySelector(`[data-id="${CSS.escape(selectedId)}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [selectedId])

  return (
    <div className={styles.list} ref={listRef}>
      {companies.map((c, i) => (
        <Link
          key={c.id}
          to={paths.company(c.id, query)}
          className={styles.card}
          style={cardTransitionStyle(i)}
          data-id={c.id}
          aria-current={c.id === selectedId}
        >
          <Avatar name={c.name} size="md" />
          <div className={styles.text}>
            <h3 className={styles.name}>{c.name}</h3>
            <div className={styles.meta}>{plural(c.jobsCount, 'Stelle', 'Stellen')} erfasst</div>
          </div>
        </Link>
      ))}
    </div>
  )
}
