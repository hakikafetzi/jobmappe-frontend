import { Link } from 'react-router'
import { useColorScheme } from '../theme/theme'
import styles from './Logo.module.css'

const NARROW = '(max-width: 360px)'

/** Logo aus public/: hell/dunkel nach Erscheinungsbild, auf sehr schmalen Geräten nur die Bildmarke. */
export function Logo() {
  const suffix = useColorScheme() === 'dark' ? '-dark' : ''
  return (
    <Link to="/" className={styles.logo} aria-label="JobMappe – zur Startseite">
      <picture>
        <source media={NARROW} srcSet={`/logo-mark${suffix}.svg`} />
        <img className={styles.image} src={`/logo-horizontal${suffix}.svg`} alt="" />
      </picture>
    </Link>
  )
}
