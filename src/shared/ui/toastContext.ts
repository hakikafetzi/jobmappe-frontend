import { createContext, useContext } from 'react'

type ToastAction = { label: string; onClick: () => void }
export type ToastOptions = { action?: ToastAction; tone?: 'success' | 'error' }
export type ShowToast = (message: string, options?: ToastOptions) => void

export const ToastContext = createContext<ShowToast | null>(null)

export function useToast(): ShowToast {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast braucht einen <ToastProvider>')
  return ctx
}
