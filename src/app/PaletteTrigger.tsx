import { modKeyLabel } from '../shared/lib/platform'
import { SearchIcon } from '../shared/ui/icons'
import styles from './PaletteTrigger.module.css'

/** Lupe in der Kopfleiste: öffnet die Command Palette (dort steht auch das Kürzel ⌘K). */
export function PaletteTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className={styles.trigger}
      aria-label="Befehle und Suche"
      aria-keyshortcuts="Meta+K Control+K"
      title={`Befehle und Suche (${modKeyLabel('K')})`}
      onClick={onClick}
    >
      <SearchIcon className={styles.icon} />
    </button>
  )
}
