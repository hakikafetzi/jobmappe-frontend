import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
} from 'react'
import { cx } from '../lib/cx'
import { useLatest } from '../hooks/useLatest'
import styles from './Dialog.module.css'
import {
  clampPosition,
  clampSize,
  MIN_DIALOG_SIZE,
  viewportSize,
  type DialogPosition,
  type DialogSize,
} from './dialogSize'

type Size = 'default' | 'small' | 'narrow' | 'medium' | 'form' | 'wide' | 'document' | 'palette'

type DialogProps = {
  onClose: () => void
  children: ReactNode
  size?: Size
  /** id des Titels; wird von <DialogHeader> automatisch gesetzt. */
  'aria-labelledby'?: string
  'aria-label'?: string
  /** Füllt das ganze Fenster */
  fullscreen?: boolean
  /** Größe per Ziehen an Rand und Ecke (nicht mobil und nicht im Vollbild); die Größe hält der Aufrufer. */
  resizable?: DialogSize & { onResize: (size: DialogSize) => void }
  /**
   * Schwebendes Fenster statt Modal (show() statt showModal()): kein abgedunkelter Hintergrund, die
   * Seite dahinter bleibt bedienbar. Escape und ✕ schließen, ein Klick daneben nicht.
   */
  modeless?: boolean
  /** Verschieben über einen <DialogDragHandle>; `position` null = mittig. Die Lage hält der Aufrufer. */
  movable?: { position: DialogPosition | null; onMove: (position: DialogPosition) => void }
  /** Reihenfolge mehrerer schwebender Dialoge (höher = vorn) */
  stackIndex?: number
  /** Klick oder Fokus im Dialog (z. B. um ihn nach vorn zu holen) */
  onActivate?: () => void
}

/** Startet das Verschieben (von <DialogDragHandle> aus); null, wenn der Dialog nicht verschiebbar ist. */
const DragContext = createContext<((e: React.PointerEvent<HTMLElement>) => void) | null>(null)

/** Bereich (z. B. die Kopfleiste), an dem sich ein verschiebbarer Dialog ziehen lässt. */
export function DialogDragHandle({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  const startMove = useContext(DragContext)
  return (
    <div
      className={cx(className, startMove && styles.dragHandle)}
      onPointerDown={startMove ?? undefined}
      {...rest}
    />
  )
}

/**
 * Modaler Dialog auf Basis von <dialog>.showModal(): Fokus-Falle, Escape und oberste Ebene
 * liefert der Browser. Schließt bei Escape und bei Klick auf den abgedunkelten Hintergrund.
 * Mit `modeless` ein schwebendes Fenster über der Seite (siehe dort).
 * Wird bedingt gerendert (`{open && <Dialog …/>}`), damit der Inhalt bei jedem Öffnen frisch ist.
 */
export function Dialog({
  onClose,
  children,
  size = 'default',
  fullscreen,
  resizable,
  modeless,
  movable,
  stackIndex,
  onActivate,
  ...aria
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const onCloseRef = useLatest(onClose)

  // Wechsel modal ↔ schwebend (z. B. über die Mobil-Grenze): schließen und neu öffnen
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (!el.open) {
      if (modeless) el.show()
      else el.showModal()
      // Öffnen fokussiert das erste Bedienelement. Ein Feld mit data-autofocus (z. B. der Editor)
      // geht vor: Sein eigenes focus() beim Mounten greift nicht, solange der Dialog noch zu ist.
      el.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    }
    const onCancel = (e: Event) => {
      e.preventDefault() // Zustand bleibt in React
      onCloseRef.current()
    }
    // Schwebende Dialoge bekommen kein cancel-Event: Escape selbst behandeln, aber nur für diesen
    // Dialog (nicht für einen darin geöffneten Bestätigungsdialog oder ein Popover)
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || e.defaultPrevented) return
      if (!(e.target instanceof Element) || e.target.closest('dialog, [popover]') !== el) return
      e.preventDefault()
      onCloseRef.current()
    }
    el.addEventListener('cancel', onCancel)
    if (modeless) el.addEventListener('keydown', onKeyDown)
    return () => {
      el.removeEventListener('cancel', onCancel)
      el.removeEventListener('keydown', onKeyDown)
      if (el.open) el.close()
    }
  }, [onCloseRef, modeless])

  const position = movable && !fullscreen ? movable.position : null
  const startMove = (e: React.PointerEvent<HTMLElement>) => {
    const dialog = ref.current
    if (!dialog || !movable || fullscreen || e.button !== 0) return
    // Bedienelemente in der Leiste behalten ihren Klick
    if (
      e.target instanceof Element &&
      e.target.closest('button, select, input, textarea, a, label, [contenteditable]')
    )
      return
    e.preventDefault()
    const handle = e.currentTarget
    handle.setPointerCapture(e.pointerId)
    const rect = dialog.getBoundingClientRect()
    const start = { x: e.clientX, y: e.clientY }
    const current = { width: rect.width, height: rect.height }
    const move = (ev: PointerEvent) =>
      movable.onMove(
        clampPosition(
          { x: rect.left + ev.clientX - start.x, y: rect.top + ev.clientY - start.y },
          current,
          viewportSize(),
        ),
      )
    const end = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', end)
      handle.removeEventListener('pointercancel', end)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', end)
    handle.addEventListener('pointercancel', end)
  }

  // Stabiler Kontextwert, der immer die aktuelle Fassung aufruft
  const startMoveRef = useLatest(startMove)
  const dragStart = useCallback(
    (e: React.PointerEvent<HTMLElement>) => startMoveRef.current(e),
    [startMoveRef],
  )

  const vars: Record<string, string> = {}
  if (resizable) {
    vars['--dialog-w'] = `${resizable.width}px`
    vars['--dialog-h'] = `${resizable.height}px`
  }
  if (stackIndex !== undefined) vars['--dialog-z'] = String(stackIndex)
  if (position) {
    vars['--dialog-x'] = `${position.x}px`
    vars['--dialog-y'] = `${position.y}px`
  }

  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Klick auf den Hintergrund schließt; per Tastatur schließt Escape
    <dialog
      ref={ref}
      className={cx(
        styles.dialog,
        size !== 'default' && styles[size],
        resizable && styles.resizable,
        modeless && styles.modeless,
        position && styles.positioned,
        fullscreen && styles.fullscreen,
      )}
      style={Object.keys(vars).length ? (vars as CSSProperties) : undefined}
      data-modeless={modeless || undefined}
      {...aria}
      onPointerDownCapture={onActivate}
      onFocusCapture={onActivate}
      onMouseDown={(e) => {
        // Klick auf den Hintergrund: Ziel ist das <dialog> selbst, aber außerhalb seines Rahmens
        if (e.target !== e.currentTarget) return
        const r = e.currentTarget.getBoundingClientRect()
        const outside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
        if (outside) onClose()
      }}
    >
      <DragContext value={movable && !fullscreen ? dragStart : null}>{children}</DragContext>
      {resizable && !fullscreen && <ResizeHandles dialogRef={ref} centered={!position} {...resizable} />}
    </dialog>
  )
}

type Axis = 'x' | 'y' | 'xy'

const KEY_STEP = 20

/** Griffe am rechten und unteren Rand und an der Ecke; die Ecke ist auch per Pfeiltasten bedienbar. */
function ResizeHandles({
  dialogRef,
  width,
  height,
  onResize,
  centered,
}: DialogSize & {
  dialogRef: RefObject<HTMLDialogElement | null>
  onResize: (size: DialogSize) => void
  /** Mittig: Breitenänderung wirkt auf beide Seiten; verschoben: nur der rechte Rand wandert */
  centered: boolean
}) {
  const factor = centered ? 2 : 1
  const startDrag = (axis: Axis) => (e: React.PointerEvent<HTMLElement>) => {
    const dialog = dialogRef.current
    if (!dialog || e.button !== 0) return
    e.preventDefault()
    const handle = e.currentTarget
    handle.setPointerCapture(e.pointerId)
    const rect = dialog.getBoundingClientRect()
    const start = { x: e.clientX, y: e.clientY, width: rect.width, height: rect.height }
    const move = (ev: PointerEvent) =>
      onResize(
        clampSize(
          {
            // Mittig wandern beide Ränder: Der gezogene folgt dem Zeiger bei doppelter Breitenänderung
            width: axis === 'y' ? start.width : start.width + factor * (ev.clientX - start.x),
            height: axis === 'x' ? start.height : start.height + (ev.clientY - start.y),
          },
          viewportSize(),
        ),
      )
    const end = () => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', end)
      handle.removeEventListener('pointercancel', end)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', end)
    handle.addEventListener('pointercancel', end)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    const delta = {
      ArrowLeft: [-factor * KEY_STEP, 0],
      ArrowRight: [factor * KEY_STEP, 0],
      ArrowUp: [0, -KEY_STEP],
      ArrowDown: [0, KEY_STEP],
    }[e.key]
    if (!delta) return
    e.preventDefault()
    onResize(clampSize({ width: width + (delta[0] ?? 0), height: height + (delta[1] ?? 0) }, viewportSize()))
  }

  const max = viewportSize()
  return (
    <>
      <span className={cx(styles.handle, styles.handleX)} aria-hidden="true" onPointerDown={startDrag('x')} />
      <span className={cx(styles.handle, styles.handleY)} aria-hidden="true" onPointerDown={startDrag('y')} />
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- fokussierbarer Trenner nach WAI-ARIA (Größe per Pfeiltasten) */}
      <span
        className={cx(styles.handle, styles.handleCorner)}
        role="separator"
        tabIndex={0}
        aria-label="Größe ändern (Pfeiltasten)"
        aria-orientation="vertical"
        aria-valuenow={width}
        aria-valuemin={MIN_DIALOG_SIZE.width}
        aria-valuemax={Math.max(MIN_DIALOG_SIZE.width, max.width)}
        aria-valuetext={`${width} × ${height} Pixel`}
        onPointerDown={startDrag('xy')}
        onKeyDown={onKeyDown}
      />
    </>
  )
}

function DialogHeader({
  title,
  subtitle,
  titleId,
  onClose,
}: {
  title: ReactNode
  subtitle?: ReactNode
  titleId: string
  onClose: () => void
}) {
  return (
    <div className={styles.header}>
      <div className={styles.headText}>
        <h2 id={titleId} className={styles.title}>
          {title}
        </h2>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      </div>
      <DialogCloseButton onClose={onClose} />
    </div>
  )
}

export function DialogCloseButton({ onClose, className }: { onClose: () => void; className?: string }) {
  return (
    <button type="button" className={cx(styles.close, className)} onClick={onClose} aria-label="Schließen">
      ✕
    </button>
  )
}

function DialogBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx(styles.body, className)}>{children}</div>
}

function DialogFooter({ children, start }: { children: ReactNode; start?: ReactNode }) {
  return (
    <div className={styles.footer}>
      {start && <div className={styles.footerStart}>{start}</div>}
      {children}
    </div>
  )
}

/** Standard-Dialog: Kopf mit Titel, Inhalt, Fußzeile. */
export function ModalDialog({
  title,
  subtitle,
  onClose,
  children,
  footer,
  footerStart,
  size,
  bodyClassName,
}: {
  title: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  children: ReactNode
  footer: ReactNode
  footerStart?: ReactNode
  size?: Size
  bodyClassName?: string
}) {
  const titleId = useId()
  return (
    <Dialog onClose={onClose} size={size} aria-labelledby={titleId}>
      <DialogHeader title={title} subtitle={subtitle} titleId={titleId} onClose={onClose} />
      <DialogBody className={bodyClassName}>{children}</DialogBody>
      <DialogFooter start={footerStart}>{footer}</DialogFooter>
    </Dialog>
  )
}
