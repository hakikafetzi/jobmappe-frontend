import type { ApplicationDetail, ApplicationPatch } from '../../../api/types'
import { INVALID_URL, isWebUrl, normalizeUrl } from '../../../shared/lib/url'
import type { ViaInput } from '../components/ViaFields'

/** Fehler am Portal-Link oder null; der Link ist freiwillig, muss sich aber öffnen lassen. */
export function viaUrlError(input: ViaInput): string | null {
  const url = normalizeUrl(input.url)
  return url && !isWebUrl(url) ? INVALID_URL : null
}

/**
 * Nur geänderte, gesetzte Werte senden: Laut API-Vertrag lassen fehlende Felder den Wert
 * unverändert, und leere Strings sind ungültig — Weg und Link lassen sich also nicht leeren.
 */
export function buildViaPatch(
  current: Pick<ApplicationDetail, 'appliedVia' | 'portalUrl'>,
  input: ViaInput,
): ApplicationPatch {
  const patch: ApplicationPatch = {}
  const url = normalizeUrl(input.url)
  if (input.way && input.way !== current.appliedVia) patch.appliedVia = input.way
  if (url && url !== current.portalUrl) patch.portalUrl = url
  return patch
}
