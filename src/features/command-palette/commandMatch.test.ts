import { describe, expect, it } from 'vitest'
import { matchCommands, normalize } from './commandMatch'
import { globalCommands } from './commands'

const commands = globalCommands({ theme: 'system', motion: 'on' })
const labels = (query: string) => matchCommands(commands, query).map((c) => c.label)

describe('commandMatch', () => {
  it('normalisiert Groß-/Kleinschreibung, Umlaute und Satzzeichen', () => {
    expect(normalize('  Bewerbungsübersicht – Straße! ')).toBe('bewerbungsubersicht strasse')
  })

  it('findet Befehle über Label und Synonyme', () => {
    expect(labels('einstellungen')[0]).toBe('Einstellungen')
    expect(labels('konfiguration')).toContain('Einstellungen')
    expect(labels('dark mode')[0]).toBe('Dunkles Design')
    expect(labels('neu')).toEqual(expect.arrayContaining(['Neue Stelle erfassen', 'Neue Firma anlegen']))
    expect(labels('neu')[0]).toBe('Neue Stelle erfassen')
  })

  it('verlangt jedes Wort als Wortanfang', () => {
    expect(labels('neu st')[0]).toBe('Neue Stelle erfassen')
    expect(labels('stellen such')[0]).toBe('Stellen suchen')
    expect(labels('stellungen')).toEqual([])
    expect(labels('xyz')).toEqual([])
  })

  it('findet Umlaute auch ohne Punkte oder mit e', () => {
    expect(labels('hinzufugen')).toContain('Neue Stelle erfassen')
    expect(labels('hinzufuegen')).toContain('Neue Stelle erfassen')
  })

  it('setzt Treffer am Labelanfang vor Treffer über Synonyme', () => {
    // „Stellen“ beginnt so; „Offene Stellen“ trifft im Label, „Stelle erfassen“ nur als Wort
    expect(labels('stellen').slice(0, 2)).toEqual(['Stellen suchen', 'Stellen'])
  })
})

describe('globalCommands', () => {
  const ids = (motion: 'on' | 'off') => globalCommands({ theme: 'dark', motion }).map((c) => c.id)

  it('bietet nur den jeweils anderen Animations-Schalter an', () => {
    expect(ids('on')).toContain('motion-off')
    expect(ids('on')).not.toContain('motion-on')
    expect(ids('off')).toContain('motion-on')
  })

  it('markiert das aktive Erscheinungsbild', () => {
    const dark = globalCommands({ theme: 'dark', motion: 'on' }).find((c) => c.id === 'theme-dark')
    expect(dark?.hint).toBe('aktiv')
  })
})
