// Animationen: Ohne Unterstützung (z. B. jsdom), bei „Bewegung reduzieren“ oder abgeschalteten
// Animationen steht die Oberfläche sofort im Endzustand.

/**
 * Keine Animationen: Systemeinstellung „Bewegung reduzieren“ oder in den Einstellungen abgeschaltet
 * ([data-motion="off"], shared/theme/motionPreference.ts).
 */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  (document.documentElement.dataset.motion === 'off' ||
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
