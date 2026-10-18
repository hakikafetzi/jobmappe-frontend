/** Millisekunden eines Tages */
export const DAY = 86_400_000

/** "2026-09-29" oder "2026-09-29T18:30:00.123" → Date (lokal, ohne Zeitzonen-Verschiebung) */
export function parseLocalDate(d: string): Date {
  const [y = 1970, m = 1, dd = 1] = d.slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, dd)
}

/** Wochentag mit Montag = 0 … Sonntag = 6 */
export function weekdayIndex(d: Date): number {
  return (d.getDay() + 6) % 7
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

/** "2026-09-29…" → "29.09.2026"; null → "—" */
export function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  const [y, m, dd] = d.slice(0, 10).split('-')
  return `${dd}.${m}.${y}`
}

function daysBetween(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY)
}

/** Tage seit einem LocalDate/LocalDateTime bis `now`. */
export function daysSince(d: string | null | undefined, now: Date = new Date()): number | null {
  return d ? daysBetween(parseLocalDate(d), now) : null
}

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Leere Eingabe als null senden (der Vertrag verbietet Strings nur aus Leerzeichen). */
export function orNull(value: string): string | null {
  return value.trim() || null
}

/** Gender-Zusatz „(m/w/d)“ ausblenden, damit in Listen mehr vom Titel sichtbar bleibt. */
export function shortTitle(t: string): string {
  return t.replace(/\s*\((m|w|d|f|x|div)(\s*\/\s*(m|w|d|f|x|div))+\)/gi, '').trim()
}

/** Firmenname ohne Rechtsform am Ende, z. B. für Dateinamen: „Mustermann GmbH & Co. KG“ → „Mustermann“. */
export function shortCompanyName(name: string): string {
  return name.replace(/\s+(GmbH\s*&\s*Co\.?\s*KG|GmbH|AG|SE|KG|mbH|e\.\s?V\.)$/i, '').trim()
}

export function initials(name: string): string {
  const words = name
    .replace(/\b(GmbH|AG|SE|KG|mbH|Co\.?|eG)\b|&/gi, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const result = words
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
  return result || name.charAt(0).toUpperCase() || '?'
}

/** Das Backend speichert Webseiten mit oder ohne Schema. */
export function websiteHref(site: string): string {
  return /^https?:\/\//i.test(site) ? site : `https://${site}`
}

export function websiteLabel(site: string): string {
  return site.replace(/^https?:\/\//i, '').replace(/\/$/, '')
}

/** Anschrift als Zeilen: ["Bankplatz 1", "60311 Frankfurt am Main"], leer ohne Angaben. */
export function addressLines(c: {
  street: string | null
  postalCode: string | null
  city: string | null
}): string[] {
  const cityLine = [c.postalCode, c.city].filter(Boolean).join(' ')
  return [c.street, cityLine].filter((line): line is string => !!line)
}

/** plural(3, 'Stelle', 'Stellen') → "3 Stellen" */
export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

export function percent(part: number, total: number): number {
  return total ? Math.round((part / total) * 100) : 0
}
