import type { ApplicationChannel } from '../../../api/types'
import { APP_CHANNEL } from '../../../domain/labels'
import { Field, TextInput } from '../../../shared/ui/Field'
import { ChoiceGrid } from './ChoiceGrid'
import styles from './ViaFields.module.css'

export type ViaInput = { way: ApplicationChannel | null; url: string }

const CHANNELS = (Object.keys(APP_CHANNEL) as ApplicationChannel[]).map((value) => ({
  value,
  label: APP_CHANNEL[value],
}))

type Props = {
  value: ViaInput
  onChange: (value: ViaInput) => void
}

/** Felder für den Bewerbungsweg (Weg als Auswahl + Link zum Portal). */
export function ViaFields({ value, onChange }: Props) {
  return (
    <>
      <div className={styles.way}>
        <ChoiceGrid
          label="Weg"
          value={value.way}
          onChange={(way) => onChange({ ...value, way })}
          options={CHANNELS}
        />
      </div>
      <Field label="Link zum Bewerbungsportal">
        {(id) => (
          <TextInput
            id={id}
            type="url"
            placeholder="https://…"
            maxLength={1000}
            value={value.url}
            onChange={(e) => onChange({ ...value, url: e.target.value })}
          />
        )}
      </Field>
    </>
  )
}
