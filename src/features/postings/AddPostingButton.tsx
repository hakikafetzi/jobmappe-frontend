import { useAppActions } from '../../app/uiContext'
import { PlusIcon } from '../../shared/ui/icons'
import styles from './AddPostingButton.module.css'

/** Knopf „+ Stelle“: öffnet „Neue Stelle“ zum Erfassen von Hand. */
export function AddPostingButton() {
  const { openNewPosting } = useAppActions()
  return (
    <button type="button" className={styles.button} onClick={openNewPosting}>
      <PlusIcon className={styles.plus} />
      Stelle
    </button>
  )
}
