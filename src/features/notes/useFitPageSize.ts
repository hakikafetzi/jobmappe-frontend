import { useLayoutEffect, useRef, useState } from 'react'
import { LIST_PAGE_SIZE } from '../../app/paths'
import { useDebouncedCallback } from '../../shared/hooks/useDebouncedCallback'
import { fitPageSize, NOTE_GRID } from './noteGrid'

/** Nach dem Ziehen am Fenster erst neu laden, wenn die Größe kurz stillsteht */
const RESIZE_DELAY_MS = 150

/** Innenfläche eines Elements (ohne Innenabstand und Rollbalken) */
function innerSize(el: HTMLElement) {
  const style = getComputedStyle(el)
  const px = (v: string) => parseFloat(v) || 0
  return {
    width: el.clientWidth - px(style.paddingLeft) - px(style.paddingRight),
    height: el.clientHeight - px(style.paddingTop) - px(style.paddingBottom),
  }
}

/**
 * Seitengröße, die die Fläche des Elements mit Notizkarten gerade füllt (siehe `fitPageSize`).
 * Gemessen wird vor dem ersten Zeichnen, danach bei jeder Größenänderung (entprellt). Lässt sich
 * nichts messen (z. B. in Tests), gilt die Standardgröße der Listen. null nur bis zur ersten Messung.
 */
export function useFitPageSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState<number | null>(null)
  const measure = () => {
    const el = ref.current
    if (!el) return
    const { width, height } = innerSize(el)
    setSize(fitPageSize(width, height, NOTE_GRID) ?? LIST_PAGE_SIZE)
  }
  const remeasure = useDebouncedCallback(measure, RESIZE_DELAY_MS)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // Erste Messung sofort, danach entprellt
    remeasure.flush()
    const ro = new ResizeObserver(() => remeasure.run())
    ro.observe(el)
    return () => ro.disconnect()
  }, [remeasure])

  return [ref, size] as const
}
