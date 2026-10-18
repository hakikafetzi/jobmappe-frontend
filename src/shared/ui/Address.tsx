import { Fragment, type ReactNode } from 'react'
import { addressLines } from '../lib/format'

type Props = {
  company: { street: string | null; postalCode: string | null; city: string | null }
  /** Anzeige, wenn keine Anschrift hinterlegt ist. */
  fallback?: ReactNode
}

/** Firmenanschrift, eine Zeile je Teil (Straße, PLZ und Ort). */
export function Address({ company, fallback = '—' }: Props) {
  const lines = addressLines(company)
  if (!lines.length) return fallback
  return lines.map((line, i) => (
    <Fragment key={line}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ))
}
