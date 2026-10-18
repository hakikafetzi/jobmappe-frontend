import { useId, useState } from 'react'
import { saveCompanyMeta, useSaveCompany } from '../../../api/companies'
import { serverFieldErrors } from '../../../api/errors'
import type { CompanyResponse } from '../../../api/types'
import { Button } from '../../../shared/ui/Button'
import { ModalDialog } from '../../../shared/ui/Dialog'
import { Field, RequiredNote, TextInput } from '../../../shared/ui/Field'
import { useToast } from '../../../shared/ui/toastContext'
import styles from './CompanyDialog.module.css'
import {
  COMPANY_FIELDS,
  EMPTY_COMPANY,
  pickCompanyErrors,
  toCompanyRequest,
  toFormValues,
  type CompanyField,
  type CompanyFieldErrors,
} from './companyForm'

type Props = {
  /** null = neue Firma anlegen */
  company: CompanyResponse | null
  onClose: () => void
  /** Nach dem Speichern, z. B. um die neue Firma zu öffnen */
  onSaved?: (company: CompanyResponse) => void
}

/** Firma anlegen oder bearbeiten. */
export function CompanyDialog({ company, onClose, onSaved }: Props) {
  const toast = useToast()
  const save = useSaveCompany()
  const prefix = useId()
  const idOf = (field: CompanyField) => `${prefix}-${field}`
  const [values, setValues] = useState(() => (company ? toFormValues(company) : EMPTY_COMPANY))
  const [errors, setErrors] = useState<CompanyFieldErrors>({})
  const set = (key: CompanyField, value: string) => {
    setValues((v) => ({ ...v, [key]: value }))
    setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const showErrors = (next: CompanyFieldErrors) => {
    setErrors(next)
    const first = COMPANY_FIELDS.find((f) => next[f])
    if (first) document.getElementById(idOf(first))?.focus()
  }

  const submit = () => {
    const result = toCompanyRequest(values)
    if ('errors' in result) {
      showErrors(result.errors)
      return
    }
    save.mutate(
      { id: company?.id ?? null, body: result.body },
      {
        onSuccess: (saved) => {
          onClose()
          toast(company ? 'Firma gespeichert' : 'Firma angelegt')
          onSaved?.(saved)
        },
        onError: (err) => showErrors(pickCompanyErrors(serverFieldErrors(err, saveCompanyMeta))),
      },
    )
  }

  return (
    <ModalDialog
      title={company ? 'Firma bearbeiten' : 'Neue Firma'}
      subtitle={company?.name}
      size="medium"
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>Abbrechen</Button>
          <Button variant="primary" onClick={submit} disabled={save.isPending}>
            Speichern
          </Button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <RequiredNote />
        <Field label="Name" id={idOf('name')} error={errors.name} required>
          {(id) => (
            <TextInput
              id={id}
              autoFocus
              required
              maxLength={255}
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
            />
          )}
        </Field>
        <Field label="Webseite" id={idOf('website')} error={errors.website}>
          {(id) => (
            <TextInput
              id={id}
              placeholder="z. B. www.firmenname.de"
              maxLength={255}
              value={values.website}
              onChange={(e) => set('website', e.target.value)}
            />
          )}
        </Field>
        <div className={styles.address}>
          <Field
            label="Straße und Hausnummer"
            className={styles.street}
            id={idOf('street')}
            error={errors.street}
          >
            {(id) => (
              <TextInput
                id={id}
                placeholder="z. B. Musterstraße 12"
                maxLength={255}
                autoComplete="off"
                value={values.street}
                onChange={(e) => set('street', e.target.value)}
              />
            )}
          </Field>
          <Field label="PLZ" id={idOf('postalCode')} error={errors.postalCode}>
            {(id) => (
              <TextInput
                id={id}
                placeholder="z. B. 60311"
                maxLength={20}
                inputMode="numeric"
                autoComplete="off"
                value={values.postalCode}
                onChange={(e) => set('postalCode', e.target.value)}
              />
            )}
          </Field>
          <Field label="Stadt" id={idOf('city')} error={errors.city}>
            {(id) => (
              <TextInput
                id={id}
                placeholder="z. B. Frankfurt am Main"
                maxLength={255}
                autoComplete="off"
                value={values.city}
                onChange={(e) => set('city', e.target.value)}
              />
            )}
          </Field>
        </div>
        <button type="submit" hidden>
          Speichern
        </button>
      </form>
    </ModalDialog>
  )
}
