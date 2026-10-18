import type { ReactNode } from 'react'
import { Button } from './Button'
import { ModalDialog } from './Dialog'

type Props = {
  title: string
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  danger?: boolean
  busy?: boolean
}

/** Rückfrage vor einer folgenreichen Aktion (ersetzt window.confirm). */
export function ConfirmDialog({ title, children, confirmLabel, onConfirm, onCancel, danger, busy }: Props) {
  return (
    <ModalDialog
      title={title}
      onClose={onCancel}
      size="small"
      footer={
        <>
          <Button onClick={onCancel}>Abbrechen</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </ModalDialog>
  )
}
