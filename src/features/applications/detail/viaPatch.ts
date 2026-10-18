import type { ApplicationDetail, ApplicationPatch } from '../../../api/types'
import type { ViaInput } from '../components/ViaFields'

/**
 * Nur geänderte, gesetzte Werte senden: Laut API-Vertrag lassen fehlende Felder den Wert
 * unverändert, und leere Strings sind ungültig — Weg und Link lassen sich also nicht leeren.
 */
export function buildViaPatch(
  current: Pick<ApplicationDetail, 'appliedVia' | 'portalUrl'>,
  input: ViaInput,
): ApplicationPatch {
  const patch: ApplicationPatch = {}
  const url = input.url.trim()
  if (input.way && input.way !== current.appliedVia) patch.appliedVia = input.way
  if (url && url !== current.portalUrl) patch.portalUrl = url
  return patch
}
