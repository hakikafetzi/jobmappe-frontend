// Dünner fetch-Wrapper. Fehler liefert das Backend als Spring ProblemDetail;
// daraus werden Status, Titel und Feldfehler übernommen. `detail` ist englischer Freitext und wird
// bewusst nicht gelesen — die UI leitet ihre deutschen Texte aus Status und Feldnamen ab (errors.ts).

import type { ApiProblem } from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'

export class ApiError extends Error {
  /** HTTP-Status; 0 = Backend nicht erreichbar. */
  readonly status: number
  /** `title` des ProblemDetail, falls vorhanden. */
  readonly title: string | null
  /** Feldfehler einer fehlgeschlagenen Validierung (JSON-Property → Meldungen); sonst leer. */
  readonly fieldErrors: Readonly<Record<string, string[]>>

  constructor(status: number, message: string, problem?: Partial<ApiProblem>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.title = problem?.title ?? null
    this.fieldErrors = problem?.errors ?? {}
  }
}

/** Liest den Fehler-Body defensiv: Proxys o. Ä. liefern evtl. kein (gültiges) JSON. */
async function readProblem(res: Response): Promise<Partial<ApiProblem>> {
  try {
    const body: unknown = await res.json()
    if (typeof body !== 'object' || body === null) return {}
    const { title, errors } = body as Record<string, unknown>
    return {
      title: typeof title === 'string' ? title : undefined,
      errors: isFieldErrors(errors) ? errors : undefined,
    }
  } catch {
    return {}
  }
}

function isFieldErrors(value: unknown): value is Record<string, string[]> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((v) => Array.isArray(v) && v.every((m) => typeof m === 'string'))
  )
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(BASE_URL + path, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Das Backend ist nicht erreichbar.')
  }
  if (!res.ok)
    throw new ApiError(res.status, `Anfrage fehlgeschlagen (${res.status})`, await readProblem(res))
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

export const http = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body: unknown) => request<T>('PATCH', path, body),
  delete: (path: string) => request<void>('DELETE', path),
}

/** Pfad-Segment sicher kodieren. */
export const seg = encodeURIComponent

type QueryValue = string | number | readonly string[] | undefined

/** Hängt Query-Parameter an; leere Werte fallen weg, Arrays (z. B. `sort`) werden wiederholt. */
export function withParams(path: string, params: Record<string, QueryValue>): string {
  const q = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue
    if (typeof value === 'object') value.forEach((v) => q.append(key, v))
    else q.set(key, String(value))
  }
  const s = q.toString()
  return s ? `${path}?${s}` : path
}
