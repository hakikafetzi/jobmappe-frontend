/** Meldung für Postleitzahlen, die keine sein können (z. B. nur Buchstaben). */
export const INVALID_POSTAL_CODE = 'Bitte eine gültige PLZ eingeben (z. B. 60311).'

/**
 * Postleitzahl: 3–10 Zeichen aus Ziffern, Buchstaben, Leerzeichen und Bindestrich, mindestens eine
 * Ziffer. Bewusst nicht nur das deutsche Format, damit auch „1010“ (AT) oder „SW1A 1AA“ (UK) passen.
 */
export function isPostalCode(value: string): boolean {
  const code = value.trim()
  return /^[a-z0-9][a-z0-9 -]{1,8}[a-z0-9]$/i.test(code) && /\d/.test(code)
}
