import { EmptyState } from '../../shared/ui/EmptyState'
import { BriefcaseIcon, SearchIcon } from '../../shared/ui/icons'
import { DetailCard } from './DetailCard'
import { FindPostingsActions } from './FindPostingsActions'

/** Detailkarte ohne Auswahl. Ist die Liste leer, zeigt sie die Wege zu neuen Stellen. */
export function EmptyDetail({ listEmpty }: { listEmpty: boolean }) {
  return (
    <DetailCard>
      {listEmpty ? (
        <EmptyState fill icon={<SearchIcon />} title="Neue Stellen finden" actions={<FindPostingsActions />}>
          Erfasse deine erste Stelle von Hand.
        </EmptyState>
      ) : (
        <EmptyState fill icon={<BriefcaseIcon />} title="Keine Stelle ausgewählt">
          Wähl links eine Stelle aus der Liste.
        </EmptyState>
      )}
    </DetailCard>
  )
}
