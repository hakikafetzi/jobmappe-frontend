export type Area = 'home' | 'postings' | 'applications' | 'notes' | 'settings'

/** Welcher Hauptbereich zu welcher Route gehört. „settings“ hat keinen Eintrag in der Navigation. */
export function areaOf(pathname: string): Area {
  if (/^\/(stellen|firmen)/.test(pathname)) return 'postings'
  if (pathname.startsWith('/bewerbungen')) return 'applications'
  if (pathname.startsWith('/notizen')) return 'notes'
  if (pathname.startsWith('/einstellungen')) return 'settings'
  return 'home'
}
