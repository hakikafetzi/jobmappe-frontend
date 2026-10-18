import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle'
import { CategorySettings } from '../categories/CategorySettings'
import styles from './SettingsPage.module.css'
import { SettingsPanel } from './SettingsPanel'

/** Einstellungen (über das Profilmenü erreichbar): Browser-Einstellungen und Ordner für Notizen. */
export function SettingsPage() {
  useDocumentTitle('Einstellungen')
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.title}>Einstellungen</h1>
        <SettingsPanel />
        <CategorySettings />
      </div>
    </div>
  )
}
