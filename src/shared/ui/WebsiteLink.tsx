import type { ReactNode } from 'react'
import { websiteHref, websiteLabel } from '../lib/format'

type Props = {
  website: string | null
  /** Anzeige, wenn keine Webseite hinterlegt ist. */
  fallback?: ReactNode
}

/** Firmenwebseite als externer Link, z. B. „beispiel.de ↗“. */
export function WebsiteLink({ website, fallback = '—' }: Props) {
  if (!website) return fallback
  return (
    <a href={websiteHref(website)} target="_blank" rel="noopener noreferrer">
      {websiteLabel(website)} ↗
    </a>
  )
}
