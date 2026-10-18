import type { ApplicationStatus } from '../../../api/types'
import { statusLook } from '../../../domain/labels'
import { Chip } from '../../../shared/ui/Chip'

/** `plain`: ohne farbigen Punkt (z. B. der Ausgang im Bewerbungsdetail). */
export function StatusChip({ status, plain = false }: { status: ApplicationStatus; plain?: boolean }) {
  const { label, color } = statusLook(status)
  return <Chip color={plain ? undefined : color}>{label}</Chip>
}
