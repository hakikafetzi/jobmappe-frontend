import type { NoteCompact } from '../../api/types'
import { fmtDate } from '../../shared/lib/format'
import { Button } from '../../shared/ui/Button'
import styles from './NoteList.module.css'

type Props = {
  notes: NoteCompact[]
  onOpen: (id: string) => void
  /** Weitere Seiten der Infinite Query („Mehr laden“) */
  more?: { loading: boolean; onLoad: () => void }
}

/** Notizen einer Bewerbung als Liste (Bewerbungsdetail): Titel, Ordner, Datum. */
export function NoteList({ notes, onOpen, more }: Props) {
  return (
    <>
      <ul className={styles.list}>
        {notes.map((n) => (
          <li key={n.id}>
            <button type="button" className={styles.item} onClick={() => onOpen(n.id)}>
              <span className={styles.title}>{n.title}</span>
              <span className={styles.meta}>
                {n.noteCategory && <span className={styles.category}>{n.noteCategory}</span>}
                <span className={styles.date}>{fmtDate(n.createdAt)}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {more && (
        <div className={styles.more}>
          <Button size="sm" variant="ghost" disabled={more.loading} onClick={more.onLoad}>
            {more.loading ? 'Wird geladen …' : 'Mehr laden'}
          </Button>
        </div>
      )}
    </>
  )
}
