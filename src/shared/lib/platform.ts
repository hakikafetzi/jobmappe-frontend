/** Apple-Gerät? Dann heißt die Modifier-Taste ⌘ statt Strg. */
export const isApplePlatform = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent)

/** Anzeige von ⌘/Strg + `key` (z. B. „⌘K“ bzw. „Strg K“). */
export const modKeyLabel = (key: string) => (isApplePlatform() ? `⌘${key}` : `Strg ${key}`)
