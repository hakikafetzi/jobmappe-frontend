// Standardansicht der Bewerbungen (Kanban/Tabelle) und Notizen (Galerie/Tabelle). Wie Erscheinungsbild
// und Animationen rein clientseitig: Nur die abweichende Wahl „Tabelle“ liegt im localStorage. Gilt,
// wenn die URL keine Ansicht nennt (`?ansicht=`).
import { useSyncExternalStore } from 'react'
import type { ApplicationsView, NotesView } from '../../app/paths'

export const APPLICATIONS_VIEW_KEY = 'jobmappe.applicationsView'
export const NOTES_VIEW_KEY = 'jobmappe.notesView'

/** Gespeicherte Ansicht mit Standardwert `fallback`; gespeichert wird nur `alternative`. */
function viewPreference<V extends string>(key: string, fallback: V, alternative: V) {
  const read = (): V => {
    try {
      return localStorage.getItem(key) === alternative ? alternative : fallback
    } catch {
      // localStorage kann gesperrt sein (z. B. private Fenster mancher Browser)
      return fallback
    }
  }

  const listeners = new Set<() => void>()
  const notify = () => listeners.forEach((listener) => listener())

  const set = (view: V) => {
    try {
      if (view === alternative) localStorage.setItem(key, alternative)
      else localStorage.removeItem(key)
    } catch {
      // Nicht speicherbar: gilt dann nur für diese Sitzung
    }
    notify()
  }

  // Wahl aus einem anderen Tab übernehmen (key null = localStorage geleert)
  const onStorage = (e: StorageEvent) => {
    if (e.key === key || e.key === null) notify()
  }

  const subscribe = (onChange: () => void) => {
    if (listeners.size === 0) window.addEventListener('storage', onStorage)
    listeners.add(onChange)
    return () => {
      listeners.delete(onChange)
      if (listeners.size === 0) window.removeEventListener('storage', onStorage)
    }
  }

  const useView = (): [V, (view: V) => void] => [useSyncExternalStore(subscribe, read, () => fallback), set]
  return { read, set, useView }
}

const applicationsView = viewPreference<ApplicationsView>(APPLICATIONS_VIEW_KEY, 'board', 'table')
const notesView = viewPreference<NotesView>(NOTES_VIEW_KEY, 'gallery', 'table')

export const readDefaultApplicationsView = applicationsView.read
export const readDefaultNotesView = notesView.read

/** Standardansicht der Bewerbungen samt Setter. */
export const useDefaultApplicationsView = applicationsView.useView
/** Standardansicht der Notizen samt Setter. */
export const useDefaultNotesView = notesView.useView
