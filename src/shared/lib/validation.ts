// Formatregeln für Freitextfelder. Sie prüfen nur, ob eine Eingabe die erwartete Art von Wert sein
// kann; ob ein Feld Pflicht ist, entscheidet das jeweilige Formular.

const LETTER = /\p{L}/u
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u

/** Titel einer Stelle: mind. 2 Zeichen und mind. ein Buchstabe. */
export const isJobTitle = (value: string) => value.trim().length >= 2 && LETTER.test(value)

/** Ort einer Stelle: mind. ein Buchstabe (z. B. „Remote“, „Frankfurt / Hybrid“). */
export const isLocation = (value: string) => LETTER.test(value)

/** Firmenname: mind. 2 Zeichen mit mind. einem Buchstaben oder einer Ziffer (z. B. „1&1“). */
export const isCompanyName = (value: string) => value.trim().length >= 2 && LETTER_OR_DIGIT.test(value)

/** Straße mit Hausnummer: Buchstaben und eine Ziffer (z. B. „Musterstraße 12a“). */
export const isStreet = (value: string) => LETTER.test(value) && /\d/.test(value)

/** Ortsname: nur Buchstaben, Leerzeichen und - . ' ( ) / (z. B. „Halle (Saale)“, „St. Ingbert“). */
export const isCity = (value: string) => /^[\p{L}][\p{L} .'()/-]*[\p{L}.)]$/u.test(value.trim())

/** Ordnername: mind. ein Buchstabe oder eine Ziffer. */
export const isFolderName = (value: string) => LETTER_OR_DIGIT.test(value)

/** Vorname für die Begrüßung: nur Buchstaben, Leerzeichen und - ' . (z. B. „Anna-Lena“). */
export const isPersonName = (value: string) => /^[\p{L} .'-]*$/u.test(value) && LETTER.test(value)
