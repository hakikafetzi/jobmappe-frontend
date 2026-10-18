import { usePatchApplication } from '../../api/applications'
import { APP_STATUS } from '../../domain/labels'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { useToast } from '../../shared/ui/toastContext'
import { RESET_NOTE, type ClosableApplication } from './closableApplication'

/** Zurück nach „In Bearbeitung“: Das Backend leert dabei Bewerbungsdatum, Weg und Link. */
export function ResetToDraftDialog({ app, onClose }: { app: ClosableApplication; onClose: () => void }) {
  const toast = useToast()
  const patch = usePatchApplication()

  return (
    <ConfirmDialog
      title="Zurück zu „In Bearbeitung“?"
      confirmLabel="Zurücksetzen"
      danger
      busy={patch.isPending}
      onCancel={onClose}
      onConfirm={() =>
        patch.mutate(
          { id: app.id, patch: { status: 'IN_PROGRESS' } },
          {
            onSuccess: () => {
              onClose()
              toast(`Status: ${APP_STATUS.IN_PROGRESS.label}`)
            },
          },
        )
      }
    >
      {RESET_NOTE}
    </ConfirmDialog>
  )
}
