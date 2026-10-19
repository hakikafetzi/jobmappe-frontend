// DTOs exakt nach dem API-Vertrag des Backends (v1, Commit 77c61dc, paginierte Listen).

export type JobPostingStatus = 'ACTIVE' | 'INACTIVE'

export type ApplicationStatus =
  | 'IN_PROGRESS'
  | 'APPLIED'
  | 'INTERVIEW'
  | 'WAITING'
  | 'OFFER'
  | 'OFFER_ACCEPTED'
  | 'OFFER_REJECTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'NO_RESPONSE'

export type ApplicationPriority = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH'

export type ApplicationChannel = 'ONLINE' | 'EMAIL' | 'PHONE' | 'IN_PERSON' | 'POSTAL_MAIL' | 'OTHER'

/* ---------- Paginierung ---------- */

/** Eine Seite einer paginierten Liste; `page` ist 0-basiert. */
export type Page<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

/** Query-Parameter paginierter Listen. `sort`: „property“ oder „property,asc|desc“, erster hat Vorrang. */
export type PageParams = {
  page?: number
  size?: number
  sort?: readonly string[]
}

/** Filter von GET /job-postings (genau ein Wert). */
export type JobPostingFilter = 'ALL' | 'INACTIVE' | 'ARCHIVED' | 'OPEN' | 'APPLIED'

/** Textsuche `q`: getrimmt und nicht leer, sonst weglassen. */
export type CompanyListParams = PageParams & { q?: string }

/** Suche und Filter schließen sich aus: `q` nur mit `filter` ALL bzw. ohne. */
export type PostingListParams = PageParams &
  ({ filter?: JobPostingFilter; q?: never } | { filter?: 'ALL'; q?: string })

/**
 * Filter von GET /applications; beide optional, kombiniert per UND. Die Suche `q` lässt sich mit
 * keinem der beiden kombinieren.
 */
export type ApplicationListParams = PageParams &
  (
    | { status?: ApplicationStatus; priority?: ApplicationPriority; q?: never }
    | { status?: never; priority?: never; q?: string }
  )

/**
 * Filter von GET /notes. Die Suche `q` lässt sich mit keinem Filter kombinieren.
 * `applicationId` + `noteCategoryId` zusammen nutzt das Notizen-Panel einer Bewerbung (Ordner-Tabs).
 */
export type NoteListFilter =
  | { noteCategoryId?: string; applicationId?: string; q?: never }
  | { noteCategoryId?: never; applicationId?: never; q?: string }

export type NoteListParams = PageParams & NoteListFilter

/* ---------- Fehler ---------- */

/** Spring ProblemDetail; `errors` nur bei fehlgeschlagener Validierung. */
export type ApiProblem = {
  status: number
  title: string
  detail: string
  errors?: Record<string, string[]>
}

/* ---------- Companies ---------- */

export type CompanyCompact = {
  id: string
  name: string
  jobsCount: number
}

export type CompanyDetail = {
  id: string
  name: string
  website: string | null
  street: string | null
  postalCode: string | null
  city: string | null
  jobsCount: number
}

/** Eingebettet in JobPostingDetail und ApplicationDetail. */
export type CompanySummary = {
  id: string
  name: string
  website: string | null
  street: string | null
  postalCode: string | null
  city: string | null
}

export type CompanyRequest = {
  name: string
  website?: string | null
  street?: string | null
  postalCode?: string | null
  city?: string | null
}

/* ---------- Job Postings ---------- */

export type JobPostingCompact = {
  id: string
  title: string
  companyName: string
  location: string | null
  hasApplication: boolean
  createdAt: string
}

export type JobPostingDetail = {
  id: string
  company: CompanySummary
  title: string
  description: string | null
  location: string | null
  url: string
  status: JobPostingStatus
  /** Bewerbung zu dieser Stelle, `null` ohne Bewerbung. */
  applicationId: string | null
  publishedAt: string | null
  createdAt: string
  /** Archiviert am (LocalDate), `null` = nicht archiviert. Die Listen kennen das nicht. */
  archivedAt: string | null
}

/** Eingebettet in ApplicationDetail. */
export type JobPostingSummary = {
  id: string
  title: string
  description: string | null
  location: string | null
  url: string
  status: JobPostingStatus
  publishedAt: string | null
  archivedAt: string | null
}

export type JobPostingRequest = {
  title: string
  description?: string | null
  location?: string | null
  url: string
  status: JobPostingStatus
  publishedAt?: string | null
}

export type JobPostingArchiveRequest = {
  archived: boolean
}

/* ---------- Applications ---------- */

export type ApplicationCompact = {
  id: string
  jobTitle: string
  companyName: string
  status: ApplicationStatus
  priority: ApplicationPriority
  appliedAt: string | null
  daysSinceApplication: number | null
}

export type ApplicationDetail = {
  id: string
  jobPosting: JobPostingSummary
  company: CompanySummary
  status: ApplicationStatus
  priority: ApplicationPriority
  appliedAt: string | null
  appliedVia: ApplicationChannel | null
  portalUrl: string | null
  closedAt: string | null
  createdAt: string
}

/** Nur gesendete Felder ändern sich; `appliedVia`/`portalUrl` leert nur der Wechsel nach IN_PROGRESS. */
export type ApplicationPatch = {
  status?: ApplicationStatus
  priority?: ApplicationPriority
  appliedVia?: ApplicationChannel
  portalUrl?: string
}

/* ---------- Notes ---------- */

/** `noteCategory` ist der Kategorie*name*; Requests nehmen die ID (`noteCategoryId`). */
export type NoteCompact = {
  id: string
  noteCategory: string | null
  title: string
  createdAt: string
  updatedAt: string
  /** null = keiner Bewerbung zugeordnet; dann sind auch `jobTitle` und `companyName` null */
  applicationId: string | null
  jobTitle: string | null
  companyName: string | null
}

export type NoteDetail = {
  id: string
  noteCategory: string | null
  title: string
  content: string | null
  createdAt: string
  updatedAt: string
  applicationId: string | null
  jobTitle: string | null
  companyName: string | null
}

/** Vollupdate: `applicationId`/`noteCategoryId` null oder fehlend heben Zuordnung bzw. Ordner auf. */
export type NoteRequest = {
  applicationId?: string | null
  noteCategoryId?: string | null
  title: string
  content?: string | null
}

/* ---------- Note Categories ---------- */

export type NoteCategory = {
  id: string
  name: string
}

export type NoteCategoryRequest = {
  name: string
}
