import { useEffect, useId, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useClickOutside } from '../shared/hooks/useClickOutside'
import { GearIcon, UserIcon } from '../shared/ui/icons'
import { ThemeSwitch } from '../shared/ui/ThemeSwitch'
import { paths } from './paths'
import styles from './ProfileMenu.module.css'

/** Personen-Symbol rechts in der Kopfleiste mit Menü: Erscheinungsbild und Einstellungen. */
export function ProfileMenu() {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelId = useId()
  const themeLabelId = useId()

  useClickOutside(wrapRef, () => setOpen(false), open)

  // Escape schließt nur das Menü: in der Capture-Phase abfangen, bevor globale Kürzel
  // (z. B. Escape = zurück auf der Bewerbungsseite) es sehen — useHotkey ignoriert defaultPrevented.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [open])

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        aria-label="Profilmenü"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
      >
        <UserIcon className={styles.person} />
      </button>
      {open && (
        <div className={styles.panel} id={panelId}>
          <div className={styles.section}>
            <div className={styles.label} id={themeLabelId}>
              Erscheinungsbild
            </div>
            <ThemeSwitch size="menu" labelledBy={themeLabelId} />
          </div>

          <div className={styles.items}>
            <Link to={paths.settings()} className={styles.item} onClick={() => setOpen(false)}>
              <GearIcon className={styles.icon} />
              Einstellungen
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
