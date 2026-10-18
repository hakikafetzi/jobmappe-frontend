/**
 * Dringlichkeit einer Bewerbung nach Wartezeit (Tage seit Bewerbung):
 * 0 = frisch, 1 = wartet, 2 = überfällig (≥ followUpDays), 3 = lange überfällig (≥ 2×).
 */
type AgeLevel = 0 | 1 | 2 | 3

export function ageLevel(days: number | null, followUpDays: number): AgeLevel {
  if (days === null) return 0
  if (days >= followUpDays * 2) return 3
  if (days >= followUpDays) return 2
  if (days >= Math.max(3, Math.round(followUpDays / 3))) return 1
  return 0
}

export function isOverdue(days: number | null, followUpDays: number): boolean {
  return days !== null && days >= followUpDays
}
