import { http as mock, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { server } from '../test/msw'
import { ApiError, http, withParams } from './client'

const failWith = (response: () => Response) => server.use(mock.get('*/api/probe', response))
const probe = () => http.get('/probe').catch((e: unknown) => e)

describe('http', () => {
  it('übernimmt Status, Titel und Feldfehler aus dem ProblemDetail', async () => {
    failWith(() =>
      HttpResponse.json(
        { status: 400, title: 'Validation failed', detail: '…', errors: { name: ['The Name is required'] } },
        { status: 400 },
      ),
    )
    const error = await probe()
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({
      status: 400,
      title: 'Validation failed',
      fieldErrors: { name: ['The Name is required'] },
    })
  })

  it('verkraftet Fehler ohne JSON-Body', async () => {
    failWith(() => new HttpResponse('Bad Gateway', { status: 502 }))
    expect(await probe()).toMatchObject({ status: 502, title: null, fieldErrors: {} })
  })

  it('ignoriert ein ungültiges errors-Feld', async () => {
    failWith(() => HttpResponse.json({ title: 'Conflict', errors: 'kaputt' }, { status: 409 }))
    expect(await probe()).toMatchObject({ status: 409, title: 'Conflict', fieldErrors: {} })
  })

  it('meldet ein nicht erreichbares Backend mit Status 0', async () => {
    failWith(() => HttpResponse.error())
    expect(await probe()).toMatchObject({ status: 0 })
  })
})

describe('withParams', () => {
  it('lässt leere Werte weg und wiederholt sort', () => {
    expect(withParams('/applications', { page: 0, size: 20, sort: ['status,asc', 'createdAt,desc'] })).toBe(
      '/applications?page=0&size=20&sort=status%2Casc&sort=createdAt%2Cdesc',
    )
    expect(withParams('/companies', { status: undefined, filter: '' })).toBe('/companies')
  })
})
