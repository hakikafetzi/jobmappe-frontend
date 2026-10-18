// Animierter Wechsel Board ↔ Tabelle (View Transitions + Web Animations, CSS in
// ApplicationsPage.module.css). Board → Tabelle: Zuerst rutschen die Karten jeder Spalte zu einem
// Stapel ineinander, eingeklappte Spalten klappen auf und alle Spalten werden gleich groß. Dann schieben sich die Spalten in der Mitte
// zu einem Stapel zusammen, der Stapel schrumpft zu einer leeren weißen Karte, die Karte wächst auf die
// Größe der Tabelle, dann erscheint die Tabelle darin. Tabelle → Board läuft dieselbe
// Choreografie rückwärts. Ohne View-Transitions-Unterstützung, bei „Bewegung reduzieren“ oder
// abgeschalteten Animationen wechselt die Ansicht sofort.
import type { CSSProperties } from 'react'
import type { ApplicationsView } from '../../app/paths'
import { prefersReducedMotion } from '../../shared/lib/motion'

export type Box = { x: number; y: number; width: number; height: number }

/** Karten einer Spalte, von oben nach unten; `name` ist ihr View-Transition-Name */
export type ColumnCard = { name: string; box: Box }

/** Ein animierter Teil: Keyframes für die Gruppe (Rahmen) und das Bild (Inhalt). */
type Part = { name: string; board: boolean; group: Keyframe[]; image: Keyframe[] }

/** Aussehen von Spalte und Karte, aus den Tokens gelesen (hell/dunkel) */
type CardLook = { column: string; surface: string; shadow: string }

// Die gemessenen Bausteine tragen data-vt-part="column|dropzone|sheet", die Inhaltsfläche
// data-vt-stage. Die Board-Karten tragen data-vt-card und bekommen ihren Namen nur während des
// Wechsels (BOARD_SWITCHING_ATTR), sonst wären sie bei jeder anderen View Transition eigene Ebenen.

/** Steht während des Wechsels am <html>; nur dann tragen die Board-Karten ihren Namen. */
const BOARD_SWITCHING_ATTR = 'data-board-switching'

const DURATION = 2000
/** Symmetrisch, damit die Rückrichtung genau gespiegelt aussieht */
const EASING = 'cubic-bezier(0.65, 0, 0.35, 1)'

// Phasen als Anteil der Gesamtdauer (Richtung Board → Tabelle)
/** Karten jeder Spalte liegen ineinander, alle Spalten sind gleich hoch */
const SETTLED = 0.2
/** Spalten liegen übereinander */
const STACKED = 0.42
/** Ab hier verblasst der Spalteninhalt, die Karte wird weiß */
const WHITENING = 0.49
/** Leere weiße Karte in der Mitte; ab hier wächst sie */
const CARD = 0.6
/** Karte hat die Größe der Tabelle; jetzt blendet die Tabelle ein */
const GROWN = 0.88

const SHEET_NAME = 'jm-sheet'
const DROPZONE_NAME = 'jm-board-drop'
const columnName = (index: number) => `jm-board-col-${index}`

export const boardColumnStyle = (index: number) => ({ '--vt-name': columnName(index) }) as CSSProperties
export const boardDropzoneStyle = { '--vt-name': DROPZONE_NAME } as CSSProperties
export const boardCardStyle = (column: number, index: number) =>
  ({ '--vt-name': `jm-board-card-${column}-${index}` }) as CSSProperties

/** Die Karte zwischen beiden Ansichten: mittig in der sichtbaren Fläche */
export function cardBox(stage: Box): Box {
  const width = Math.min(240, stage.width - 32)
  const height = Math.round(width * 0.62)
  return {
    x: stage.x + (stage.width - width) / 2,
    y: stage.y + (stage.height - height) / 2,
    width,
    height,
  }
}

const frame = (box: Box, shadow: string): Keyframe => ({
  transform: `translate(${box.x}px, ${box.y}px)`,
  width: `${box.width}px`,
  height: `${box.height}px`,
  boxShadow: shadow,
  easing: EASING,
})

const move = (box: Box, x: number, y: number): Keyframe => ({
  transform: `translate(${box.x + x}px, ${box.y + y}px)`,
  easing: EASING,
})

/**
 * Höhe der Spalte, wenn ihre Karten ineinander liegen: oben und unten der Abstand wie bisher,
 * dazwischen die höchste Karte. Leere und eingeklappte Spalten behalten ihre Höhe.
 */
function pileHeight(column: Box, cards: ColumnCard[]) {
  const first = cards[0]
  const last = cards.at(-1)
  if (!first || !last) return column.height
  const top = first.box.y - column.y
  const bottom = column.y + column.height - (last.box.y + last.box.height)
  return top + Math.max(...cards.map((c) => c.box.height)) + bottom
}

const fade = (from: number, to: number, start: number, end: number): Keyframe[] => [
  { offset: 0, opacity: from },
  { offset: start, opacity: from },
  { offset: end, opacity: to },
  { offset: 1, opacity: to },
]

/** Keyframes für Board → Tabelle; für die Rückrichtung dreht `reverseKeyframes` sie um. */
export function boardToTableParts({
  columns,
  cards = [],
  contentLeft = -Infinity,
  dropzone,
  sheet,
  stage,
  look,
}: {
  columns: Box[]
  /** Sichtbare Karten je Spalte (gleiche Reihenfolge wie `columns`) */
  cards?: ColumnCard[][]
  /** Linke Inhaltskante der Fläche: Weiter links beginnt das Board nie */
  contentLeft?: number
  dropzone?: Box
  sheet: Box
  stage: Box
  look: CardLook
}): Part[] {
  const card = cardBox(stage)
  const centerX = stage.x + stage.width / 2
  const top = Math.max(stage.y, Math.min(...columns.map((c) => c.y)))
  const maxHeight = Math.max(card.height, stage.y + stage.height - top)
  // Übergabe von den Spalten an die gleich aussehende Tabellen-Karte
  const handoff = CARD + 0.01
  // Erst werden alle Spalten so hoch wie die höchste mit ineinander liegenden Karten. Die Gruppe
  // trägt die Spaltenfarbe, damit eine wachsende Spalte unter ihrem Bild nicht durchsichtig ist.
  const height = Math.max(...columns.map((c, i) => pileHeight(c, cards[i] ?? [])))
  // Eingeklappte Spalten klappen dabei auf; damit sie die Nachbarn nicht überdecken, rücken alle
  // Spalten um die bisherige Mitte des Boards auseinander. Wie im CSS (margin: auto) beginnt ein
  // zu breites Board an der Inhaltskante. Sind alle eingeklappt, gibt die Ablage die Breite vor.
  const width = Math.max(...columns.map((c) => c.width), dropzone?.width ?? 0)
  const firstColumn = columns[0]
  const lastColumn = columns.at(-1)
  const gap = columns[1] && firstColumn ? columns[1].x - firstColumn.x - firstColumn.width : 0
  const oldLeft = firstColumn?.x ?? 0
  const oldRight = lastColumn ? lastColumn.x + lastColumn.width : 0
  const left = Math.max(contentLeft, (oldLeft + oldRight) / 2 - (columns.length * (width + gap) - gap) / 2)
  const settledX = (i: number) => left + i * (width + gap)

  const parts: Part[] = []
  columns.forEach((from, i) => {
    const settled: Box = { x: settledX(i), y: from.y, width, height }
    // Die hinteren Spalten schauen oben ein Stück heraus, die letzte liegt obenauf
    const stacked: Box = {
      x: centerX - width / 2,
      y: top + i * 5,
      width,
      height: Math.min(height, maxHeight),
    }
    // Der senkrechte Titel einer eingeklappten Spalte passt nicht zur aufgeklappten: er blendet aus
    const expands = from.width < width
    parts.push({
      name: columnName(i),
      board: true,
      group: [
        { offset: 0, ...frame(from, 'none'), backgroundColor: look.column, opacity: 1 },
        { offset: SETTLED, ...frame(settled, 'none') },
        { offset: STACKED, ...frame(stacked, look.shadow) },
        { offset: WHITENING, backgroundColor: look.column, easing: EASING },
        { offset: CARD, ...frame(card, look.shadow), backgroundColor: look.surface, opacity: 1 },
        { offset: handoff, opacity: 0 },
        { offset: 1, ...frame(card, look.shadow), backgroundColor: look.surface, opacity: 0 },
      ],
      image: expands ? fade(1, 0, 0, SETTLED / 2) : fade(1, 0, WHITENING, CARD),
    })

    // Die Karten sind eigene Ebenen über ihrer Spalte: Sie rutschen auf den Platz der ersten Karte
    // (die letzte liegt obenauf), fahren dann mit der Spalte und verblassen mit ihrem Inhalt
    const first = cards[i]?.[0]
    if (!first) return
    const dx = first.box.x - from.x
    const dy = first.box.y - from.y
    for (const c of cards[i] ?? []) {
      parts.push({
        name: c.name,
        board: true,
        group: [
          { offset: 0, ...move(c.box, 0, 0) },
          { offset: SETTLED, ...move(settled, dx, dy) },
          // keine Zwischenstation bei WHITENING: die Spalte hat dort auch keine, sonst liefen
          // beide mit unterschiedlicher Kurve
          { offset: STACKED, ...move(stacked, dx, dy) },
          { offset: CARD, ...move(card, dx, dy) },
          { offset: 1, ...move(card, dx, dy) },
        ],
        image: fade(1, 0, WHITENING, CARD),
      })
    }
  })

  // Die Ablage gehört nicht zum Stapel: Sie rückt mit den Spalten zur Seite und blendet dort aus
  if (dropzone) {
    const shift = lastColumn ? settledX(columns.length - 1) + width - oldRight : 0
    const moved: Box = { ...dropzone, x: dropzone.x + shift }
    parts.push({
      name: DROPZONE_NAME,
      board: true,
      group: [
        { offset: 0, ...frame(dropzone, 'none') },
        { offset: SETTLED, ...frame(moved, 'none') },
        { offset: 1, ...frame(moved, 'none') },
      ],
      image: fade(1, 0, SETTLED, SETTLED + (STACKED - SETTLED) * 0.6),
    })
  }

  // Die leere Karte wächst auf die Größe der Tabelle; erst dann erscheint die Tabelle darin
  parts.push({
    name: SHEET_NAME,
    board: false,
    group: [
      { offset: 0, ...frame(card, look.shadow), backgroundColor: look.surface, opacity: 0 },
      { offset: CARD, ...frame(card, look.shadow), opacity: 0 },
      { offset: handoff, opacity: 1 },
      { offset: GROWN, ...frame(sheet, look.shadow) },
      { offset: 1, ...frame(sheet, 'none'), backgroundColor: look.surface, opacity: 1 },
    ],
    image: fade(0, 1, GROWN, 1),
  })
  return parts
}

/** Spielt die Keyframes rückwärts ab (Tabelle → Board). */
export function reverseKeyframes(keyframes: Keyframe[]): Keyframe[] {
  return keyframes.map((k) => ({ ...k, offset: 1 - (k.offset ?? 0) })).reverse()
}

const toBox = (r: DOMRect): Box => ({ x: r.x, y: r.y, width: r.width, height: r.height })

function measure() {
  const stage = document.querySelector<HTMLElement>('[data-vt-stage]')
  const rect = (part: string) =>
    [...(stage?.querySelectorAll<HTMLElement>(`[data-vt-part="${part}"]`) ?? [])].map((el) =>
      toBox(el.getBoundingClientRect()),
    )
  let visible: Box | undefined
  let contentLeft: number | undefined
  if (stage) {
    contentLeft =
      stage.getBoundingClientRect().left + parseFloat(getComputedStyle(stage).paddingLeft) - stage.scrollLeft
    // Nur der sichtbare Teil der Fläche zählt (sie kann unter den Bildschirmrand reichen)
    const r = stage.getBoundingClientRect()
    const x = Math.max(r.left, 0)
    const y = Math.max(r.top, 0)
    visible = {
      x,
      y,
      width: Math.min(r.right, window.innerWidth) - x,
      height: Math.min(r.bottom, window.innerHeight) - y,
    }
  }
  const columnEls = [...(stage?.querySelectorAll<HTMLElement>('[data-vt-part="column"]') ?? [])]
  // Nur gerenderte Karten haben ein Bild (in eingeklappten Spalten sind sie ausgeblendet)
  const cards = columnEls.map((col) =>
    [...col.querySelectorAll<HTMLElement>('[data-vt-card]')]
      .map((el) => ({ name: el.style.getPropertyValue('--vt-name'), box: toBox(el.getBoundingClientRect()) }))
      .filter((c) => c.name && c.box.width > 0),
  )
  return {
    stage: visible,
    contentLeft,
    columns: columnEls.map((el) => toBox(el.getBoundingClientRect())),
    cards,
    dropzone: rect('dropzone')[0],
    sheet: rect('sheet')[0],
  }
}

/**
 * Wechselt die Ansicht mit Animation. `apply` muss das DOM spätestens beim Auflösen seines
 * Promise umgestellt haben (Navigation mit `flushSync`).
 */
export function switchApplicationsView(to: ApplicationsView, apply: () => void | Promise<void>) {
  if (prefersReducedMotion() || !document.startViewTransition) {
    void apply()
    return
  }
  const root = document.documentElement
  root.setAttribute(BOARD_SWITCHING_ATTR, '')
  const before = measure()
  const transition = document.startViewTransition(async () => {
    await apply()
  })
  void transition.finished.finally(() => root.removeAttribute(BOARD_SWITCHING_ATTR))
  transition.ready
    .then(() => {
      const after = measure()
      const board = to === 'table' ? before : after
      const sheet = to === 'table' ? after.sheet : before.sheet
      const stage = after.stage ?? before.stage
      // Leere oder noch ladende Seite: einfaches Überblenden genügt
      if (!board.columns.length || !sheet || !stage) return

      const token = (name: string) => getComputedStyle(root).getPropertyValue(name).trim()
      // Haarlinie wie der Rahmen der Tabelle, dazu ein weicher Schatten
      const look = {
        column: token('--surface-3') || 'transparent',
        surface: token('--surface') || 'white',
        shadow: `0 0 0 1px ${token('--hair') || 'transparent'}, ${token('--shadow-md') || '0 0 0 transparent'}`,
      }
      const parts = boardToTableParts({
        columns: board.columns,
        cards: board.cards,
        contentLeft: board.contentLeft,
        dropzone: board.dropzone,
        sheet,
        stage,
        look,
      })
      const reversed = to === 'board'
      const animations: Animation[] = []
      for (const part of parts) {
        // Board-Teile sind beim Wechsel zur Tabelle das alte Bild, sonst das neue (und umgekehrt)
        const image = part.board !== reversed ? 'old' : 'new'
        const orient = (k: Keyframe[]) => (reversed ? reverseKeyframes(k) : k)
        const options = { duration: DURATION, fill: 'both' as const }
        animations.push(
          root.animate(orient(part.group), {
            ...options,
            pseudoElement: `::view-transition-group(${part.name})`,
          }),
          root.animate(orient(part.image), {
            ...options,
            pseudoElement: `::view-transition-${image}(${part.name})`,
          }),
        )
      }
      // fill: 'both' hielte die Animationen sonst fest; beim nächsten Wechsel gäbe es Altlasten
      void transition.finished.finally(() => animations.forEach((a) => a.cancel()))
    })
    // Übersprungene Transition (z. B. erneuter Klick): Der Zustand ist trotzdem umgestellt
    .catch(() => {})
}
