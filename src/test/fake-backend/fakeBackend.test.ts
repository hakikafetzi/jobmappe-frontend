import { describe, expect, it } from 'vitest'
import { createFakeBackend } from './fakeBackend'
import { seedId } from './seedIds'

describe('Fake-Backend bildet den Vertrag ab', () => {
  it('lehnt unerlaubte Statuswechsel komplett mit 409 ab', () => {
    const backend = createFakeBackend()
    const id = seedId('application', 4) // IN_PROGRESS
    const res = backend.handle('PATCH', `/applications/${id}`, { status: 'INTERVIEW', priority: 'LOW' })
    expect(res.status).toBe(409)
    expect(backend.db.applications.find((a) => a.id === id)).toMatchObject({
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
    })
  })

  it('leert Weg und Link beim Wechsel nach IN_PROGRESS, auch wenn sie mitgesendet werden', () => {
    const backend = createFakeBackend()
    const id = seedId('application', 1) // INTERVIEW
    const res = backend.handle('PATCH', `/applications/${id}`, { status: 'IN_PROGRESS', appliedVia: 'EMAIL' })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ appliedAt: null, appliedVia: null, portalUrl: null })
  })

  it('weist unbekannte Bewerbungswege als ungültigen Body ab', () => {
    const res = createFakeBackend().handle('PATCH', `/applications/${seedId('application', 1)}`, {
      appliedVia: 'LinkedIn',
    })
    expect(res).toMatchObject({ status: 400, body: { title: 'Bad Request' } })
  })

  it('archiviert nur ohne Bewerbung und startet keine Bewerbung für archivierte Stellen', () => {
    const backend = createFakeBackend()
    const free = seedId('posting', 8)
    expect(
      backend.handle('PATCH', `/job-postings/${seedId('posting', 1)}/archive`, { archived: true }).status,
    ).toBe(409)
    expect(backend.handle('PATCH', `/job-postings/${free}/archive`, { archived: false }).status).toBe(409)
    expect(backend.handle('PATCH', `/job-postings/${free}/archive`, { archived: true })).toMatchObject({
      status: 200,
      body: { archivedAt: '2026-09-01' },
    })
    expect(backend.handle('PATCH', `/job-postings/${free}/archive`, { archived: true }).status).toBe(409)
    expect(backend.handle('POST', `/job-postings/${free}/applications`).status).toBe(409)
  })

  it('löscht Notizen', () => {
    const backend = createFakeBackend()
    const id = seedId('note', 1)
    expect(backend.handle('DELETE', `/notes/${id}`).status).toBe(204)
    expect(backend.handle('GET', `/notes/${id}`).status).toBe(404)
  })

  it('listet Notizen paginiert mit Filtern; Suche lässt sich nicht kombinieren', () => {
    const backend = createFakeBackend()
    const app = seedId('application', 1)
    const prep = seedId('category', 1)
    type NotePage = { content: { id: string; applicationId: string | null }[]; totalElements: number }
    const list = (query: string) => backend.handle('GET', `/notes${query}`)
    const total = (query: string) => (list(query).body as NotePage).totalElements
    expect(total('')).toBe(backend.db.notes.length)
    expect(total(`?applicationId=${app}`)).toBe(4)
    expect(total(`?noteCategoryId=${prep}`)).toBe(5)
    // Bewerbung + Ordner zusammen
    expect(total(`?applicationId=${app}&noteCategoryId=${prep}`)).toBe(2)
    expect(total('?q=gehalt')).toBe(1)
    expect(total(`?noteCategoryId=${seedId('category', 99)}`)).toBe(0)
    expect(list(`?q=x&applicationId=${app}`)).toMatchObject({
      status: 400,
      body: { title: 'Invalid request combination' },
    })
    expect(list('?applicationId=abc')).toMatchObject({
      status: 400,
      body: { title: 'Bad Request' },
    })
    expect(list('?sort=content,asc')).toMatchObject({ status: 400, body: { title: 'Invalid sort property' } })
    expect(backend.handle('GET', `/applications/${app}/notes`).body).toMatchObject({
      title: 'Not Found',
    })
  })

  it('legt Notizen mit und ohne Bewerbung an; PUT ohne applicationId löst die Zuordnung', () => {
    const backend = createFakeBackend()
    const app = seedId('application', 2)
    const loose = backend.handle('POST', '/notes', { title: 'Lose' })
    expect(loose).toMatchObject({ status: 201, body: { applicationId: null, jobTitle: null } })
    const bound = backend.handle('POST', '/notes', { title: 'Fest', applicationId: app })
    expect(bound).toMatchObject({ status: 201, body: { applicationId: app } })
    expect((bound.body as { jobTitle: string | null }).jobTitle).toBeTruthy()
    expect(
      backend.handle('POST', '/notes', { title: 'X', applicationId: seedId('application', 99) }).status,
    ).toBe(404)
    const id = (bound.body as { id: string }).id
    expect(backend.handle('PUT', `/notes/${id}`, { title: 'Fest' })).toMatchObject({
      status: 200,
      body: { applicationId: null, companyName: null },
    })
  })

  it('liefert paginierte, sortierte Listen als Page<T>', () => {
    const backend = createFakeBackend()
    const all = backend.db.companies.length
    const res = backend.handle('GET', '/companies?page=1&size=3')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ page: 1, size: 3, totalElements: all, totalPages: Math.ceil(all / 3) })
    const names = (r: typeof res) => (r.body as { content: { name: string }[] }).content.map((c) => c.name)
    const sorted = backend.db.companies.map((c) => c.name).toSorted()
    expect(names(res)).toEqual(sorted.slice(3, 6))
    expect(names(backend.handle('GET', '/companies?sort=name,desc&size=100'))).toEqual(sorted.toReversed())
  })

  it('fängt ungültige page/size ab und kappt size bei 100', () => {
    const backend = createFakeBackend()
    expect(backend.handle('GET', '/companies?page=-1&size=abc').body).toMatchObject({ page: 0, size: 15 })
    expect(backend.handle('GET', '/companies?size=500').body).toMatchObject({ size: 100 })
    expect(backend.handle('GET', '/companies?page=99').body).toMatchObject({ content: [] })
  })

  it('filtert Stellen und Bewerbungen und lehnt ungültige Parameter ab', () => {
    const backend = createFakeBackend()
    const total = (path: string) =>
      (backend.handle('GET', path).body as { totalElements: number }).totalElements
    const applied = new Set(backend.db.applications.map((a) => a.jobPostingId)).size
    expect(total('/job-postings?filter=APPLIED')).toBe(applied)
    const applyable = backend.db.postings.filter(
      (p) =>
        p.status === 'ACTIVE' &&
        p.archivedAt === null &&
        !backend.db.applications.some((a) => a.jobPostingId === p.id),
    ).length
    expect(total('/job-postings?filter=OPEN')).toBe(applyable)
    expect(total('/job-postings?filter=ARCHIVED')).toBe(0)
    const waiting = backend.db.applications.filter((a) => a.status === 'WAITING').length
    expect(total('/applications?status=WAITING')).toBe(waiting)

    expect(backend.handle('GET', '/job-postings?filter=open').body).toMatchObject({
      title: 'Bad Request',
    })
    expect(backend.handle('GET', '/applications?priority=URGENT').status).toBe(400)
    expect(backend.handle('GET', '/applications?sort=jobTitle')).toMatchObject({
      status: 400,
      body: { title: 'Invalid sort property' },
    })
  })

  it('sucht mit q in Firmenname bzw. Titel und Firma, nicht kombinierbar mit Filtern', () => {
    const backend = createFakeBackend()
    const titles = (path: string) => {
      const res = backend.handle('GET', path)
      expect(res.status).toBe(200)
      return (res.body as { content: { name?: string; title?: string; jobTitle?: string }[] }).content
    }
    const company = backend.db.companies[0]!
    const term = `  ${company.name.slice(1, 4).toUpperCase()} `
    const expected = backend.db.companies.filter((c) =>
      c.name.toLowerCase().includes(term.trim().toLowerCase()),
    )
    expect(titles(`/companies?size=100&q=${encodeURIComponent(term)}`)).toHaveLength(expected.length)

    // Stellen: Titel oder Firmenname
    const byCompany = titles(`/job-postings?size=100&q=${encodeURIComponent(company.name)}`)
    const ofCompany = backend.db.postings.filter((p) => p.companyId === company.id).length
    expect(byCompany.length).toBeGreaterThanOrEqual(ofCompany)
    const posting = backend.db.postings[0]!
    expect(
      titles(`/job-postings?filter=ALL&q=${encodeURIComponent(posting.title)}`).map((p) => p.title),
    ).toContain(posting.title)
    // Bewerbungen: Stellentitel oder Firma
    const app = backend.db.applications[0]!
    const appTitle = backend.db.postings.find((p) => p.id === app.jobPostingId)!.title
    expect(
      titles(`/applications?size=100&q=${encodeURIComponent(appTitle)}`).map((a) => a.jobTitle),
    ).toContain(appTitle)
    // Nur Leerzeichen = keine Suche
    expect(titles('/companies?size=100&q=%20%20')).toHaveLength(Math.min(100, backend.db.companies.length))

    for (const path of [
      '/job-postings?q=java&filter=OPEN',
      '/applications?q=java&status=APPLIED',
      '/applications?q=java&priority=HIGH',
    ])
      expect(backend.handle('GET', path)).toMatchObject({
        status: 400,
        body: { title: 'Invalid request combination' },
      })
  })

  it('meldet unbekannte Pfade als 404 „Not Found“ und falsche Methoden als 405', () => {
    const backend = createFakeBackend()
    expect(backend.handle('GET', '/gibt-es-nicht')).toMatchObject({
      status: 404,
      body: { title: 'Not Found' },
    })
    expect(backend.handle('DELETE', '/companies')).toMatchObject({
      status: 405,
      body: { title: 'Method Not Allowed' },
    })
  })

  it('verlangt Links mit http:// oder https://', () => {
    const backend = createFakeBackend()
    expect(backend.handle('POST', '/companies', { name: 'Neu GmbH', website: 'neu.example' })).toMatchObject({
      status: 400,
      body: { title: 'Validation failed', errors: { website: [expect.any(String)] } },
    })
    const app = `/applications/${seedId('application', 1)}`
    expect(backend.handle('PATCH', app, { portalUrl: 'ftp://neu.example' }).status).toBe(400)
    expect(backend.handle('PATCH', app, { portalUrl: 'https://jobs.neu.example' }).status).toBe(200)
  })

  it('liefert nach Mutationen das Detail', () => {
    const backend = createFakeBackend()
    const company = backend.handle('POST', '/companies', { name: 'Detail GmbH' })
    expect(company).toMatchObject({ status: 201, body: { jobsCount: 0 } })
    const companyId = (company.body as { id: string }).id
    const posting = backend.handle('POST', `/companies/${companyId}/job-postings`, {
      title: 'Entwickler',
      url: 'https://detail.example/jobs/1',
      status: 'ACTIVE',
    })
    expect(posting).toMatchObject({
      status: 201,
      body: { company: { id: companyId }, applicationId: null, archivedAt: null },
    })
    expect(posting.body).not.toHaveProperty('hasApplication')
    const postingId = (posting.body as { id: string }).id
    const app = backend.handle('POST', `/job-postings/${postingId}/applications`)
    expect(app).toMatchObject({
      status: 201,
      body: { status: 'IN_PROGRESS', jobPosting: { id: postingId }, company: { id: companyId } },
    })
    expect((app.body as { createdAt: string }).createdAt).toBeTruthy()
  })

  it('liefert Ordner nach Name sortiert', () => {
    const backend = createFakeBackend()
    backend.handle('POST', '/note-categories', { name: 'AAA zuerst' })
    const names = (backend.handle('GET', '/note-categories').body as { name: string }[]).map((c) => c.name)
    expect(names[0]).toBe('AAA zuerst')
    expect(names).toEqual(names.toSorted((a, b) => a.localeCompare(b)))
  })
})
