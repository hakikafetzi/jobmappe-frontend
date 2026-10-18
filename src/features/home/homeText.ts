/** Begrüßung nach Tageszeit, mit Vornamen (erstes Wort des Namens), z. B. „Guten Morgen, Anna“. */
export function greetingFor(hour: number, name: string): string {
  const greeting = hour < 11 ? 'Guten Morgen' : hour < 18 ? 'Hallo' : 'Guten Abend'
  const firstName = name.trim().split(/\s+/)[0]
  return firstName ? `${greeting}, ${firstName}` : greeting
}

export function capturedLabel(days: number): string {
  if (days <= 0) return 'Heute erfasst'
  if (days === 1) return 'Gestern erfasst'
  return `Vor ${days} Tagen erfasst`
}
