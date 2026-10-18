import { MutationCache, QueryClient } from '@tanstack/react-query'
import type { RefObject } from 'react'
import { isRetryable, mutationToastMessage } from '../api/errors'
import type { ShowToast } from '../shared/ui/toastContext'

/**
 * QueryClient mit zentraler Fehleranzeige für Mutationen (meta.errorMessage, ergänzt um den Grund).
 * Fehler, die das Formular selbst anzeigt (meta.inlineFields/conflictField), ergeben keinen Toast.
 * `retry: false` für Tests.
 */
export function createQueryClient(toast: RefObject<ShowToast>, { retry = true } = {}) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // 400/404 ändern sich durch Wiederholen nicht
        retry: (failureCount, error) => retry && failureCount < 1 && isRetryable(error),
      },
    },
    mutationCache: new MutationCache({
      onError: (error, _vars, _ctx, mutation) => {
        const message = mutationToastMessage(error, mutation.meta)
        if (message) toast.current(message, { tone: 'error' })
      },
    }),
  })
}
