// IDs der Beispieldaten (siehe sampleSeed.json), z. B. seedId('application', 1) für „a1“.
const KIND = { category: 1, company: 2, posting: 3, application: 4, note: 5 } as const

export function seedId(kind: keyof typeof KIND, n: number): string {
  return `00000000-0000-4000-8${KIND[kind]}00-${String(n).padStart(12, '0')}`
}
