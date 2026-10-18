import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { http, seg, withParams } from './client'
import { announceNoteChanged } from './notesSync'
import { nextPageParam, PAGE_SIZE } from './pagination'
import { queryKeys } from './queryKeys'
import type { NoteCompact, NoteDetail, NoteListFilter, NoteListParams, NoteRequest, Page } from './types'

export const notesApi = {
  list: (params: NoteListParams) => http.get<Page<NoteCompact>>(withParams('/notes', params)),
  get: (id: string) => http.get<NoteDetail>(`/notes/${seg(id)}`),
  create: (body: NoteRequest) => http.post<NoteDetail>('/notes', body),
  update: (id: string, body: NoteRequest) => http.put<NoteDetail>(`/notes/${seg(id)}`, body),
  delete: (id: string) => http.delete(`/notes/${seg(id)}`),
}

/** Eine Seite der Notizen (Notizen-Seite mit Pager); Filter und Sortierung übernimmt das Backend. */
export const useNotesPage = (params: NoteListParams, enabled = true) =>
  useQuery({
    queryKey: queryKeys.notes.list(params),
    queryFn: () => notesApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  })

/** Notizen seitenweise zum Nachladen („Mehr laden“): Panel einer Bewerbung, Vollbild-Seitenleiste. */
export const useNotesInfinite = (params: NoteListFilter & { sort?: readonly string[] }, enabled = true) =>
  useInfiniteQuery({
    queryKey: queryKeys.notes.infinite(params),
    queryFn: ({ pageParam }) => notesApi.list({ ...params, page: pageParam, size: PAGE_SIZE }),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
    enabled,
    placeholderData: keepPreviousData,
  })

/**
 * Notizen, deren Titel oder Inhalt `q` enthält (ohne Filter), neueste zuerst; weitere Seiten über
 * fetchNextPage. Ohne Suchbegriff lädt nichts.
 */
export const useNotesSearch = (q: string) =>
  useInfiniteQuery({
    queryKey: queryKeys.notes.infinite({ q, sort: ['createdAt,desc'] }),
    queryFn: ({ pageParam }) =>
      notesApi.list({ q, page: pageParam, size: PAGE_SIZE, sort: ['createdAt,desc'] }),
    initialPageParam: 0,
    getNextPageParam: nextPageParam,
    enabled: q !== '',
    placeholderData: keepPreviousData,
  })

export const useNote = (id: string | null) =>
  useQuery({
    queryKey: queryKeys.notes.detail(id ?? ''),
    queryFn: () => notesApi.get(id!),
    enabled: id !== null,
  })

export function useSaveNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ noteId, body }: { noteId: string | null; body: NoteRequest }) =>
      noteId ? notesApi.update(noteId, body) : notesApi.create(body),
    meta: { errorMessage: 'Die Notiz konnte nicht gespeichert werden', inlineFields: ['title'] },
    onSuccess: (note) => {
      qc.setQueryData(queryKeys.notes.detail(note.id), note)
      // Die PUT-Antwort kann noch das alte updatedAt tragen: Detail neu laden
      void qc.invalidateQueries({ queryKey: queryKeys.notes.detail(note.id) })
      announceNoteChanged({ noteId: note.id })
    },
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.notes.lists }),
  })
}

export function useDeleteNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: notesApi.delete,
    meta: { errorMessage: 'Die Notiz konnte nicht gelöscht werden' },
    onSuccess: (_, noteId) => announceNoteChanged({ noteId }),
    // Das Detail der Notiz nicht entfernen: Der offene Dialog beobachtet es noch und würde sie
    // neu laden (404), statt sich zu schließen. Nach dem Schließen räumt der GC es ab.
    onSettled: () => qc.invalidateQueries({ queryKey: queryKeys.notes.lists }),
  })
}
