import { useAppActions } from '../../app/uiContext'
import { NoteIcon, PlusIcon } from '../../shared/ui/icons'
import { useNoteWindows } from '../notes/noteWorkspaceContext'
import styles from './QuickLinks.module.css'

export function QuickLinks() {
  const { openNewPosting } = useAppActions()
  const noteWindows = useNoteWindows()
  return (
    <nav className={styles.quick} aria-label="Schnellzugriff">
      <button type="button" className={styles.link} onClick={openNewPosting}>
        <span className={styles.icon}>
          <PlusIcon />
        </span>
        <span className={styles.text}>
          <span className={styles.title}>Stelle erfassen</span>
          <span className={styles.description}>Anzeige von Hand anlegen</span>
        </span>
      </button>
      <button type="button" className={styles.link} onClick={() => noteWindows.open(null)}>
        <span className={styles.icon}>
          <NoteIcon />
        </span>
        <span className={styles.text}>
          <span className={styles.title}>Notiz erstellen</span>
          <span className={styles.description}>Gedanken direkt festhalten</span>
        </span>
      </button>
    </nav>
  )
}
