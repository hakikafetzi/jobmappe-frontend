import type { UseQueryResult } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { cx } from '../lib/cx'
import { apiErrorOf, isNotFound, isRetryable } from '../../api/errors'
import { Button } from './Button'
import { EmptyState } from './EmptyState'
import { AlertIcon } from './icons'
import styles from './QueryState.module.css'
import { Spinner } from './Spinner'

type LoadingStateProps = {
  label?: string
  /** Ersetzt den Inhalt einer ganzen Seite: füllt den (Flex-)Container, mittig und groß */
  page?: boolean
}

export function LoadingState({ label = 'Wird geladen …', page }: LoadingStateProps) {
  return (
    <div aria-busy="true" role="status" className={cx(styles.loading, page && styles.page)}>
      <Spinner large={page} />
      <span>{label}</span>
    </div>
  )
}

function errorText(error: unknown): string {
  // 400 = ungültige ID in der Adresse — für den Nutzer dasselbe wie ein fehlender Eintrag
  if (isNotFound(error)) return 'Der Eintrag wurde nicht gefunden.'
  if (apiErrorOf(error)?.status === 0) return 'Das Backend ist nicht erreichbar.'
  return 'Die Daten konnten nicht geladen werden.'
}

type ErrorStateProps = {
  error: unknown
  onRetry?: () => void
  /** Ersetzt den Inhalt einer ganzen Seite: füllt den (Flex-)Container, mittig und groß */
  page?: boolean
}

export function ErrorState({ error, onRetry, page }: ErrorStateProps) {
  return (
    <div role="alert" className={page ? styles.page : undefined}>
      <EmptyState
        large={page}
        fill={page}
        icon={<AlertIcon />}
        title="Etwas ist schiefgelaufen"
        actions={
          onRetry &&
          isRetryable(error) && (
            <Button size="sm" onClick={onRetry}>
              Erneut versuchen
            </Button>
          )
        }
      >
        {errorText(error)}
      </EmptyState>
    </div>
  )
}

/** Rendert Laden/Fehler für eine Query und sonst `children(data)`. */
export function QueryView<T>({
  query,
  children,
  page,
}: {
  query: Pick<UseQueryResult<T>, 'data' | 'error' | 'isPending' | 'refetch'>
  children: (data: T) => ReactNode
  /** Laden und Fehler füllen die Seite (siehe `LoadingState`/`ErrorState`) */
  page?: boolean
}) {
  if (query.isPending) return <LoadingState page={page} />
  if (query.error || query.data === undefined)
    return <ErrorState page={page} error={query.error} onRetry={() => void query.refetch()} />
  return <>{children(query.data)}</>
}
