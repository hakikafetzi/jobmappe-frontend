import { shortTitle } from '../../../shared/lib/format'
import styles from './ApplicationSubject.module.css'

/** Untertitel der Bewerbungs-Dialoge: Stelle, darunter die Firma. */
export function ApplicationSubject({ jobTitle, companyName }: { jobTitle: string; companyName: string }) {
  return (
    <>
      <span className={styles.subject}>{shortTitle(jobTitle)}</span>
      <span className={styles.company}>{companyName}</span>
    </>
  )
}
