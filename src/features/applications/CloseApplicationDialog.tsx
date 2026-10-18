import { useState } from 'react'
import { usePatchApplication } from '../../api/applications'
import type { ApplicationStatus } from '../../api/types'
import { APP_STATUS, OUTCOMES } from '../../domain/labels'
import { outcomesFor } from '../../domain/transitions'
import { shortTitle } from '../../shared/lib/format'
import { Button } from '../../shared/ui/Button'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { ModalDialog } from '../../shared/ui/Dialog'
import { useToast } from '../../shared/ui/toastContext'
import type { ClosableApplication } from './closableApplication'
import { ApplicationSubject } from './components/ApplicationSubject'
import { ChoiceGrid } from './components/ChoiceGrid'

/**
 * Ausgang wählen und abschließen; das Abschlussdatum setzt das Backend. Mit „Rückgängig“.
 * Welche Ausgänge wählbar sind, hängt vom Status ab (`outcomesFor`); nichts ist vorgewählt.
 * Aus „In Bearbeitung“ gibt es nur „Zurückgezogen“ — dann genügt eine Rückfrage.
 */
export function CloseApplicationDialog({ app, onClose }: { app: ClosableApplication; onClose: () => void }) {
  const toast = useToast()
  const patch = usePatchApplication()
  const outcomes = outcomesFor(app.status)
  const [outcome, setOutcome] = useState<ApplicationStatus | null>(null)

  const close = (next: ApplicationStatus) => {
    const previous = app.status
    patch.mutate(
      { id: app.id, patch: { status: next } },
      {
        onSuccess: () => {
          onClose()
          toast(`Als ${APP_STATUS[next].short} abgeschlossen`, {
            action: {
              label: 'Rückgängig',
              onClick: () => patch.mutate({ id: app.id, patch: { status: previous } }),
            },
          })
        },
      },
    )
  }

  if (app.status === 'IN_PROGRESS') {
    return (
      <ConfirmDialog
        title="Bewerbung zurückziehen?"
        confirmLabel="Zurückziehen"
        danger
        busy={patch.isPending}
        onConfirm={() => close('WITHDRAWN')}
        onCancel={onClose}
      >
        Die Bewerbung „{shortTitle(app.jobTitle)}“ bei {app.companyName} wird als „Zurückgezogen“
        abgeschlossen.
      </ConfirmDialog>
    )
  }

  return (
    <ModalDialog
      title="Bewerbung abschließen"
      subtitle={<ApplicationSubject jobTitle={app.jobTitle} companyName={app.companyName} />}
      size="medium"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button
            variant="primary"
            onClick={() => outcome && close(outcome)}
            disabled={!outcome || patch.isPending}
          >
            Abschließen
          </Button>
        </>
      }
    >
      <ChoiceGrid
        label="Wie ist sie ausgegangen?"
        value={outcome}
        onChange={setOutcome}
        options={OUTCOMES.filter((o) => outcomes.includes(o.status)).map((o) => ({
          value: o.status,
          label: o.label,
        }))}
      />
    </ModalDialog>
  )
}
