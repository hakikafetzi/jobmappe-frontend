import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { cx } from '../../shared/lib/cx'
import { prefersReducedMotion } from '../../shared/lib/motion'
import styles from './PageSlide.module.css'
import { slideDirection, type SlideDirection, type SlideKey } from './slideDirection'

/** Länger als die Animation in PageSlide.module.css, falls `animationend` ausbleibt */
const CLEANUP_MS = 600

type Outgoing = { id: number; node: ReactNode; direction: SlideDirection }

/**
 * Blättern mit Schwung: Ändert sich die Seite (bei gleicher Liste), gleitet der bisherige Inhalt
 * hinaus und der neue herein (vor: nach links, zurück: nach rechts). Beide liegen dafür kurz in
 * derselben Rasterzelle übereinander. `slideKey` gehört zu den angezeigten Daten, nicht zur URL,
 * damit die Animation erst startet, wenn die neue Seite geladen ist.
 */
export function PageSlide({
  slideKey: { page, scope },
  pending,
  children,
}: {
  slideKey: SlideKey
  /** Die neue Seite lädt noch (es stehen die alten Daten da): weder animieren noch Schlüssel merken */
  pending: boolean
  children: ReactNode
}) {
  const [outgoing, setOutgoing] = useState<Outgoing | null>(null)
  const [incoming, setIncoming] = useState<{ id: number; direction: SlideDirection } | null>(null)
  const last = useRef<{ key: SlideKey; node: ReactNode } | null>(null)
  const nextId = useRef(0)

  // Vor dem Zeichnen: Seite gewechselt → alten Inhalt als ausgehende Ebene behalten
  useLayoutEffect(() => {
    const prev = last.current
    if (pending || !prev) return
    const direction = slideDirection(prev.key, { page, scope })
    if (!direction || prefersReducedMotion()) return
    const id = ++nextId.current
    setOutgoing({ id, node: prev.node, direction })
    setIncoming({ id, direction })
  }, [page, scope, pending])
  // Nach jedem Rendern den angezeigten Inhalt merken (für den nächsten Wechsel); während des Ladens
  // bleibt der Schlüssel der zuletzt geladenen Seite
  useLayoutEffect(() => {
    last.current = { key: pending && last.current ? last.current.key : { page, scope }, node: children }
  })

  // Aufräumen, falls das Ende der Animation nicht gemeldet wird
  useEffect(() => {
    if (!outgoing) return
    const timer = setTimeout(() => setOutgoing(null), CLEANUP_MS)
    return () => clearTimeout(timer)
  }, [outgoing])

  return (
    <div className={styles.slide}>
      {outgoing && (
        <div
          key={`out-${outgoing.id}`}
          className={cx(styles.layer, outgoing.direction === 'next' ? styles.outLeft : styles.outRight)}
          aria-hidden="true"
          inert
          onAnimationEnd={() => setOutgoing(null)}
        >
          {outgoing.node}
        </div>
      )}
      <div
        key={`in-${incoming?.id ?? 0}`}
        className={cx(
          styles.layer,
          incoming && (incoming.direction === 'next' ? styles.inRight : styles.inLeft),
        )}
      >
        {children}
      </div>
    </div>
  )
}
