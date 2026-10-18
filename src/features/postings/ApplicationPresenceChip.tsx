import { Chip } from '../../shared/ui/Chip'

/** Die Stellen-API liefert nur, *ob* es eine Bewerbung gibt — nicht ihren Status. */
export function ApplicationPresenceChip({ hasApplication }: { hasApplication: boolean }) {
  return hasApplication ? (
    <Chip color="var(--accent)">Bewerbung angelegt</Chip>
  ) : (
    <Chip>Noch nicht beworben</Chip>
  )
}
