import { QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useLatest } from '../shared/hooks/useLatest'
import { useToast } from '../shared/ui/toastContext'
import { ToastProvider } from '../shared/ui/ToastProvider'
import { createQueryClient } from './queryClient'

function QueryProvider({ children }: { children: ReactNode }) {
  const toast = useLatest(useToast())
  const [client] = useState(() => createQueryClient(toast))
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <QueryProvider>{children}</QueryProvider>
    </ToastProvider>
  )
}
