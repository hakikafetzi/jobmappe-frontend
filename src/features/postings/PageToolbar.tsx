import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router'
import styles from './PageToolbar.module.css'
import { PREFETCH_WAIT_MS, settleWithin } from '../../shared/lib/async'
import { markPageSwitch } from './pageTransition'

/**
 * Suchzeile der Stellen-, Firmen- und Bewerbungen-Seite (Suche, Hauptaktion, Umschalter). Sie steht
 * überall an derselben Stelle und bleibt beim animierten Wechsel ruhig.
 */
export function PageToolbar({ children }: { children: ReactNode }) {
  return <div className={styles.toolbar}>{children}</div>
}

/** Hauptaktion neben der Suche (blau, so hoch wie die Suchleiste). */
export function ToolbarAction({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className={styles.action} onClick={onClick}>
      {children}
    </button>
  )
}

/**
 * Wechsel zur anderen Seite (Stellen ↔ Firmen) mit animiertem Übergang. `prefetch` lädt die
 * Daten der Zielseite (schon beim Überfahren); erst danach startet der Übergang, damit er die
 * fertige Seite erfasst statt eines Spinners.
 */
export function PageSwitchLink({
  to,
  prefetch,
  children,
}: {
  to: string
  prefetch?: (qc: QueryClient) => Promise<unknown>
  children: ReactNode
}) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  // Fehler zeigt die Zielseite selbst an
  const load = () => (prefetch ? prefetch(qc).catch(() => {}) : Promise.resolve())
  return (
    <Link
      to={to}
      viewTransition
      className={styles.switch}
      onPointerEnter={() => void load()}
      onFocus={() => void load()}
      onClick={(e) => {
        // Neuer Tab/Fenster: dem Browser überlassen
        if (!prefetch || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        void settleWithin(load(), PREFETCH_WAIT_MS).then(() => {
          markPageSwitch()
          return navigate(to, { viewTransition: true })
        })
      }}
    >
      {children}
    </Link>
  )
}

/**
 * Wechsel zur anderen Ansicht derselben Seite (Board ↔ Tabelle); sieht aus wie `PageSwitchLink`.
 * `onPrefetch` lädt die Daten der Zielansicht schon beim Überfahren bzw. Fokussieren.
 */
export function PageSwitchButton({
  onClick,
  onPrefetch,
  children,
}: {
  onClick: () => void
  onPrefetch?: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      className={styles.switch}
      onClick={onClick}
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
    >
      {children}
    </button>
  )
}
