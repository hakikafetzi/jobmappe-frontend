import { clampSidebarWidth, DEFAULT_NOTE_DIALOG_PREFS, MIN_SIDEBAR_WIDTH } from './noteDialogPrefs'
import styles from './SidebarResizeHandle.module.css'

const KEY_STEP = 20

/**
 * Trenner zwischen Notizliste und Notiz im Vollbild (Griff wie an der Assistent-Leiste im Editor):
 * Ziehen oder Pfeiltasten ändern die Breite, Doppelklick stellt die Standardbreite wieder her.
 */
export function SidebarResizeHandle({
  width,
  onResize,
}: {
  width: number
  onResize: (width: number) => void
}) {
  const resize = (next: number) => onResize(clampSidebarWidth(next, window.innerWidth))

  const startDrag = (e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return
    e.preventDefault()
    const handle = e.currentTarget
    handle.setPointerCapture(e.pointerId)
    const start = { x: e.clientX, width }
    const move = (ev: PointerEvent) => resize(start.width + ev.clientX - start.x)
    const end = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', end)
      handle.removeEventListener('pointercancel', end)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', end)
    handle.addEventListener('pointercancel', end)
  }

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- fokussierbarer Trenner nach WAI-ARIA (Breite per Pfeiltasten)
    <span
      className={styles.handle}
      role="separator"
      tabIndex={0}
      aria-label="Breite der Notizliste (Pfeiltasten, Doppelklick: Standard)"
      aria-orientation="vertical"
      aria-valuenow={width}
      aria-valuemin={MIN_SIDEBAR_WIDTH}
      aria-valuemax={clampSidebarWidth(Infinity, window.innerWidth)}
      onPointerDown={startDrag}
      onDoubleClick={() => resize(DEFAULT_NOTE_DIALOG_PREFS.sidebarWidth)}
      onKeyDown={(e) => {
        const delta = { ArrowLeft: -KEY_STEP, ArrowRight: KEY_STEP }[e.key]
        if (delta === undefined) return
        e.preventDefault()
        resize(width + delta)
      }}
    />
  )
}
