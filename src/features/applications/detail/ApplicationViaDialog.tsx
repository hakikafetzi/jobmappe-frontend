import { useState } from 'react'
import { usePatchApplication } from '../../../api/applications'
import type { ApplicationDetail } from '../../../api/types'
import { Button } from '../../../shared/ui/Button'
import { ModalDialog } from '../../../shared/ui/Dialog'
import { InfoNote } from '../../../shared/ui/InfoNote'
import { useToast } from '../../../shared/ui/toastContext'
import { ViaFields, type ViaInput } from '../components/ViaFields'
import { buildViaPatch } from './viaPatch'

export function ApplicationViaDialog({ app, onClose }: { app: ApplicationDetail; onClose: () => void }) {
  const toast = useToast()
  const patch = usePatchApplication()
  const [via, setVia] = useState<ViaInput>({ way: app.appliedVia, url: app.portalUrl ?? '' })

  const save = () => {
    const body = buildViaPatch(app, via)
    if (!Object.keys(body).length) {
      onClose()
      return
    }
    patch.mutate(
      { id: app.id, patch: body },
      {
        onSuccess: () => {
          onClose()
          toast('Bewerbungsweg gespeichert')
        },
      },
    )
  }

  return (
    <ModalDialog
      title="Bewerbungsweg"
      size="narrow"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" onClick={save} disabled={patch.isPending}>
            Speichern
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <ViaFields value={via} onChange={setVia} />
        <InfoNote centered>Einträge lassen sich ändern, aber noch nicht ganz entfernen.</InfoNote>
        <button type="submit" hidden>
          Speichern
        </button>
      </form>
    </ModalDialog>
  )
}
