/** true, wenn der Fokus in einem Eingabefeld liegt — dann greifen keine Tastenkürzel. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable
}

/** true, wenn gerade ein modaler Dialog offen ist. */
export function isDialogOpen(): boolean {
  return document.querySelector('dialog[open]') !== null
}

/**
 * true, wenn ein Dialog offen ist, der die Seite sperrt. Schwebende Fenster (z. B. Notizen,
 * `Dialog modeless`) zählen nicht.
 */
export function isModalDialogOpen(): boolean {
  return document.querySelector('dialog[open]:not([data-modeless])') !== null
}
