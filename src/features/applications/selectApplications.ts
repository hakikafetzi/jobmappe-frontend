// Filter und Sortierung der Bewerbungen übernimmt das Backend; hier nur URL-Parser und die
// Zuordnung der Tabellen-Sortierung zu Backend-Properties.
import type { ApplicationPriority, ApplicationStatus } from '../../api/types'
import type { ApplicationsView, TableSort, TableSortKey } from '../../app/paths'
import { PRIORITY_OPTIONS, STATUS_ORDER } from '../../domain/labels'

export type PriorityFilter = ApplicationPriority | 'all'
/** Das Backend filtert nur nach genau einem Status. */
export type StatusFilter = ApplicationStatus | 'all'

export const DEFAULT_TABLE_SORT: TableSort = { key: 'days', dir: -1 }

/** `?ansicht=tabelle|kanban`; fehlt oder ungültig → `fallback` (gespeicherte Standardansicht) */
export function parseApplicationsView(value: string | null, fallback: ApplicationsView): ApplicationsView {
  if (value === 'tabelle') return 'table'
  if (value === 'kanban') return 'board'
  return fallback
}

export function parseStatusFilter(value: string | null): StatusFilter {
  return STATUS_ORDER.includes(value as ApplicationStatus) ? (value as ApplicationStatus) : 'all'
}

export function parsePriorityFilter(value: string | null): PriorityFilter {
  return PRIORITY_OPTIONS.includes(value as ApplicationPriority) ? (value as ApplicationPriority) : 'all'
}

const SORT_KEYS: readonly TableSortKey[] = ['title', 'status', 'priority', 'applied', 'days']

/** `?sortierung=<key>-auf|ab`; Ungültiges ergibt die Standardsortierung. */
export function parseTableSort(value: string | null): TableSort {
  const [key, dir] = value?.split('-') ?? []
  if (!SORT_KEYS.includes(key as TableSortKey) || (dir !== 'auf' && dir !== 'ab')) return DEFAULT_TABLE_SORT
  return { key: key as TableSortKey, dir: dir === 'auf' ? 1 : -1 }
}

const SORT_PROPERTY: Record<TableSortKey, string> = {
  title: 'jobPosting.title',
  status: 'status',
  priority: 'priority',
  applied: 'appliedAt',
  // „Wartet“ = Tage seit appliedAt: je länger, desto früher das Datum
  days: 'appliedAt',
}

/** Sortierung der Tabelle als Backend-`sort` (Status/Priorität sortiert es nach Enum-Namen). */
export function apiTableSort({ key, dir }: TableSort): string {
  const ascending = key === 'days' ? dir === -1 : dir === 1
  return `${SORT_PROPERTY[key]},${ascending ? 'asc' : 'desc'}`
}
