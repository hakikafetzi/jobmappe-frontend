import type { ReactNode } from 'react'
import { Markdown } from '../../shared/ui/Markdown'
import { cx } from '../../shared/lib/cx'
import styles from './DetailCard.module.css'

/**
 * Rechte Karte der Stellen-Seite: fester Kopf, scrollender Inhalt.
 * `busy`: zeigt noch den bisherigen Eintrag, während der neue lädt (wird nach kurzer Zeit blasser).
 */
export function DetailCard({ busy, children }: { busy?: boolean; children: ReactNode }) {
  return (
    <article className={cx(styles.card, busy && styles.busy)} aria-busy={busy || undefined}>
      {children}
    </article>
  )
}

export function DetailHeader({
  title,
  meta,
  facts,
  tools,
  actions,
  back,
  leading,
}: {
  title: ReactNode
  meta?: ReactNode
  facts?: ReactNode
  /** Kleine Icon-Aktionen (ToolButton) rechts neben den `facts` */
  tools?: ReactNode
  actions?: ReactNode
  back?: ReactNode
  /** Vor dem Titel, z. B. das Firmenzeichen. */
  leading?: ReactNode
}) {
  const titleAndMeta = (
    <>
      <h1 className={styles.title}>{title}</h1>
      {meta && <div className={styles.meta}>{meta}</div>}
    </>
  )
  return (
    <header className={styles.header}>
      <div className={styles.headText}>
        {back && <div className={styles.back}>{back}</div>}
        {leading ? (
          <div className={styles.titleRow}>
            {leading}
            <div className={styles.headText}>{titleAndMeta}</div>
          </div>
        ) : (
          titleAndMeta
        )}
        {(facts || tools) && (
          <div className={styles.facts}>
            {facts}
            {tools && <div className={styles.tools}>{tools}</div>}
          </div>
        )}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}

export function DetailBody({ children }: { children: ReactNode }) {
  return <div className={styles.scroll}>{children}</div>
}

/** Stellenbeschreibung über die volle Breite der Karte. */
export function DetailProse({ source }: { source: string | null }) {
  return <Markdown source={source} fill />
}

export function DetailSection({
  title,
  grow,
  children,
}: {
  title: ReactNode
  /** Nimmt den restlichen Platz der Karte ein (z. B. damit ein leerer Zustand mittig steht) */
  grow?: boolean
  children: ReactNode
}) {
  return (
    <section className={cx(styles.section, grow && styles.grow)}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      {children}
    </section>
  )
}
