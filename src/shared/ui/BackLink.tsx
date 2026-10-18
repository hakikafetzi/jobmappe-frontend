import { Link } from 'react-router'
import styles from './BackLink.module.css'

type Props = {
  to: string
  children: string
  /** Seitenwechsel animieren (View Transition) */
  viewTransition?: boolean
  onClick?: () => void
}

/** „← Zurück zu …“ oberhalb einer Seite. */
export function BackLink({ to, children, viewTransition, onClick }: Props) {
  return (
    <Link to={to} className={styles.back} viewTransition={viewTransition} onClick={onClick}>
      ← {children}
    </Link>
  )
}
