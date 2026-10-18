import { useId, useState } from 'react'
import type { ApplicationsView, NotesView } from '../../app/paths'
import { DISPLAY_NAME_MAX_LENGTH, useDisplayName } from '../../shared/settings/displayName'
import { isPersonName } from '../../shared/lib/validation'
import { useDefaultApplicationsView, useDefaultNotesView } from '../../shared/settings/viewPreferences'
import { useMotionPreference, type MotionPreference } from '../../shared/theme/motionPreference'
import { TextInput } from '../../shared/ui/Field'
import { SlideSwitch } from '../../shared/ui/SlideSwitch'
import { ThemeSwitch } from '../../shared/ui/ThemeSwitch'
import { SettingRow } from './SettingRow'
import styles from './SettingsPanel.module.css'
import { SettingsSection } from './SettingsSection'

const MOTION_OPTIONS: { value: MotionPreference; label: string }[] = [
  { value: 'on', label: 'An' },
  { value: 'off', label: 'Aus' },
]

const APPLICATIONS_VIEW_OPTIONS: { value: ApplicationsView; label: string }[] = [
  { value: 'board', label: 'Kanban' },
  { value: 'table', label: 'Tabelle' },
]

const NOTES_VIEW_OPTIONS: { value: NotesView; label: string }[] = [
  { value: 'gallery', label: 'Galerie' },
  { value: 'table', label: 'Tabelle' },
]

/** Name, Erscheinungsbild, Animationen und Standardansichten: gelten nur für diesen Browser (localStorage). */
export function SettingsPanel() {
  const [name, setName] = useDisplayName()
  // Getippter Text; gespeichert wird nur ein gültiger (oder leerer) Name
  const [nameInput, setNameInput] = useState<string | null>(null)
  const shownName = nameInput ?? name
  const nameErrorId = useId()
  const nameInvalid = shownName.trim() !== '' && !isPersonName(shownName)
  const [motion, setMotion] = useMotionPreference()
  const [applicationsView, setApplicationsView] = useDefaultApplicationsView()
  const [notesView, setNotesView] = useDefaultNotesView()
  return (
    <SettingsSection title="Allgemein">
      <SettingRow
        label="Dein Name"
        description="Für die Begrüßung auf der Startseite. Gilt für diesen Browser."
      >
        <div className={styles.nameField}>
          <TextInput
            className={styles.name}
            aria-label="Dein Name"
            aria-invalid={nameInvalid}
            aria-describedby={nameInvalid ? nameErrorId : undefined}
            placeholder="z. B. Anna"
            autoComplete="given-name"
            maxLength={DISPLAY_NAME_MAX_LENGTH}
            value={shownName}
            onChange={(e) => {
              const next = e.target.value
              setNameInput(next)
              if (!next.trim() || isPersonName(next)) setName(next)
            }}
          />
          {nameInvalid && (
            <div id={nameErrorId} className={styles.nameError} role="alert">
              Bitte nur Buchstaben verwenden.
            </div>
          )}
        </div>
      </SettingRow>
      <SettingRow label="Erscheinungsbild" description="Gilt für diesen Browser.">
        <ThemeSwitch size="settings" label="Erscheinungsbild" />
      </SettingRow>
      <SettingRow label="Animationen" description="Übergänge und Bewegungen.">
        <SlideSwitch
          size="settings"
          label="Animationen"
          value={motion}
          onSelect={setMotion}
          options={MOTION_OPTIONS}
        />
      </SettingRow>
      <SettingRow label="Ansicht der Bewerbungen" description="So öffnet sich die Seite Bewerbungen.">
        <SlideSwitch
          size="settings"
          label="Ansicht der Bewerbungen"
          value={applicationsView}
          onSelect={setApplicationsView}
          options={APPLICATIONS_VIEW_OPTIONS}
        />
      </SettingRow>
      <SettingRow label="Ansicht der Notizen" description="So öffnet sich die Seite Notizen.">
        <SlideSwitch
          size="settings"
          label="Ansicht der Notizen"
          value={notesView}
          onSelect={setNotesView}
          options={NOTES_VIEW_OPTIONS}
        />
      </SettingRow>
    </SettingsSection>
  )
}
