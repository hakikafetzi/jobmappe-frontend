import type { PostingFilter } from '../../app/paths'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ArchiveIcon, BriefcaseIcon, ColumnsIcon, SearchIcon } from '../../shared/ui/icons'
import { TextButton } from '../../shared/ui/TextButton'
import { FindPostingsActions } from './FindPostingsActions'

type Props = {
  filter: PostingFilter
  onFilterChange: (filter: PostingFilter) => void
  /** Aktive Suche ('' = keine) und wie man sie beendet */
  search: string
  onClearSearch: () => void
  /** „Stelle erfassen“ hier zeigen (mobil); am Desktop stehen sie in der Detailkarte */
  showFindActions: boolean
}

/** Was die Stellen-Liste zeigt, wenn der Filter keine Treffer hat. */
export function PostingsEmpty({ filter, onFilterChange, search, onClearSearch, showFindActions }: Props) {
  const showAll = <TextButton onClick={() => onFilterChange('all')}>Alle Stellen anzeigen</TextButton>

  if (search)
    return (
      <EmptyState
        icon={<SearchIcon />}
        title="Keine Treffer"
        actions={<TextButton onClick={onClearSearch}>Suche zurücksetzen</TextButton>}
      >
        Keine Stelle passt zu „{search}“. Gesucht wird in Titel und Firmenname.
      </EmptyState>
    )

  if (filter === 'all')
    return (
      <EmptyState fill icon={<BriefcaseIcon />} title="Noch keine Stellen" actions={<FindPostingsActions />}>
        Erfasse deine erste Stelle von Hand.
      </EmptyState>
    )

  if (filter === 'open')
    return (
      <EmptyState
        icon={<BriefcaseIcon />}
        title="Keine offenen Stellen"
        actions={showFindActions && <FindPostingsActions />}
        footnote={showAll}
      >
        Keine erfasste Stelle ist noch ausgeschrieben und ohne Bewerbung.
      </EmptyState>
    )

  if (filter === 'with')
    return (
      <EmptyState
        icon={<ColumnsIcon />}
        title="Noch keine Bewerbungen"
        actions={<TextButton onClick={() => onFilterChange('open')}>Offene Stellen anzeigen</TextButton>}
      >
        Zu keiner erfassten Stelle gibt es bisher eine Bewerbung.
      </EmptyState>
    )

  if (filter === 'inactive')
    return (
      <EmptyState icon={<BriefcaseIcon />} title="Keine inaktiven Stellen" footnote={showAll}>
        Alle erfassten Stellen sind noch ausgeschrieben.
      </EmptyState>
    )

  return (
    <EmptyState icon={<ArchiveIcon />} title="Keine archivierten Stellen" footnote={showAll}>
      Archivierst du eine Stelle, findest du sie hier wieder.
    </EmptyState>
  )
}
