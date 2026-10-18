import { useLocation } from 'react-router'
import { paths, type ApplicationOrigin } from '../../../app/paths'

const isOrigin = (s: unknown): s is ApplicationOrigin =>
  !!s && typeof s === 'object' && 'from' in s && ['postings', 'home', 'board'].includes(String(s.from))

/** Zurück-Link je nachdem, woher man in die Bewerbung kam (Standard: Bewerbungen). */
export function useBackLink(postingId: string | undefined): { label: string; to: string } {
  const state = useLocation().state
  const origin: ApplicationOrigin = isOrigin(state) ? state : { from: 'board' }
  if (origin.from === 'postings') {
    return { label: 'Zurück zur Stelle', to: paths.posting(origin.postingId || postingId || '', 'all') }
  }
  if (origin.from === 'home') return { label: 'Zurück zur Übersicht', to: paths.home() }
  return { label: 'Zurück zu den Bewerbungen', to: paths.applications() }
}
