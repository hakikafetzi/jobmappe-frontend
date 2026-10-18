import { useState } from 'react'
import { usePatchApplication } from '../../api/applications'
import type { ApplicationStatus } from '../../api/types'
import { APP_STATUS, BOARD_COLUMNS } from '../../domain/labels'
import { Button } from '../../shared/ui/Button'
import { ModalDialog } from '../../shared/ui/Dialog'
import { InfoNote } from '../../shared/ui/InfoNote'
import { useToast } from '../../shared/ui/toastContext'
import { RESET_NOTE, type ClosableApplication } from './closableApplication'
import styles from './ReopenDialog.module.css'
import { ApplicationSubject } from './components/ApplicationSubject'
import { ChoiceGrid } from './components/ChoiceGrid'

const OPTIONS = BOARD_COLUMNS.map((c) => ({ value: c.status, label: APP_STATUS[c.status].label }))

/** Abgeschlossene Bewerbung zurück ins Board holen; der Status wird bewusst gewählt. */
export function ReopenDialog({ app, onClose }: { app: ClosableApplication; onClose: () => void }) {
  const toast = useToast()
  const patch = usePatchApplication()
  const [status, setStatus] = useState<ApplicationStatus | null>(null)

  const reopen = () => {
    if (!status) return
    patch.mutate(
      { id: app.id, patch: { status } },
      {
        onSuccess: () => {
          onClose()
          toast(`Wieder geöffnet: ${APP_STATUS[status].label}`)
        },
      },
    )
  }

  return (
    <ModalDialog
      title="Bewerbung wieder öffnen?"
      subtitle={<ApplicationSubject jobTitle={app.jobTitle} companyName={app.companyName} />}
      size="medium"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" onClick={reopen} disabled={!status || patch.isPending}>
            Wieder öffnen
          </Button>
        </>
      }
    >
      <InfoNote className={styles.text}>
        Sie ist dann nicht mehr abgeschlossen und erscheint wieder als laufende Bewerbung im Board.
      </InfoNote>
      <ChoiceGrid label="In welchem Status?" value={status} onChange={setStatus} options={OPTIONS} />
      {status === 'IN_PROGRESS' && <InfoNote className={styles.note}>{RESET_NOTE}</InfoNote>}
    </ModalDialog>
  )
}
