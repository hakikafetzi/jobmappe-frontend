import { useId, useState } from 'react'
import { serverFieldErrors } from '../../../api/errors'
import { useUpdatePosting } from '../../../api/jobPostings'
import type { JobPostingDetail, JobPostingStatus } from '../../../api/types'
import { POSTING_STATUS_LABEL } from '../../../domain/labels'
import { RichTextEditor } from '../../../shared/editor/RichTextEditor'
import { toIsoDate } from '../../../shared/lib/format'
import { Button } from '../../../shared/ui/Button'
import { ModalDialog } from '../../../shared/ui/Dialog'
import { DateInput } from '../../../shared/ui/DateInput'
import { Field, RequiredNote, Select, TextInput } from '../../../shared/ui/Field'
import { useToast } from '../../../shared/ui/toastContext'
import styles from './PostingEditDialog.module.css'
import {
  pickPostingErrors,
  POSTING_FIELDS,
  toFormValues,
  toPostingRequest,
  type PostingField,
  type PostingFieldErrors,
  type PostingFormValues,
} from './postingForm'

/** Stelle bearbeiten (PUT); die Firma bleibt, sie lässt sich über den Vertrag nicht wechseln. */
export function PostingEditDialog({ posting, onClose }: { posting: JobPostingDetail; onClose: () => void }) {
  const toast = useToast()
  const update = useUpdatePosting()
  const [values, setValues] = useState(() => toFormValues(posting))
  const [errors, setErrors] = useState<PostingFieldErrors>({})
  const prefix = useId()
  const idOf = (field: PostingField) => `${prefix}-${field}`
  const [today] = useState(() => toIsoDate(new Date()))

  const set = <K extends keyof PostingFormValues>(key: K, value: PostingFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const showErrors = (next: PostingFieldErrors) => {
    setErrors(next)
    const first = POSTING_FIELDS.find((f) => next[f])
    if (first) document.getElementById(idOf(first))?.focus()
  }

  const save = () => {
    const result = toPostingRequest(values, today)
    if ('errors' in result) {
      showErrors(result.errors)
      return
    }
    setErrors({})
    update.mutate(
      { id: posting.id, body: result.body },
      {
        onSuccess: () => {
          onClose()
          toast('Stelle gespeichert')
        },
        onError: (err) => showErrors(pickPostingErrors(serverFieldErrors(err))),
      },
    )
  }

  const errorFor = (field: PostingField) => errors[field]

  return (
    <ModalDialog
      title="Stelle bearbeiten"
      subtitle={posting.company.name}
      size="wide"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" onClick={save} disabled={update.isPending}>
            {update.isPending ? 'Wird gespeichert …' : 'Speichern'}
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
        <RequiredNote />
        <Field label="Titel der Stelle" id={idOf('title')} error={errorFor('title')} required>
          {(id) => (
            <TextInput
              id={id}
              required
              placeholder="z. B. Junior Java Entwickler (m/w/d)"
              autoFocus
              maxLength={255}
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
            />
          )}
        </Field>
        <Field label="Link zur Anzeige" id={idOf('url')} error={errorFor('url')} required>
          {(id) => (
            <TextInput
              id={id}
              type="url"
              required
              placeholder="z. B. https://karriere.firmenname.de/jobs/1234"
              maxLength={1000}
              value={values.url}
              onChange={(e) => set('url', e.target.value)}
            />
          )}
        </Field>
        <div className={styles.grid}>
          <Field label="Ort" id={idOf('location')} error={errorFor('location')}>
            {(id) => (
              <TextInput
                id={id}
                placeholder="z. B. Frankfurt am Main oder Remote"
                maxLength={255}
                value={values.location}
                onChange={(e) => set('location', e.target.value)}
              />
            )}
          </Field>
          <Field label="Veröffentlicht am" id={idOf('publishedAt')} error={errorFor('publishedAt')}>
            {(id) => (
              <DateInput
                id={id}
                max={today}
                value={values.publishedAt}
                onChange={(v) => set('publishedAt', v)}
              />
            )}
          </Field>
          <Field label="Anzeige">
            {(id) => (
              <Select
                id={id}
                value={values.status}
                onChange={(e) => set('status', e.target.value as JobPostingStatus)}
              >
                {Object.entries(POSTING_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>
        <Field label="Stellenbeschreibung">
          {(id) => (
            <RichTextEditor
              id={id}
              initialValue={values.description}
              onChange={(md) => set('description', md)}
              label="Stellenbeschreibung"
              placeholder="Text der Stellenanzeige hier einfügen oder abtippen"
            />
          )}
        </Field>
      </form>
    </ModalDialog>
  )
}
