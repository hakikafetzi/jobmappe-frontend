/** Meldung für Links, die sich nicht als Webadresse öffnen lassen. */
export const INVALID_URL = 'Bitte einen gültigen Link eingeben (https://…).'

/** Trimmt und ergänzt `https://`, wenn kein Schema angegeben ist (z. B. „firma.de/jobs“). */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/** http(s)-Adresse mit Host und ohne Leerzeichen — alles andere taugt nicht als `href`. */
export function isWebUrl(value: string): boolean {
  if (/\s/.test(value)) return false
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.hostname !== ''
  } catch {
    return false
  }
}
