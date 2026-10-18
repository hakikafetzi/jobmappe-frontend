import { useId, useState } from 'react'
import { useNavigate } from 'react-router'
import { serverFieldErrors } from '../../../api/errors'
import { createPostingMeta, CreatePostingError, useCreatePosting } from '../../../api/jobPostings'
import { paths } from '../../../app/paths'
import { RichTextEditor } from '../../../shared/editor/RichTextEditor'
import { toIsoDate } from '../../../shared/lib/format'
import { Button } from '../../../shared/ui/Button'
import { ModalDialog } from '../../../shared/ui/Dialog'
import { DateInput } from '../../../shared/ui/DateInput'
import { Field, TextInput } from '../../../shared/ui/Field'
import { useToast } from '../../../shared/ui/toastContext'
import { CompanyCombobox } from './CompanyCombobox'
import styles from './NewPostingDialog.module.css'
import { NewCompanyFields } from './NewCompanyFields'
import {
  EMPTY_VALUES,
  firstErrorField,
  pickNewPostingErrors,
  toCreatePostingInput,
  type NewPostingField,
  type NewPostingFieldErrors,
  type NewPostingValues,
} from './newPostingForm'

/** Stelle von Hand erfassen; legt eine neue Firma bei Bedarf mit an. */
export function NewPostingDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const toast = useToast()
  const create = useCreatePosting()
  const [values, setValues] = useState<NewPostingValues>(EMPTY_VALUES)
  const [errors, setErrors] = useState<NewPostingFieldErrors>({})
  const prefix = useId()
  const idOf = (field: NewPostingField) => `${prefix}-${field}`
  const [today] = useState(() => toIsoDate(new Date()))

  const set = <K extends keyof NewPostingValues>(key: K, value: NewPostingValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }))

  const showErrors = (next: NewPostingFieldErrors) => {
    setErrors(next)
    const first = firstErrorField(next)
    if (first) document.getElementById(idOf(first))?.focus()
  }

  const save = () => {
    const result = toCreatePostingInput(values, today)
    if ('error' in result) {
      showErrors({ [result.error.field]: result.error.message })
      return
    }
    setErrors({})
    create.mutate(result.input, {
      onSuccess: (posting) => {
        onClose()
        void navigate(paths.posting(posting.id, 'open'))
        toast('Stelle gespeichert')
      },
      onError: (err) => {
        // Firma ist schon angelegt: beim nächsten Versuch nicht noch einmal anlegen
        if (err instanceof CreatePostingError && err.createdCompany) {
          const { id, name } = err.createdCompany
          set('company', { kind: 'existing', company: { id, name, jobsCount: 0 } })
        }
        showErrors(pickNewPostingErrors(serverFieldErrors(err, createPostingMeta)))
      },
    })
  }

  const errorFor = (field: NewPostingField) => errors[field]

  return (
    <ModalDialog
      title="Stelle erfassen"
      size="wide"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" onClick={save} disabled={create.isPending}>
            {create.isPending ? 'Wird gespeichert …' : 'Stelle speichern'}
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
        <Field label="Link zur Anzeige" id={idOf('url')} error={errorFor('url')}>
          {(id) => (
            <TextInput
              id={id}
              type="url"
              placeholder="https://…"
              maxLength={1000}
              autoFocus
              value={values.url}
              onChange={(e) => set('url', e.target.value)}
            />
          )}
        </Field>
        <Field label="Titel der Stelle" id={idOf('title')} error={errorFor('title')}>
          {(id) => (
            <TextInput
              id={id}
              placeholder="Junior Java Entwickler (m/w/d)"
              maxLength={255}
              value={values.title}
              onChange={(e) => set('title', e.target.value)}
            />
          )}
        </Field>
        <div className={styles.grid}>
          <Field label="Firma" id={idOf('company')} error={errorFor('company')}>
            {(id) => <CompanyCombobox id={id} value={values.company} onChange={(c) => set('company', c)} />}
          </Field>
          <Field label="Ort" id={idOf('location')} error={errorFor('location')}>
            {(id) => (
              <TextInput
                id={id}
                placeholder="Frankfurt am Main"
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
        </div>
        {values.company?.kind === 'new' && (
          <NewCompanyFields
            name={values.company.name}
            values={values.newCompany}
            onChange={(newCompany) => set('newCompany', newCompany)}
            errors={errors}
            idOf={idOf}
          />
        )}
        <Field label="Stellenbeschreibung">
          {(id) => (
            <RichTextEditor
              id={id}
              initialValue=""
              onChange={(md) => set('description', md)}
              label="Stellenbeschreibung"
              placeholder="Text der Anzeige einfügen"
            />
          )}
        </Field>
      </form>
    </ModalDialog>
  )
}
