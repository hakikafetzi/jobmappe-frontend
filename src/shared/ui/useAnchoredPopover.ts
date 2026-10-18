import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'

/** Native Popover (oberste Ebene, auch über Dialogen); ohne (z. B. jsdom) steuert React das Öffnen. */
const nativePopover = typeof HTMLElement !== 'undefined' && 'popover' in HTMLElement.prototype

/**
 * Popover an einem Feld (Datums- und Monatsfeld): öffnet über den Knopf, schließt bei Klick daneben
 * und mit Escape, liegt unter dem Feld (oder darüber, wenn unten kein Platz ist), rechtsbündig, und
 * wandert beim Scrollen mit. Die Lage kommt als --x/--y ins Popover.
 */
export function useAnchoredPopover() {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const id = useId()

  // Öffnen/Schließen über den Knopf (popovertarget), Klick daneben oder Escape
  useEffect(() => {
    const el = popRef.current
    if (!el || !nativePopover) return
    const onToggle = (e: Event) => setOpen((e as ToggleEvent).newState === 'open')
    el.addEventListener('toggle', onToggle)
    return () => el.removeEventListener('toggle', onToggle)
  }, [])

  useLayoutEffect(() => {
    const pop = popRef.current
    const anchor = anchorRef.current
    if (!open || !pop || !anchor) return
    const place = () => {
      const r = anchor.getBoundingClientRect()
      const gap = 6
      const below = r.bottom + gap
      const top =
        below + pop.offsetHeight > window.innerHeight - 8 && r.top - pop.offsetHeight - gap > 8
          ? r.top - pop.offsetHeight - gap
          : below
      // Rechtsbündig mit dem Feld (dort sitzt der Knopf), ohne aus dem Fenster zu ragen
      const left = Math.max(8, Math.min(r.right - pop.offsetWidth, window.innerWidth - pop.offsetWidth - 8))
      pop.style.setProperty('--x', `${left}px`)
      pop.style.setProperty('--y', `${top}px`)
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  const close = (focus?: HTMLElement | null) => {
    if (nativePopover) popRef.current?.hidePopover()
    setOpen(false)
    focus?.focus()
  }

  return {
    open,
    anchorRef,
    buttonRef,
    popoverRef: popRef,
    /** Schließen; der Fokus geht an `focus` (z. B. das Feld nach einer Auswahl, den Knopf bei Escape) */
    close,
    /** Den Fokus nach Escape zurück an den Knopf */
    closeToButton: () => close(buttonRef.current),
    /** Zusammen mit `ref={buttonRef}` auf den Knopf */
    buttonProps: {
      'aria-haspopup': 'dialog',
      'aria-expanded': open,
      'aria-controls': id,
      popoverTarget: nativePopover ? id : undefined,
      onClick: nativePopover ? undefined : () => setOpen((o) => !o),
    } as const,
    /** Zusammen mit `ref={popoverRef}` auf das Popover */
    popoverProps: {
      id,
      popover: nativePopover ? 'auto' : undefined,
    } as const,
  }
}
