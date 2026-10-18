import type { ReactNode } from 'react'
import { isRouteErrorResponse, useRouteError } from 'react-router'
import { ButtonLink } from '../shared/ui/Button'
import { useDocumentTitle } from '../shared/hooks/useDocumentTitle'
import { EmptyState } from '../shared/ui/EmptyState'
import { AlertIcon, SearchIcon } from '../shared/ui/icons'
import { paths } from './paths'

function ErrorPage({ title, text, icon }: { title: string; text: string; icon: ReactNode }) {
  useDocumentTitle(title)
  return (
    <EmptyState
      large
      fill
      icon={icon}
      title={title}
      actions={<ButtonLink to={paths.home()}>Zur Startseite</ButtonLink>}
    >
      {text}
    </EmptyState>
  )
}

/** errorElement des Routers: Fehler beim Laden oder Anzeigen einer Seite. */
export function RouteError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />
  console.error(error)
  return (
    <ErrorPage
      icon={<AlertIcon />}
      title="Etwas ist schiefgelaufen"
      text="Beim Anzeigen dieser Seite ist ein Fehler aufgetreten."
    />
  )
}

/** Unbekannte Adresse. */
export function NotFoundPage() {
  return <ErrorPage icon={<SearchIcon />} title="Seite nicht gefunden" text="Diese Adresse gibt es nicht." />
}
