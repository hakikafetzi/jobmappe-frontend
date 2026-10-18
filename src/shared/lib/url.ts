/** Meldung für Links, die sich nicht als Webadresse öffnen lassen. */
export const INVALID_URL = 'Bitte einen gültigen Link eingeben (https://…).'

/** Trimmt und ergänzt `https://`, wenn kein Schema angegeben ist (z. B. „firma.de/jobs“). */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  return /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`
}

/** Domain mit Endung, z. B. „firma.de“ (Umlaut-Domains kommen von `URL` als „xn--…“). */
const DOMAIN = /^([a-z0-9-]+\.)+([a-z]{2,}|xn--[a-z0-9-]+)$/i

/**
 * http(s)-Adresse mit Domain samt Endung und ohne Leerzeichen — alles andere taugt nicht als
 * `href` (z. B. „sff“ oder „javascript:…“).
 */
export function isWebUrl(value: string): boolean {
  if (/\s/.test(value)) return false
  try {
    const url = new URL(value)
    return (url.protocol === 'https:' || url.protocol === 'http:') && DOMAIN.test(url.hostname)
  } catch {
    return false
  }
}
