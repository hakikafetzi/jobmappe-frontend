import { useId, type InputHTMLAttributes, type ReactNode, type Ref, type SelectHTMLAttributes } from 'react'
import { cx } from '../lib/cx'
import styles from './Field.module.css'
import { InfoNote } from './InfoNote'

type FieldProps = {
  label: ReactNode
  hint?: ReactNode
  error?: ReactNode
  className?: string
  /** Eigene id (z. B. um das Feld später zu fokussieren); sonst generiert. */
  id?: string
  /**
   * Mehrere Steuerelemente (z. B. eine Liste von Eingabefeldern): Die Beschriftung benennt dann
   * die Gruppe statt eines einzelnen Felds; die Felder brauchen eigene Namen (aria-label).
   */
  group?: boolean
  /**
   * Pflichtfeld: Neben dem Label steht ein Stern. Screenreader erfahren es über `required` bzw.
   * `aria-required` am Steuerelement, das der Aufrufer setzt.
   */
  required?: boolean
  /** Bekommt die id für das (erste) Steuerelement. */
  children: (id: string) => ReactNode
}

/** Beschriftetes Formularfeld; verknüpft Label und Steuerelement über die id. */
export function Field({ label, hint, error, className, id: ownId, group, required, children }: FieldProps) {
  const generatedId = useId()
  const id = ownId ?? generatedId
  const labelId = `${id}-label`
  const labelElement = group ? (
    <span className={styles.label} id={labelId}>
      {label}
    </span>
  ) : (
    <label className={styles.label} htmlFor={id}>
      {label}
    </label>
  )
  return (
    <div
      className={cx(styles.field, className)}
      role={group ? 'group' : undefined}
      aria-labelledby={group ? labelId : undefined}
    >
      {required ? (
        // Stern neben statt im Label: Der zugängliche Name bleibt „Titel“, nicht „Titel *“
        <div className={styles.labelRow}>
          {labelElement}
          <span className={styles.required} aria-hidden="true">
            *
          </span>
        </div>
      ) : (
        labelElement
      )}
      {children(id)}
      {hint && <InfoNote className={styles.hint}>{hint}</InfoNote>}
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
    </div>
  )
}

/**
 * Hinweis über Formularen mit Pflichtfeldern: erklärt den Stern an den Labels. Für Screenreader
 * versteckt, die erfahren es am Feld selbst.
 */
export function RequiredNote() {
  return (
    <p className={styles.requiredNote} aria-hidden="true">
      <span className={styles.required}>*</span> Pflichtfeld
    </p>
  )
}

export function TextInput({
  className,
  compact,
  ref,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement>; compact?: boolean }) {
  return (
    <input
      ref={ref}
      type="text"
      className={cx(styles.control, compact && styles.compact, className)}
      {...rest}
    />
  )
}

export function Select({
  className,
  compact,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { compact?: boolean }) {
  return <select className={cx(styles.control, compact && styles.compact, className)} {...rest} />
}
