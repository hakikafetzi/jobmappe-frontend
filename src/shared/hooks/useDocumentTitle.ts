import { useEffect } from 'react'

const APP_NAME = 'JobMappe'

/** „JobMappe | Seite“ als Titel des Browser-Tabs; ohne Seite nur „JobMappe“. */
export function documentTitle(page?: string): string {
  return page ? `${APP_NAME} | ${page}` : APP_NAME
}

/**
 * Setzt den Tab-Titel der aktuellen Seite. Jede Seite ruft den Hook genau einmal auf.
 * `null` überlässt den Titel einer Unterkomponente (z. B. der Firmenansicht in „Stellen“).
 */
export function useDocumentTitle(page: string | null) {
  useEffect(() => {
    if (page !== null) document.title = documentTitle(page)
  }, [page])
}
