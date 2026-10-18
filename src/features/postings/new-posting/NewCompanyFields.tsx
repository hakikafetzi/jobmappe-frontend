import { Field, TextInput } from '../../../shared/ui/Field'
import styles from './NewCompanyFields.module.css'
import type { NewCompanyField, NewCompanyValues } from './newPostingForm'

type Props = {
  name: string
  values: NewCompanyValues
  onChange: (values: NewCompanyValues) => void
  errors: Partial<Record<NewCompanyField, string>>
  /** id des Eingabefelds (zum Fokussieren bei Fehlern) */
  idOf: (field: NewCompanyField) => string
}

/** Optionale Angaben zur Firma, die zusammen mit der Stelle neu angelegt wird. */
export function NewCompanyFields({ name, values, onChange, errors, idOf }: Props) {
  const set = (key: NewCompanyField, value: string) => onChange({ ...values, [key]: value })
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Neue Firma „{name}“</legend>
      <Field label="Webseite" id={idOf('website')} error={errors.website}>
        {(id) => (
          <TextInput
            id={id}
            placeholder="beispiel.de"
            maxLength={255}
            value={values.website}
            onChange={(e) => set('website', e.target.value)}
          />
        )}
      </Field>
      <div className={styles.address}>
        <Field label="Straße und Hausnummer" id={idOf('street')} error={errors.street}>
          {(id) => (
            <TextInput
              id={id}
              placeholder="Musterstraße 12"
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
              placeholder="60311"
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
              placeholder="Frankfurt am Main"
              maxLength={255}
              autoComplete="off"
              value={values.city}
              onChange={(e) => set('city', e.target.value)}
            />
          )}
        </Field>
      </div>
    </fieldset>
  )
}
