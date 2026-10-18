import { useLayoutEffect } from 'react'
import { useToast, type ShowToast } from '../shared/ui/toastContext'

/** Reicht den Toast des Providers an einen außerhalb erzeugten QueryClient weiter (wie AppProviders). */
export function ToastBridge({ onToast }: { onToast: (toast: ShowToast) => void }) {
  const toast = useToast()
  useLayoutEffect(() => onToast(toast), [onToast, toast])
  return null
}
