import { useRef, useState } from 'react'
import { formatGermanDate, maskDateInput, parseGermanDate } from '../lib/germanDate'
import { Calendar } from './Calendar'
import styles from './DateField.module.css'
import { TextInput } from './Field'
import { CalendarIcon } from './icons'
import { useAnchoredPopover } from './useAnchoredPopover'

type Props = {
  id?: string
  /** ISO-Datum (JJJJ-MM-TT) oder leer */
  value: string
  /** Bekommt ein gültiges ISO-Datum oder '' (geleert) */
  onChange: (value: string) => void
  min?: string
  max?: string
  compact?: boolean
  disabled?: boolean
  /** Pflichtfeld: der Kalender bietet kein „Löschen“ an */
  required?: boolean
}

/**
 * Datumsfeld im deutschen Format (TT.MM.JJJJ) mit Kalender. Getippt wird frei (Punkte setzt das Feld
 * selbst); weitergegeben wird nur ein gültiges Datum. Beim Verlassen springt eine ungültige Eingabe
 * auf den letzten gültigen Wert zurück.
 */
export function DateInput({ id, value, onChange, min, max, compact, disabled, required }: Props) {
  const [text, setText] = useState(() => formatGermanDate(value))
  /** Wert, zu dem `text` gehört; ändert er sich von außen, zeigt das Feld ihn neu an */
  const [shown, setShown] = useState(value)
  if (value !== shown) {
    setShown(value)
    setText(formatGermanDate(value))
  }
  const inputRef = useRef<HTMLInputElement>(null)
  const { open, anchorRef, buttonRef, popoverRef, buttonProps, popoverProps, close, closeToButton } =
    useAnchoredPopover()

  const emit = (iso: string) => {
    setShown(iso)
    if (iso !== value) onChange(iso)
  }

  const type = (next: string) => {
    const masked = maskDateInput(text, next)
    setText(masked)
    const iso = masked ? parseGermanDate(masked) : ''
    if (iso !== null) emit(iso)
  }

  const pick = (iso: string) => {
    emit(iso)
    setText(formatGermanDate(iso))
    close(inputRef.current)
  }

  return (
    <div ref={anchorRef} className={styles.wrap}>
      <TextInput
        ref={inputRef}
        id={id}
        className={styles.input}
        compact={compact}
        inputMode="numeric"
        autoComplete="off"
        placeholder="TT.MM.JJJJ"
        disabled={disabled}
        required={required}
        value={text}
        onChange={(e) => type(e.target.value)}
        onBlur={() => setText(formatGermanDate(value))}
      />
      <button
        type="button"
        className={styles.toggle}
        aria-label="Kalender öffnen"
        disabled={disabled}
        ref={buttonRef}
        {...buttonProps}
      >
        <CalendarIcon />
      </button>
      <div
        className={styles.popover}
        role="dialog"
        aria-label="Datum wählen"
        ref={popoverRef}
        {...popoverProps}
      >
        {open && (
          <Calendar
            value={value}
            min={min}
            max={max}
            onPick={pick}
            onClear={required || !value ? undefined : () => pick('')}
            onEscape={closeToButton}
          />
        )}
      </div>
    </div>
  )
}
