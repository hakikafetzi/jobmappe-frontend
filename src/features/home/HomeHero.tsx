import { Link } from 'react-router'
import { paths } from '../../app/paths'
import { COMPACT_QUERY, useMediaQuery } from '../../shared/hooks/useMediaQuery'
import { useDisplayName } from '../../shared/settings/displayName'
import { UserIcon } from '../../shared/ui/icons'
import styles from './HomeHero.module.css'
import { greetingFor } from './homeText'

/**
 * Kopf der Startseite: Avatar (führt zu den Einstellungen), Datum, Uhrzeit und Begrüßung mit dem
 * Namen aus den Einstellungen.
 */
export function HomeHero({ now }: { now: Date }) {
  const compact = useMediaQuery(COMPACT_QUERY)
  const [name] = useDisplayName()
  const date = now.toLocaleDateString(
    'de-DE',
    compact
      ? { weekday: 'short', day: 'numeric', month: 'short' }
      : { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  )
  const time = `${now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr`

  return (
    <section className={styles.hero} aria-label="Übersicht">
      <Link to={paths.settings()} className={styles.avatar} aria-label="Einstellungen öffnen">
        <UserIcon className={styles.avatarIcon} />
      </Link>
      <div className={styles.text}>
        <div className={styles.clock}>
          <time dateTime={now.toISOString()}>{date}</time>
          <span className={styles.dot} aria-hidden="true" />
          <span>{time}</span>
        </div>
        <h1 className={styles.greeting}>{greetingFor(now.getHours(), name)}</h1>
      </div>
    </section>
  )
}
