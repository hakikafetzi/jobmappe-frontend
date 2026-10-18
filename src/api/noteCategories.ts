import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { http, seg } from './client'
import type { MutationErrorMeta } from './errors'
import { queryKeys } from './queryKeys'
import type { NoteCategory, NoteCategoryRequest } from './types'

const noteCategoriesApi = {
  list: () => http.get<NoteCategory[]>('/note-categories'),
  create: (body: NoteCategoryRequest) => http.post<NoteCategory>('/note-categories', body),
  update: (id: string, body: NoteCategoryRequest) =>
    http.put<NoteCategory>(`/note-categories/${seg(id)}`, body),
  delete: (id: string) => http.delete(`/note-categories/${seg(id)}`),
}

export const useCategories = () =>
  useQuery({ queryKey: queryKeys.categories.all, queryFn: noteCategoriesApi.list })

/** Notizen tragen den Kategorienamen — nach Änderungen an Kategorien auch sie neu laden. */
const invalidateCategoryData = (qc: QueryClient) =>
  Promise.all([
    qc.invalidateQueries({ queryKey: queryKeys.categories.all }),
    qc.invalidateQueries({
      predicate: (q) => q.queryKey[0] === 'notes' || q.queryKey.at(-1) === 'notes',
    }),
  ])

/** Fehlerbehandlung von useSaveCategory; das Formular zeigt Feldfehler und 409 selbst an. */
export const saveCategoryMeta = {
  errorMessage: 'Der Ordner konnte nicht gespeichert werden',
  inlineFields: ['name'],
  conflictField: 'name',
  conflictMessage: 'Einen Ordner mit diesem Namen gibt es bereits.',
} as const satisfies MutationErrorMeta

export function useSaveCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string | null; body: NoteCategoryRequest }) =>
      id ? noteCategoriesApi.update(id, body) : noteCategoriesApi.create(body),
    meta: saveCategoryMeta,
    onSettled: () => invalidateCategoryData(qc),
  })
}

export function useDeleteCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: noteCategoriesApi.delete,
    meta: { errorMessage: 'Der Ordner konnte nicht gelöscht werden' },
    onSettled: () => invalidateCategoryData(qc),
  })
}
