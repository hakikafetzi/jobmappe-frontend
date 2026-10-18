/** Höchstens so lange wartet ein animierter Wechsel auf die Daten der Zielseite bzw. -ansicht. */
export const PREFETCH_WAIT_MS = 800

/**
 * Wartet auf `promise`, aber höchstens `ms` Millisekunden; Fehler werden geschluckt. Für Vorab-
 * Laden vor einem animierten Wechsel: Klappt es nicht rechtzeitig, geht es trotzdem weiter.
 */
export function settleWithin(promise: Promise<unknown>, ms: number): Promise<void> {
  return Promise.race([
    promise.then(
      () => undefined,
      () => undefined,
    ),
    new Promise<void>((resolve) => setTimeout(resolve, ms)),
  ])
}
