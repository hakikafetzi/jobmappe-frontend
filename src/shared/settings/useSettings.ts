// Feste Einstellungen der App. Das Backend hat dafür (noch) keinen Endpunkt — bis dahin gelten diese
// Standardwerte. Später ersetzt ein Query auf den Einstellungs-Endpunkt ausschließlich diesen Hook;
// alle Aufrufer bleiben unverändert.
// Was nur für diesen Browser gilt (Erscheinungsbild, Name, Standardansichten), liegt im localStorage
// (shared/theme, displayName.ts, viewPreferences.ts).

export type Settings = {
  /** Ab so vielen Tagen ohne Rückmeldung gilt eine Bewerbung als überfällig. */
  followUpDays: number
}

const DEFAULT_SETTINGS: Readonly<Settings> = Object.freeze({
  followUpDays: 20,
})

export function useSettings(): Readonly<Settings> {
  return DEFAULT_SETTINGS
}
