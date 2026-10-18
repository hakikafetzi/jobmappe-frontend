import { describe, expect, it } from 'vitest'
import { boardToTableParts, cardBox, reverseKeyframes, type Box, type ColumnCard } from './viewTransition'

const stage: Box = { x: 0, y: 100, width: 1000, height: 600 }
const columns: Box[] = [
  { x: 20, y: 120, width: 260, height: 400 },
  { x: 292, y: 120, width: 46, height: 300 },
  { x: 350, y: 120, width: 260, height: 900 },
]
// Spalte 0 mit zwei Karten (die zweite höher), Spalte 1 eingeklappt, Spalte 2 leer
const cards: ColumnCard[][] = [
  [
    { name: 'c0', box: { x: 30, y: 160, width: 240, height: 100 } },
    { name: 'c1', box: { x: 30, y: 268, width: 240, height: 120 } },
  ],
]
const dropzone: Box = { x: 622, y: 120, width: 260, height: 120 }
const sheet: Box = { x: 40, y: 120, width: 920, height: 500 }
const look = { column: 'G', surface: 'W', shadow: 'S' }
const parts = boardToTableParts({ columns, cards, dropzone, sheet, stage, look })
const byName = (name: string) => parts.find((p) => p.name === name)!

describe('boardToTableParts', () => {
  it('schiebt zuerst die Karten ineinander, klappt Spalten auf und macht alle gleich groß', () => {
    // Spalte 0 mit ineinander liegenden Karten: 40 oben + höchste Karte 120 + 132 unten = 292;
    // die leere Spalte 2 ist mit 900 höher, also werden alle 900 hoch. Die eingeklappte Spalte 1
    // wird 260 breit, alle rücken um die alte Mitte (315) auseinander: 3 · 260 + 2 · 12 = 804
    const settledX = [-87, 185, 457]
    for (const i of columns.keys()) {
      const { group } = byName(`jm-board-col-${i}`)
      expect(group[0]?.backgroundColor).toBe('G')
      expect(group[1]).toMatchObject({
        transform: `translate(${settledX[i]}px, 120px)`,
        width: '260px',
        height: '900px',
      })
    }
    // Nur der senkrechte Titel der eingeklappten Spalte blendet schon jetzt aus
    expect(byName('jm-board-col-1').image[2]).toMatchObject({ offset: 0.1, opacity: 0 })
    expect(byName('jm-board-col-0').image[1]?.opacity).toBe(1)
    // beide Karten landen auf dem Platz der ersten, die Spalte ist um 107 nach links gerückt
    for (const name of ['c0', 'c1']) {
      const { group, image } = byName(name)
      expect(group[1]?.transform).toBe('translate(-77px, 160px)')
      // fahren mit der Spalte in den Stapel: Spalte 0 liegt bei x = 500 - 130
      expect(group[2]?.transform).toBe('translate(380px, 160px)')
      expect(image.at(-1)?.opacity).toBe(0)
    }
    expect(byName('c1').group[0]?.transform).toBe('translate(30px, 268px)')
  })

  it('lässt ein zu breites Board an der Inhaltskante beginnen', () => {
    const wide = boardToTableParts({ columns, contentLeft: 20, sheet, stage, look })
    expect(wide.find((p) => p.name === 'jm-board-col-0')?.group[1]?.transform).toBe('translate(20px, 120px)')
  })

  it('ohne Karten werden die Spalten so hoch wie die höchste', () => {
    const plain = boardToTableParts({ columns: columns.slice(0, 2), sheet, stage, look })
    expect(plain.find((p) => p.name === 'jm-board-col-1')?.group[1]?.height).toBe('400px')
  })

  it('legt die Spalten in der Mitte übereinander und schrumpft sie zu einer weißen Karte', () => {
    const card = cardBox(stage)
    expect(card).toEqual({ x: 380, y: 325.5, width: 240, height: 149 })

    for (const [i, from] of columns.entries()) {
      const { group, image } = byName(`jm-board-col-${i}`)
      const [start, , stacked] = group
      const small = group.find((k) => k.backgroundColor === 'W')
      expect(start).toMatchObject({ offset: 0, transform: `translate(${from.x}px, ${from.y}px)` })
      // horizontal mittig, alle gleich breit; die letzte Spalte liegt obenauf
      expect(stacked).toMatchObject({ transform: `translate(370px, ${120 + i * 5}px)`, width: '260px' })
      // alle Spalten landen genau auf der Karte, ihr Inhalt ist dann ausgeblendet
      expect(small).toMatchObject({ transform: 'translate(380px, 325.5px)', width: '240px', height: '149px' })
      expect(image.at(-1)?.opacity).toBe(0)
    }
    // Zu hohe Spalten werden auf die sichtbare Fläche begrenzt
    expect(byName('jm-board-col-2').group[2]?.height).toBe('580px')
  })

  it('lässt die Tabelle aus der Karte auf ihre Größe wachsen', () => {
    const { group, image } = byName('jm-sheet')
    expect(group[0]).toMatchObject({ transform: 'translate(380px, 325.5px)', width: '240px' })
    expect(group.at(-1)).toMatchObject({
      transform: 'translate(40px, 120px)',
      width: '920px',
      height: '500px',
    })
    expect(image[0]?.opacity).toBe(0)
    expect(image.at(-1)?.opacity).toBe(1)
  })

  it('lässt die Ablage mit den Spalten zur Seite rücken und dort ausblenden', () => {
    const { group, image } = byName('jm-board-drop')
    // rechter Rand der Spalten: vorher 610, nachher 457 + 260 = 717
    expect(group.map((k) => k.transform)).toEqual([
      'translate(622px, 120px)',
      'translate(729px, 120px)',
      'translate(729px, 120px)',
    ])
    expect(image.at(-1)?.opacity).toBe(0)
  })
})

describe('reverseKeyframes', () => {
  it('spiegelt Reihenfolge und Zeitpunkte', () => {
    const kf = [
      { offset: 0, opacity: 1 },
      { offset: 0.3, opacity: 0.5 },
      { offset: 1, opacity: 0 },
    ]
    expect(reverseKeyframes(kf)).toEqual([
      { offset: 0, opacity: 0 },
      { offset: 0.7, opacity: 0.5 },
      { offset: 1, opacity: 1 },
    ])
  })
})
