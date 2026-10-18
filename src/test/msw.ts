import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { createFakeBackend, sampleData, type FakeBackend, type Seed } from './fake-backend/fakeBackend'

let backend: FakeBackend = createFakeBackend()

/** Setzt das Fake-Backend für den nächsten Test zurück (optional mit eigenen Daten). */
export function resetBackend(seed: Seed = sampleData()): FakeBackend {
  backend = createFakeBackend(seed)
  return backend
}

/** Aktueller Zustand des Fake-Backends (für Assertions). */
export function currentBackend(): FakeBackend {
  return backend
}

export const server = setupServer(
  http.all('*/api/*', async ({ request }) => {
    const url = new URL(request.url)
    const text = request.method === 'GET' || request.method === 'DELETE' ? '' : await request.text()
    const res = backend.handle(
      request.method,
      url.pathname.replace(/^\/api/, '') + url.search,
      text ? JSON.parse(text) : undefined,
    )
    return res.body === undefined
      ? new HttpResponse(null, { status: res.status })
      : HttpResponse.json(res.body, { status: res.status })
  }),
)
