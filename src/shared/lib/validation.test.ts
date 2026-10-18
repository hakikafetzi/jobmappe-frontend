import { describe, expect, it } from 'vitest'
import {
  isCity,
  isCompanyName,
  isFolderName,
  isJobTitle,
  isLocation,
  isPersonName,
  isStreet,
} from './validation'

const cases: [string, (value: string) => boolean, valid: string[], invalid: string[]][] = [
  [
    'Titel der Stelle',
    isJobTitle,
    ['Junior Java Entwickler (m/w/d)', 'QA', 'C++ Dev'],
    ['x', '123', '!!', '  a  '],
  ],
  ['Ort', isLocation, ['Remote', 'Frankfurt / Hybrid', '60311 Frankfurt'], ['123', '--']],
  ['Firmenname', isCompanyName, ['Beispiel Energie AG', '1&1', 'B2'], ['!!', 'a', '  ']],
  [
    'Straße und Hausnummer',
    isStreet,
    ['Musterstraße 12', 'Musterstraße 12a', 'Am Ring 3-5'],
    ['Musterstraße', '12'],
  ],
  [
    'Stadt',
    isCity,
    ['Frankfurt am Main', 'Halle (Saale)', 'St. Ingbert', 'Garmisch-Partenkirchen', 'Köln'],
    ['Frankfurt1', '60311', 'K', '-Köln', 'Köln!'],
  ],
  ['Ordnername', isFolderName, ['Gehalt', '2026'], ['!!!', '--']],
  ['Vorname', isPersonName, ['Anna', 'Anna-Lena', "D'Angelo", 'José'], ['Anna2', '!!', '   ']],
]

describe('Formatregeln', () => {
  it.each(cases)('%s', (_, rule, valid, invalid) => {
    expect(valid.filter((v) => !rule(v))).toEqual([])
    expect(invalid.filter((v) => rule(v))).toEqual([])
  })
})
