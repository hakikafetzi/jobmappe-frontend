// In-Memory-Nachbau des Backends (gleicher API-Vertrag) — für Komponententests.
// Bildet auch das Verhalten ab, das der Vertrag nur beschreibt (z. B. setzt das Backend
// appliedAt/closedAt selbst). Wird über MSW (Vitest) genutzt.
import type {
  ApplicationChannel,
  ApplicationCompact,
  ApplicationDetail,
  ApplicationPatch,
  ApplicationPriority,
  ApplicationResponse,
  ApplicationStatus,
  CompanyCompact,
  CompanyDetail,
  CompanyRequest,
  CompanyResponse,
  JobPostingArchiveRequest,
  JobPostingCompact,
  JobPostingDetail,
  JobPostingFilter,
  JobPostingRequest,
  JobPostingResponse,
  JobPostingStatus,
  NoteCategory,
  NoteCategoryRequest,
  NoteCompact,
  NoteDetail,
  NoteRequest,
  Page,
} from '../../api/types'
import sampleSeed from './sampleSeed.json' with { type: 'json' }

type CompanyRow = CompanyResponse
type PostingRow = {
  id: string
  companyId: string
  title: string
  description: string | null
  location: string | null
  url: string
  status: JobPostingStatus
  publishedAt: string | null
  createdAt: string
  archivedAt: string | null
}
type ApplicationRow = {
  id: string
  jobPostingId: string
  status: ApplicationStatus
  priority: ApplicationPriority
  appliedAt: string | null
  appliedVia: ApplicationChannel | null
  portalUrl: string | null
  closedAt: string | null
  createdAt: string
}
type NoteRow = {
  id: string
  applicationId: string | null
  categoryId: string | null
  title: string
  content: string | null
  createdAt: string
  updatedAt: string
}

export type Seed = {
  categories: NoteCategory[]
  companies: CompanyRow[]
  postings: PostingRow[]
  applications: ApplicationRow[]
  notes: NoteRow[]
}

export type FakeResponse = { status: number; body?: unknown }

const CLOSED: ReadonlySet<ApplicationStatus> = new Set([
  'OFFER_ACCEPTED',
  'OFFER_REJECTED',
  'REJECTED',
  'WITHDRAWN',
  'NO_RESPONSE',
])

/** Erlaubte Statuswechsel laut Backend (absichtlich unabhängig von domain/transitions.ts). */
const OPEN_STATUSES: readonly ApplicationStatus[] = [
  'IN_PROGRESS',
  'APPLIED',
  'WAITING',
  'INTERVIEW',
  'OFFER',
]
const SENT_TARGETS: readonly ApplicationStatus[] = [
  'IN_PROGRESS',
  'APPLIED',
  'WAITING',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'NO_RESPONSE',
  'WITHDRAWN',
]
const ALLOWED_TRANSITIONS: Record<ApplicationStatus, readonly ApplicationStatus[]> = {
  IN_PROGRESS: ['APPLIED', 'WITHDRAWN'],
  APPLIED: SENT_TARGETS,
  WAITING: SENT_TARGETS,
  INTERVIEW: SENT_TARGETS,
  OFFER: ['IN_PROGRESS', 'APPLIED', 'WAITING', 'INTERVIEW', 'OFFER_ACCEPTED', 'OFFER_REJECTED'],
  OFFER_ACCEPTED: OPEN_STATUSES,
  OFFER_REJECTED: OPEN_STATUSES,
  REJECTED: OPEN_STATUSES,
  WITHDRAWN: OPEN_STATUSES,
  NO_RESPONSE: OPEN_STATUSES,
}
const canTransition = (from: ApplicationStatus, to: ApplicationStatus) =>
  from !== to && ALLOWED_TRANSITIONS[from].includes(to)

export const SAMPLE_TODAY = '2026-09-01'

export function sampleData(): Seed {
  return structuredClone(sampleSeed) as Seed
}

export function emptyData(): Seed {
  return { categories: [], companies: [], postings: [], applications: [], notes: [] }
}

export function createFakeBackend(seed: Seed = sampleData(), today = SAMPLE_TODAY) {
  const db = structuredClone(seed)
  let seq = 0
  const nextId = () => `ffffffff-0000-4000-8000-${String(++seq).padStart(12, '0')}`
  const now = () => `${today}T12:00:00`
  const DAY = 86_400_000
  const daysSince = (d: string | null) =>
    d ? Math.round((Date.parse(today) - Date.parse(d.slice(0, 10))) / DAY) : null

  const blank = (v: unknown) => typeof v === 'string' && !v.trim()

  /* ---------- Darstellungen ---------- */
  const company = (id: string) => db.companies.find((c) => c.id === id)
  const posting = (id: string) => db.postings.find((p) => p.id === id)
  const appFor = (postingId: string) => db.applications.find((a) => a.jobPostingId === postingId)
  const categoryName = (id: string | null) =>
    id ? (db.categories.find((c) => c.id === id)?.name ?? null) : null

  const companyCompact = (c: CompanyRow): CompanyCompact => ({
    id: c.id,
    name: c.name,
    jobsCount: db.postings.filter((p) => p.companyId === c.id).length,
  })
  const companyDetail = (c: CompanyRow): CompanyDetail => ({ ...c, jobsCount: companyCompact(c).jobsCount })
  const postingCompact = (p: PostingRow): JobPostingCompact => ({
    id: p.id,
    title: p.title,
    companyName: company(p.companyId)?.name ?? '',
    location: p.location,
    hasApplication: !!appFor(p.id),
    createdAt: p.createdAt,
  })
  const postingResponse = ({ companyId: _c, createdAt: _d, ...p }: PostingRow): JobPostingResponse => p
  const postingDetail = (p: PostingRow): JobPostingDetail => ({
    ...postingResponse(p),
    company: company(p.companyId)!,
    hasApplication: !!appFor(p.id),
    applicationId: appFor(p.id)?.id ?? null,
    createdAt: p.createdAt,
  })
  const appCompact = (a: ApplicationRow): ApplicationCompact => {
    const p = posting(a.jobPostingId)!
    return {
      id: a.id,
      jobTitle: p.title,
      companyName: company(p.companyId)?.name ?? '',
      status: a.status,
      priority: a.priority,
      appliedAt: a.appliedAt,
      daysSinceApplication: daysSince(a.appliedAt),
    }
  }
  const appDetail = (a: ApplicationRow): ApplicationDetail => {
    const p = posting(a.jobPostingId)!
    return {
      id: a.id,
      jobPosting: postingResponse(p),
      company: company(p.companyId)!,
      status: a.status,
      priority: a.priority,
      appliedAt: a.appliedAt,
      appliedVia: a.appliedVia,
      portalUrl: a.portalUrl,
      closedAt: a.closedAt,
    }
  }
  const appResponse = ({ jobPostingId: _p, ...a }: ApplicationRow): ApplicationResponse => a
  const noteApplication = (n: NoteRow) => {
    const a = n.applicationId ? db.applications.find((x) => x.id === n.applicationId) : undefined
    const p = a && posting(a.jobPostingId)
    return {
      applicationId: a ? a.id : null,
      jobTitle: p ? p.title : null,
      companyName: p ? (company(p.companyId)?.name ?? null) : null,
    }
  }
  const noteCompact = (n: NoteRow): NoteCompact => ({
    id: n.id,
    noteCategory: categoryName(n.categoryId),
    title: n.title,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
    ...noteApplication(n),
  })
  const noteDetail = (n: NoteRow): NoteDetail => ({
    ...noteCompact(n),
    content: n.content,
  })

  /* ---------- Fehler als ProblemDetail ---------- */
  type FieldErrors = Record<string, string[]>
  const problem = (status: number, title: string, detail: string, errors?: FieldErrors): FakeResponse => ({
    status,
    body: errors ? { status, title, detail, errors } : { status, title, detail },
  })
  const notFound = problem(404, 'Resource not found', 'The requested resource was not found.')
  const conflict = (detail: string) => problem(409, 'Conflict', detail)
  const serverError = problem(500, 'Internal server error', 'An unexpected error occurred.')
  const invalidBody = problem(
    400,
    'Invalid request body',
    'The request body is malformed or contains invalid values.',
  )
  const invalidParam = (name = 'id') =>
    problem(400, 'Invalid request parameter', `The request contains an invalid value for '${name}'.`)
  const invalidSort = (property: string) =>
    problem(400, 'Invalid sort property', `No property '${property}' found.`)
  const endpointNotFound = problem(404, 'Endpoint not found', 'No endpoint found for this path.')
  const invalidCombination = problem(
    400,
    'Invalid request combination',
    'The search parameter q cannot be combined with filters.',
  )
  /** 400 bei Feldfehlern, sonst null. */
  const validationProblem = (errors: FieldErrors) =>
    Object.keys(errors).length
      ? problem(400, 'Validation failed', 'The request contains invalid fields.', errors)
      : null

  /* ---------- Validierung (Bean Validation laut Vertrag) ---------- */
  type Rule = { required?: boolean; max?: number }
  /** Pflichtfelder dürfen nicht fehlen; vorhandene Strings nicht nur aus Leerzeichen bestehen. */
  const validate = (body: object, rules: Record<string, Rule>): FieldErrors => {
    const errors: FieldErrors = {}
    const add = (field: string, message: string) => (errors[field] ??= []).push(message)
    for (const [field, { required, max }] of Object.entries(rules)) {
      const value: unknown = (body as Record<string, unknown>)[field]
      if (value == null) {
        if (required) add(field, `The ${field} is required`)
      } else if (blank(value)) add(field, `The ${field} must not be blank`)
      else if (max && typeof value === 'string' && value.length > max)
        add(field, `The ${field} must be at most ${max} characters`)
    }
    return errors
  }
  const validateCompany = (b: CompanyRequest) =>
    validate(b, {
      name: { required: true, max: 255 },
      website: { max: 255 },
      street: { max: 255 },
      postalCode: { max: 20 },
      city: { max: 255 },
    })
  const validatePosting = (b: JobPostingRequest) => {
    const errors = validate(b, {
      title: { required: true, max: 255 },
      location: { max: 255 },
      url: { required: true, max: 1000 },
      status: { required: true },
    })
    if (b.publishedAt && b.publishedAt > today)
      errors.publishedAt = ['The publishedAt cannot be in the future']
    return errors
  }
  const validateNote = (b: NoteRequest) => validate(b, { title: { required: true, max: 255 } })
  const validateCategory = (b: NoteCategoryRequest) => validate(b, { name: { required: true, max: 255 } })

  /** Ungültige Enum-Werte scheitern schon beim Deserialisieren (400 ohne Feldfehler). */
  const invalidEnum = (value: unknown, allowed: readonly string[]) =>
    value != null && !allowed.includes(value as string)
  const POSTING_STATUSES = ['ACTIVE', 'INACTIVE'] as const
  const PRIORITIES = ['NONE', 'LOW', 'MEDIUM', 'HIGH'] as const
  const APPLICATION_STATUSES = [...OPEN_STATUSES, ...CLOSED] as const
  const CHANNELS = ['ONLINE', 'EMAIL', 'PHONE', 'IN_PERSON', 'POSTAL_MAIL', 'OTHER'] as const

  /** Namen von Firmen und Ordnern sind nach strip() unabhängig von Groß-/Kleinschreibung eindeutig. */
  const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()
  const companyNameTaken = (name: string, exceptId?: string) =>
    db.companies.some((c) => c.id !== exceptId && sameName(c.name, name))
  const categoryNameTaken = (name: string, exceptId?: string) =>
    db.categories.some((c) => c.id !== exceptId && sameName(c.name, name))
  const unknownCategory = (id: string | null | undefined) => !!id && !db.categories.some((c) => c.id === id)

  /* ---------- Paginierung und Sortierung ---------- */
  type SortValue = string | null
  /** Sortierbare Entity-Properties → Wert einer Zeile (Enums sortieren alphabetisch). */
  type Sortable<T> = Record<string, (row: T) => SortValue>
  const intParam = (q: URLSearchParams, name: string, fallback: number, valid: (n: number) => boolean) => {
    const raw = q.get(name)
    const n = raw !== null && /^-?\d+$/.test(raw.trim()) ? Number(raw) : NaN
    return Number.isInteger(n) && valid(n) ? n : fallback
  }
  /** Sortiert, schneidet die Seite aus und baut Page<T>; unbekannte Sortier-Property → 400. */
  const paginate = <T extends { id: string }, R>(
    rows: T[],
    q: URLSearchParams,
    sortable: Sortable<T>,
    defaultSort: string,
    map: (row: T) => R,
  ): FakeResponse => {
    const page = intParam(q, 'page', 0, (n) => n >= 0)
    const size = Math.min(
      100,
      intParam(q, 'size', 15, (n) => n >= 1),
    )
    const keys = (q.getAll('sort').length ? q.getAll('sort') : [defaultSort]).map((s) => {
      const [property = '', dir = 'asc'] = s.split(',').map((x) => x.trim())
      return { property, desc: dir.toLowerCase() === 'desc' }
    })
    const unknown = keys.find((k) => !(k.property in sortable))
    if (unknown) return invalidSort(unknown.property)
    // PostgreSQL: null bei asc zuletzt, bei desc zuerst; id als letzter Tie-Breaker
    const compare = (a: T, b: T) => {
      for (const { property, desc } of keys) {
        const x = sortable[property]!(a)
        const y = sortable[property]!(b)
        if (x === y) continue
        if (x === null) return desc ? -1 : 1
        if (y === null) return desc ? 1 : -1
        return (x < y ? -1 : 1) * (desc ? -1 : 1)
      }
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0
    }
    const sorted = rows.toSorted(compare)
    const body: Page<R> = {
      content: sorted.slice(page * size, (page + 1) * size).map(map),
      page,
      size,
      totalElements: sorted.length,
      totalPages: Math.ceil(sorted.length / size),
    }
    return ok(body)
  }
  /** Suche `q`: getrimmt, klein geschrieben; '' = keine Suche. */
  const searchParam = (q: URLSearchParams) => (q.get('q') ?? '').trim().toLowerCase()
  /** Enthält einer der Texte den Suchbegriff (ohne Groß-/Kleinschreibung)? */
  const matchesSearch = (search: string, ...texts: (string | null | undefined)[]) =>
    texts.some((t) => !!t && t.toLowerCase().includes(search))
  /** Optionaler Enum-Query-Parameter: undefined = nicht gesetzt, null = ungültig. */
  const enumParam = <E extends string>(q: URLSearchParams, name: string, allowed: readonly E[]) => {
    const raw = q.get(name)
    if (raw === null) return undefined
    return allowed.includes(raw as E) ? (raw as E) : null
  }

  const companySortable: Sortable<CompanyRow> = {
    name: (c) => c.name,
    city: (c) => c.city,
    postalCode: (c) => c.postalCode,
    street: (c) => c.street,
    website: (c) => c.website,
    createdAt: () => null,
    updatedAt: () => null,
  }
  const postingSortable: Sortable<PostingRow> = {
    title: (p) => p.title,
    location: (p) => p.location,
    status: (p) => p.status,
    publishedAt: (p) => p.publishedAt,
    archivedAt: (p) => p.archivedAt,
    createdAt: (p) => p.createdAt,
    updatedAt: (p) => p.createdAt,
    'company.name': (p) => company(p.companyId)?.name ?? null,
  }
  const appSortable: Sortable<ApplicationRow> = {
    status: (a) => a.status,
    priority: (a) => a.priority,
    appliedAt: (a) => a.appliedAt,
    closedAt: (a) => a.closedAt,
    createdAt: (a) => a.createdAt,
    updatedAt: (a) => a.createdAt,
    'jobPosting.title': (a) => posting(a.jobPostingId)?.title ?? null,
    'jobPosting.company.name': (a) => {
      const p = posting(a.jobPostingId)
      return p ? (company(p.companyId)?.name ?? null) : null
    },
  }
  const noteSortable: Sortable<NoteRow> = {
    title: (n) => n.title,
    createdAt: (n) => n.createdAt,
    updatedAt: (n) => n.updatedAt,
  }
  const POSTING_FILTERS: readonly JobPostingFilter[] = ['ALL', 'INACTIVE', 'ARCHIVED', 'OPEN', 'APPLIED']
  const matchesPostingFilter = (p: PostingRow, filter: JobPostingFilter) => {
    if (filter === 'INACTIVE') return p.status === 'INACTIVE'
    if (filter === 'ARCHIVED') return p.archivedAt !== null
    if (filter === 'OPEN') return p.status === 'ACTIVE' && p.archivedAt === null && !appFor(p.id)
    if (filter === 'APPLIED') return !!appFor(p.id)
    return true
  }

  /* ---------- Routen ---------- */
  type Handler = (params: string[], body: unknown, query: URLSearchParams) => FakeResponse
  const ok = (body: unknown, status = 200): FakeResponse => ({ status, body })
  const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  /** Optionaler UUID-Query-Parameter: undefined = nicht gesetzt, null = ungültig. */
  const uuidParam = (q: URLSearchParams, name: string) => {
    const raw = q.get(name)
    if (raw === null || raw === '') return undefined
    return UUID.test(raw) ? raw : null
  }
  const unknownApplication = (id: string | null | undefined) =>
    !!id && !db.applications.some((a) => a.id === id)

  const routes: [string, RegExp, Handler][] = [
    [
      'GET',
      /^\/companies$/,
      (_p, _b, q) => {
        const search = searchParam(q)
        const rows = search ? db.companies.filter((c) => matchesSearch(search, c.name)) : db.companies
        return paginate(rows, q, companySortable, 'name,asc', companyCompact)
      },
    ],
    [
      'GET',
      /^\/companies\/([^/]+)$/,
      ([id]) => {
        const c = company(id!)
        return c ? ok(companyDetail(c)) : notFound
      },
    ],
    [
      'POST',
      /^\/companies$/,
      (_p, body) => {
        const b = body as CompanyRequest
        const invalid = validationProblem(validateCompany(b))
        if (invalid) return invalid
        if (companyNameTaken(b.name)) return conflict(`Company with name ${b.name.trim()} already exists.`)
        const c: CompanyRow = {
          id: nextId(),
          name: b.name.trim(),
          website: b.website ?? null,
          street: b.street ?? null,
          postalCode: b.postalCode ?? null,
          city: b.city ?? null,
        }
        db.companies.push(c)
        return ok(c, 201)
      },
    ],
    [
      'PUT',
      /^\/companies\/([^/]+)$/,
      ([id], body) => {
        const c = company(id!)
        const b = body as CompanyRequest
        if (!c) return notFound
        const invalid = validationProblem(validateCompany(b))
        if (invalid) return invalid
        if (companyNameTaken(b.name, c.id))
          return conflict(`Company with name ${b.name.trim()} already exists.`)
        Object.assign(c, { website: null, street: null, postalCode: null, city: null }, b, {
          name: b.name.trim(),
        })
        return ok(c)
      },
    ],
    [
      'GET',
      /^\/companies\/([^/]+)\/job-postings$/,
      ([id], _b, q) =>
        company(id!)
          ? paginate(
              db.postings.filter((p) => p.companyId === id),
              q,
              postingSortable,
              'createdAt,desc',
              postingCompact,
            )
          : notFound,
    ],
    [
      'POST',
      /^\/companies\/([^/]+)\/job-postings$/,
      ([id], body) => {
        const b = body as JobPostingRequest
        if (invalidEnum(b.status, POSTING_STATUSES)) return invalidBody
        if (!company(id!)) return notFound
        const invalid = validationProblem(validatePosting(b))
        if (invalid) return invalid
        const p: PostingRow = {
          id: nextId(),
          companyId: id!,
          title: b.title.trim(),
          description: b.description ?? null,
          location: b.location ?? null,
          url: b.url,
          status: b.status,
          publishedAt: b.publishedAt ?? null,
          createdAt: now(),
          archivedAt: null,
        }
        db.postings.push(p)
        return ok(postingResponse(p), 201)
      },
    ],
    [
      'GET',
      /^\/job-postings$/,
      (_p, _b, q) => {
        const filter = enumParam(q, 'filter', POSTING_FILTERS) ?? (q.has('filter') ? null : 'ALL')
        if (!filter) return invalidParam('filter')
        const search = searchParam(q)
        if (search && filter !== 'ALL') return invalidCombination
        const rows = db.postings.filter(
          (p) =>
            matchesPostingFilter(p, filter) &&
            (!search || matchesSearch(search, p.title, company(p.companyId)?.name)),
        )
        return paginate(rows, q, postingSortable, 'createdAt,desc', postingCompact)
      },
    ],
    [
      'GET',
      /^\/job-postings\/([^/]+)$/,
      ([id]) => {
        const p = posting(id!)
        return p ? ok(postingDetail(p)) : notFound
      },
    ],
    [
      'PUT',
      /^\/job-postings\/([^/]+)$/,
      ([id], body) => {
        const p = posting(id!)
        const b = body as JobPostingRequest
        if (invalidEnum(b.status, POSTING_STATUSES)) return invalidBody
        if (!p) return notFound
        const invalid = validationProblem(validatePosting(b))
        if (invalid) return invalid
        const { title, description, location, url, status, publishedAt } = b
        Object.assign(p, { title, description: description ?? null, location: location ?? null, url, status })
        p.publishedAt = publishedAt ?? null
        return ok(postingResponse(p))
      },
    ],
    [
      'PATCH',
      /^\/job-postings\/([^/]+)\/archive$/,
      ([id], body) => {
        const p = posting(id!)
        const b = body as Partial<JobPostingArchiveRequest>
        if (b.archived != null && typeof b.archived !== 'boolean') return invalidBody
        if (!p) return notFound
        if (b.archived == null) return validationProblem({ archived: ['The archived is required'] })!
        if (b.archived && p.archivedAt) return conflict('The job posting is already archived.')
        if (!b.archived && !p.archivedAt) return conflict('The job posting is not archived.')
        if (b.archived && appFor(p.id))
          return conflict('A job posting with an application cannot be archived.')
        p.archivedAt = b.archived ? today : null
        return ok(postingResponse(p))
      },
    ],
    [
      'POST',
      /^\/job-postings\/([^/]+)\/applications$/,
      ([id]) => {
        const p = posting(id!)
        if (!p) return notFound
        if (appFor(id!)) return conflict('An application already exists for this job posting.')
        if (p.archivedAt) return conflict('An archived job posting cannot get an application.')
        const a: ApplicationRow = {
          id: nextId(),
          jobPostingId: id!,
          status: 'IN_PROGRESS',
          priority: 'NONE',
          appliedAt: null,
          appliedVia: null,
          portalUrl: null,
          closedAt: null,
          createdAt: now(),
        }
        db.applications.push(a)
        return ok(appResponse(a), 201)
      },
    ],
    [
      'GET',
      /^\/applications$/,
      (_p, _b, q) => {
        const status = enumParam(q, 'status', APPLICATION_STATUSES)
        const priority = enumParam(q, 'priority', PRIORITIES)
        if (status === null) return invalidParam('status')
        if (priority === null) return invalidParam('priority')
        const search = searchParam(q)
        if (search && (status || priority)) return invalidCombination
        const matches = (a: ApplicationRow) => {
          const p = posting(a.jobPostingId)
          return matchesSearch(search, p?.title, p && company(p.companyId)?.name)
        }
        const rows = db.applications.filter(
          (a) =>
            (!status || a.status === status) &&
            (!priority || a.priority === priority) &&
            (!search || matches(a)),
        )
        return paginate(rows, q, appSortable, 'createdAt,desc', appCompact)
      },
    ],
    [
      'GET',
      /^\/applications\/([^/]+)$/,
      ([id]) => {
        const a = db.applications.find((x) => x.id === id)
        return a ? ok(appDetail(a)) : notFound
      },
    ],
    [
      'PATCH',
      /^\/applications\/([^/]+)$/,
      ([id], body) => {
        const a = db.applications.find((x) => x.id === id)
        const b = body as ApplicationPatch
        if (
          invalidEnum(b.status, APPLICATION_STATUSES) ||
          invalidEnum(b.priority, PRIORITIES) ||
          invalidEnum(b.appliedVia, CHANNELS)
        )
          return invalidBody
        if (!a) return notFound
        const invalid = validationProblem(validate(b, { portalUrl: { max: 1000 } }))
        if (invalid) return invalid
        // Unerlaubter Wechsel: der ganze PATCH wird abgelehnt
        if (b.status && !canTransition(a.status, b.status))
          return conflict(`Status transition from ${a.status} to ${b.status} is not allowed.`)
        if (b.priority) a.priority = b.priority
        if (b.appliedVia) a.appliedVia = b.appliedVia
        if (b.portalUrl) a.portalUrl = b.portalUrl
        if (b.status) {
          a.status = b.status
          // Zurück nach „In Bearbeitung“: Datum, Weg und Link werden geleert (auch wenn mitgesendet)
          if (b.status === 'IN_PROGRESS') {
            a.appliedAt = null
            a.appliedVia = null
            a.portalUrl = null
          }
          if (b.status === 'APPLIED') a.appliedAt ??= today
          a.closedAt = CLOSED.has(b.status) ? (a.closedAt ?? today) : null
        }
        return ok(appResponse(a))
      },
    ],
    [
      'GET',
      /^\/notes$/,
      (_p, _b, q) => {
        const categoryId = uuidParam(q, 'noteCategoryId')
        const applicationId = uuidParam(q, 'applicationId')
        if (categoryId === null) return invalidParam('noteCategoryId')
        if (applicationId === null) return invalidParam('applicationId')
        const search = searchParam(q)
        // applicationId + noteCategoryId sind kombinierbar (Ordner-Tabs im Notizen-Panel einer Bewerbung)
        if (search && (categoryId || applicationId)) return invalidCombination
        const rows = db.notes.filter(
          (n) =>
            (!categoryId || n.categoryId === categoryId) &&
            (!applicationId || n.applicationId === applicationId) &&
            (!search || matchesSearch(search, n.title, n.content)),
        )
        return paginate(rows, q, noteSortable, 'createdAt,desc', noteCompact)
      },
    ],
    [
      'POST',
      /^\/notes$/,
      (_p, body) => {
        const b = body as NoteRequest
        const invalid = validationProblem(validateNote(b))
        if (invalid) return invalid
        if (unknownCategory(b.noteCategoryId) || unknownApplication(b.applicationId)) return notFound
        const n: NoteRow = {
          id: nextId(),
          applicationId: b.applicationId ?? null,
          categoryId: b.noteCategoryId ?? null,
          title: b.title.trim(),
          content: b.content ?? null,
          createdAt: now(),
          updatedAt: now(),
        }
        db.notes.push(n)
        return ok(noteDetail(n), 201)
      },
    ],
    [
      'GET',
      /^\/notes\/([^/]+)$/,
      ([id]) => {
        const n = db.notes.find((x) => x.id === id)
        return n ? ok(noteDetail(n)) : notFound
      },
    ],
    [
      'PUT',
      /^\/notes\/([^/]+)$/,
      ([id], body) => {
        const n = db.notes.find((x) => x.id === id)
        const b = body as NoteRequest
        if (!n) return notFound
        const invalid = validationProblem(validateNote(b))
        if (invalid) return invalid
        if (unknownCategory(b.noteCategoryId) || unknownApplication(b.applicationId)) return notFound
        Object.assign(n, {
          title: b.title.trim(),
          content: b.content ?? null,
          categoryId: b.noteCategoryId ?? null,
          applicationId: b.applicationId ?? null,
          updatedAt: now(),
        })
        return ok(noteDetail(n))
      },
    ],
    [
      'DELETE',
      /^\/notes\/([^/]+)$/,
      ([id]) => {
        const i = db.notes.findIndex((x) => x.id === id)
        if (i < 0) return notFound
        db.notes.splice(i, 1)
        return { status: 204 }
      },
    ],
    ['GET', /^\/note-categories$/, () => ok(db.categories)],
    [
      'GET',
      /^\/note-categories\/([^/]+)$/,
      ([id]) => {
        const c = db.categories.find((x) => x.id === id)
        return c ? ok(c) : notFound
      },
    ],
    [
      'POST',
      /^\/note-categories$/,
      (_p, body) => {
        const b = body as NoteCategoryRequest
        const invalid = validationProblem(validateCategory(b))
        if (invalid) return invalid
        if (categoryNameTaken(b.name))
          return conflict(`Note category with name ${b.name.trim()} already exists.`)
        const c = { id: nextId(), name: b.name.trim() }
        db.categories.push(c)
        return ok(c, 201)
      },
    ],
    [
      'PUT',
      /^\/note-categories\/([^/]+)$/,
      ([id], body) => {
        const c = db.categories.find((x) => x.id === id)
        const b = body as NoteCategoryRequest
        if (!c) return notFound
        const invalid = validationProblem(validateCategory(b))
        if (invalid) return invalid
        if (categoryNameTaken(b.name, c.id))
          return conflict(`Note category with name ${b.name.trim()} already exists.`)
        c.name = b.name.trim()
        return ok(c)
      },
    ],
    [
      'DELETE',
      /^\/note-categories\/([^/]+)$/,
      ([id]) => {
        const i = db.categories.findIndex((x) => x.id === id)
        if (i < 0) return notFound
        db.categories.splice(i, 1)
        db.notes.forEach((n) => {
          if (n.categoryId === id) n.categoryId = null
        })
        return { status: 204 }
      },
    ],
  ]

  return {
    db,
    /** Pfad ohne /api-Präfix, optional mit Query, z. B. "/applications?status=APPLIED" */
    handle(method: string, pathWithQuery: string, body?: unknown): FakeResponse {
      const [path = '', search = ''] = pathWithQuery.split('?')
      const query = new URLSearchParams(search)
      let pathExists = false
      for (const [m, re, handler] of routes) {
        const match = re.exec(path)
        if (!match) continue
        pathExists = true
        if (m !== method) continue
        const params = match.slice(1).map(decodeURIComponent)
        if (!params.every((p) => UUID.test(p))) return invalidParam()
        return handler(params, body ?? {}, query)
      }
      // Unbekannter Pfad: 404; nicht unterstützte Methode auf bekanntem Pfad: 500
      return pathExists ? serverError : endpointNotFound
    },
  }
}

export type FakeBackend = ReturnType<typeof createFakeBackend>
