import { describe, expect, it } from 'vitest'
import { ApiError } from './client'
import {
  apiErrorOf,
  errorReason,
  isEndpointMissing,
  isHandledInline,
  isNotFound,
  isRetryable,
  mutationToastMessage,
  serverFieldErrors,
  type MutationErrorMeta,
} from './errors'

const validation = (errors: Record<string, string[]>) =>
  new ApiError(400, 'x', { title: 'Validation failed', errors })
const status = (code: number) => new ApiError(code, 'x')

const meta: MutationErrorMeta = {
  errorMessage: 'Die Firma konnte nicht gespeichert werden',
  inlineFields: ['name', 'city'],
  conflictField: 'name',
  conflictMessage: 'Eine Firma mit diesem Namen gibt es bereits.',
}

describe('errors', () => {
  it('findet den ApiError auch als cause', () => {
    const inner = status(404)
    expect(apiErrorOf(inner)).toBe(inner)
    expect(apiErrorOf(new Error('außen', { cause: inner }))).toBe(inner)
    expect(apiErrorOf(new Error('anders'))).toBeNull()
  })

  it('nennt den Grund nach Status, nie den Backend-Text', () => {
    expect(errorReason(status(0))).toBe('Das Backend ist nicht erreichbar.')
    expect(errorReason(status(400))).toBe('Bitte die Eingaben prüfen.')
    expect(errorReason(status(404))).toBe('Der Eintrag existiert nicht mehr.')
    expect(errorReason(status(500))).toBe('Bitte später erneut versuchen.')
    expect(errorReason(new TypeError('kaputt'))).toBe('Bitte später erneut versuchen.')
  })

  it('wiederholt nur Netzwerk- und Serverfehler', () => {
    expect([0, 500, 503].map((s) => isRetryable(status(s)))).toEqual([true, true, true])
    expect([400, 404, 409].map((s) => isRetryable(status(s)))).toEqual([false, false, false])
    expect(isNotFound(status(400))).toBe(true)
    expect(isNotFound(status(404))).toBe(true)
    expect(isNotFound(status(500))).toBe(false)
  })

  it('behandelt „Endpoint not found“ als allgemeinen Fehler, nicht als fehlenden Eintrag', () => {
    const missing = new ApiError(404, 'x', { title: 'Endpoint not found' })
    expect(isEndpointMissing(missing)).toBe(true)
    expect(isEndpointMissing(new ApiError(404, 'x', { title: 'Resource not found' }))).toBe(false)
    expect(isNotFound(missing)).toBe(false)
    expect(isRetryable(missing)).toBe(false)
    expect(errorReason(missing)).toBe('Bitte später erneut versuchen.')
  })

  it('übersetzt Feldfehler und 409 in deutsche Texte', () => {
    expect(serverFieldErrors(validation({ name: ['The Name is required'], city: ['x', 'y'] }))).toEqual({
      name: 'Dieser Wert ist ungültig.',
      city: 'Dieser Wert ist ungültig.',
    })
    expect(serverFieldErrors(status(409), meta)).toEqual({ name: meta.conflictMessage })
    expect(serverFieldErrors(status(409))).toEqual({})
    expect(serverFieldErrors(status(500), meta)).toEqual({})
  })

  it('zeigt keinen Toast für Fehler, die das Formular anzeigt', () => {
    expect(isHandledInline(validation({ name: ['x'] }), meta)).toBe(true)
    expect(isHandledInline(status(409), meta)).toBe(true)
    // ein Feld, das das Formular nicht kennt → Toast
    expect(isHandledInline(validation({ name: ['x'], street: ['y'] }), meta)).toBe(false)
    // 400 ohne Feldfehler (kaputter Body, ungültige ID) → Toast
    expect(isHandledInline(status(400), meta)).toBe(false)
    expect(isHandledInline(status(409), { errorMessage: 'x' })).toBe(false)
  })

  it('baut den Toast-Text aus Meldung und Grund', () => {
    expect(mutationToastMessage(status(500), meta)).toBe(
      'Die Firma konnte nicht gespeichert werden. Bitte später erneut versuchen.',
    )
    expect(mutationToastMessage(status(409), { errorMessage: 'x', conflictMessage: 'Gibt es schon.' })).toBe(
      'Gibt es schon.',
    )
    expect(mutationToastMessage(status(409), meta)).toBeNull()
    expect(mutationToastMessage(status(500), undefined)).toBeNull()
  })
})
