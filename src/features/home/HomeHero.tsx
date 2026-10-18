import { COMPACT_QUERY, useMediaQuery } from '../../shared/hooks/useMediaQuery'
import { useDisplayName } from '../../shared/settings/displayName'
import styles from './HomeHero.module.css'
import { greetingFor } from './homeText'

/** Kopf der Startseite: Datum, Uhrzeit und Begrüßung (mit dem Namen aus den Einstellungen). */
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
      <div className={styles.clock}>
        <time dateTime={now.toISOString()}>{date}</time>
        <span className={styles.dot} aria-hidden="true" />
        <span>{time}</span>
      </div>
      <h1 className={styles.greeting}>{greetingFor(now.getHours(), name)}</h1>
    </section>
  )
}
