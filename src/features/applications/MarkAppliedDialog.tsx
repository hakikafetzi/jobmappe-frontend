import { useId, useState } from 'react'
import { usePatchApplication } from '../../api/applications'
import { APP_STATUS } from '../../domain/labels'
import { Button } from '../../shared/ui/Button'
import { ModalDialog } from '../../shared/ui/Dialog'
import { InfoNote } from '../../shared/ui/InfoNote'
import { useToast } from '../../shared/ui/toastContext'
import type { ClosableApplication } from './closableApplication'
import { ApplicationSubject } from './components/ApplicationSubject'
import { ViaFields, type ViaInput } from './components/ViaFields'
import { buildViaPatch, viaUrlError } from './detail/viaPatch'

/**
 * „In Bearbeitung“ → „Beworben“: fragt nach dem Bewerbungsweg (beides freiwillig) und setzt Status
 * und Weg in einem PATCH. Das Bewerbungsdatum setzt das Backend. Abbrechen lässt den Status unverändert.
 */
export function MarkAppliedDialog({ app, onClose }: { app: ClosableApplication; onClose: () => void }) {
  const toast = useToast()
  const patch = usePatchApplication()
  const [via, setVia] = useState<ViaInput>({ way: null, url: '' })
  const [urlError, setUrlError] = useState<string>()
  const urlId = useId()

  const save = () => {
    const error = viaUrlError(via)
    if (error) {
      setUrlError(error)
      document.getElementById(urlId)?.focus()
      return
    }
    patch.mutate(
      {
        id: app.id,
        patch: { status: 'APPLIED', ...buildViaPatch({ appliedVia: null, portalUrl: null }, via) },
      },
      {
        onSuccess: () => {
          onClose()
          toast(`Status: ${APP_STATUS.APPLIED.label}`)
        },
      },
    )
  }

  return (
    <ModalDialog
      title="Wie hast du dich beworben?"
      subtitle={<ApplicationSubject jobTitle={app.jobTitle} companyName={app.companyName} />}
      size="narrow"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" onClick={save} disabled={patch.isPending}>
            Als beworben markieren
          </Button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          save()
        }}
      >
        <ViaFields
          value={via}
          onChange={(next) => {
            setVia(next)
            if (next.url !== via.url) setUrlError(undefined)
          }}
          urlId={urlId}
          urlError={urlError}
        />
        <InfoNote centered>Beides ist freiwillig und lässt sich später ergänzen.</InfoNote>
        <button type="submit" hidden>
          Als beworben markieren
        </button>
      </form>
    </ModalDialog>
  )
}
