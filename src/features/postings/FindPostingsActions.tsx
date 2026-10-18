import { useAppActions } from '../../app/uiContext'
import { Button } from '../../shared/ui/Button'
import { PenIcon } from '../../shared/ui/icons'

/** Weg zu neuen Stellen für leere Stellen-Listen: von Hand erfassen. */
export function FindPostingsActions() {
  const { openNewPosting } = useAppActions()
  return (
    <Button size="sm" variant="primary" onClick={openNewPosting}>
      <PenIcon width={14} height={14} />
      Stelle erfassen
    </Button>
  )
}
