import { Field, TextInput } from '../../../shared/ui/Field'
import styles from './NewCompanyFields.module.css'
import type { NewCompanyField, NewCompanyValues } from './newPostingForm'

type Props = {
  name: string
  values: NewCompanyValues
  onChange: (field: NewCompanyField, value: string) => void
  errors: Partial<Record<NewCompanyField, string>>
  /** id des Eingabefelds (zum Fokussieren bei Fehlern) */
  idOf: (field: NewCompanyField) => string
}

/** Optionale Angaben zur Firma, die zusammen mit der Stelle neu angelegt wird. */
export function NewCompanyFields({ name, values, onChange, errors, idOf }: Props) {
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Neue Firma „{name}“</legend>
      <Field label="Webseite" id={idOf('website')} error={errors.website}>
        {(id) => (
          <TextInput
            id={id}
            placeholder="z. B. www.firmenname.de"
            maxLength={255}
            value={values.website}
            onChange={(e) => onChange('website', e.target.value)}
          />
        )}
      </Field>
      <div className={styles.address}>
        <Field label="Straße und Hausnummer" id={idOf('street')} error={errors.street}>
          {(id) => (
            <TextInput
              id={id}
              placeholder="z. B. Musterstraße 12"
              maxLength={255}
              autoComplete="off"
              value={values.street}
              onChange={(e) => onChange('street', e.target.value)}
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
              onChange={(e) => onChange('postalCode', e.target.value)}
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
              onChange={(e) => onChange('city', e.target.value)}
            />
          )}
        </Field>
      </div>
    </fieldset>
  )
}
