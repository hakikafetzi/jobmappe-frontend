import { useState } from 'react'
import { useArchivePosting, usePosting } from '../../api/jobPostings'
import type { JobPostingDetail } from '../../api/types'
import { paths, type ApplicationOrigin, type CompanyOrigin } from '../../app/paths'
import { fmtDate } from '../../shared/lib/format'
import { Address } from '../../shared/ui/Address'
import { Button, ButtonLink } from '../../shared/ui/Button'
import { Chip } from '../../shared/ui/Chip'
import {
  ArchiveIcon,
  ArrowRightIcon,
  ColumnsIcon,
  ExternalLinkIcon,
  PenIcon,
  PlusIcon,
  UndoIcon,
} from '../../shared/ui/icons'
import { InfoList } from '../../shared/ui/InfoList'
import { QueryView } from '../../shared/ui/QueryState'
import { useToast } from '../../shared/ui/toastContext'
import { ToolAnchor, ToolButton, ToolLink } from '../../shared/ui/ToolButton'
import { WebsiteLink } from '../../shared/ui/WebsiteLink'
import { useStartAndOpenApplication } from '../applications/useStartApplication'
import { ApplicationPresenceChip } from './ApplicationPresenceChip'
import { CompanyDialog } from './company-edit/CompanyDialog'
import { PostingEditDialog } from './posting-edit/PostingEditDialog'
import { DetailBody, DetailCard, DetailHeader, DetailProse, DetailSection } from './DetailCard'

export function PostingDetail({ postingId }: { postingId: string }) {
  const query = usePosting(postingId)
  return (
    <QueryView query={query}>
      {(posting) => <PostingDetailCard posting={posting} busy={query.isPlaceholderData} />}
    </QueryView>
  )
}

function PostingDetailCard({ posting, busy }: { posting: JobPostingDetail; busy: boolean }) {
  const { company } = posting
  const start = useStartAndOpenApplication('postings')
  const archive = useArchivePosting()
  const toast = useToast()
  const archived = posting.archivedAt !== null
  const setArchived = (value: boolean) =>
    archive.mutate(
      { id: posting.id, archived: value },
      { onSuccess: () => toast(value ? 'Stelle archiviert' : 'Stelle wiederhergestellt') },
    )
  const applicationState: ApplicationOrigin = { from: 'postings', postingId: posting.id }

  const companyState: CompanyOrigin = { fromPosting: posting.id }
  const [dialog, setDialog] = useState<'posting' | 'company' | null>(null)
  const closeDialog = () => setDialog(null)

  return (
    <DetailCard busy={busy}>
      <DetailHeader
        title={posting.title}
        facts={
          <>
            <ApplicationPresenceChip hasApplication={posting.applicationId != null} />
            {posting.status === 'INACTIVE' && <Chip>Anzeige offline</Chip>}
            {archived && <Chip>Archiviert am {fmtDate(posting.archivedAt)}</Chip>}
          </>
        }
        actions={
          <>
            {posting.applicationId ? (
              <ButtonLink
                variant="primary"
                to={paths.application(posting.applicationId)}
                state={applicationState}
              >
                <ColumnsIcon width={15} height={15} />
                Zur Bewerbung
              </ButtonLink>
            ) : archived ? (
              <Button variant="primary" onClick={() => setArchived(false)} disabled={archive.isPending}>
                <UndoIcon width={15} height={15} />
                Wiederherstellen
              </Button>
            ) : (
              <Button variant="primary" onClick={() => start.run(posting.id)} disabled={start.isPending}>
                <PlusIcon width={15} height={15} />
                Bewerbung starten
              </Button>
            )}
          </>
        }
        tools={
          <>
            {posting.url && (
              <ToolAnchor href={posting.url} label="Originalanzeige">
                <ExternalLinkIcon />
              </ToolAnchor>
            )}
            <ToolButton label="Stelle bearbeiten" onClick={() => setDialog('posting')}>
              <PenIcon />
            </ToolButton>
            {/* Stellen mit Bewerbung lassen sich nicht archivieren (409) */}
            {!posting.applicationId && !archived && (
              <ToolButton label="Archivieren" onClick={() => setArchived(true)} disabled={archive.isPending}>
                <ArchiveIcon />
              </ToolButton>
            )}
          </>
        }
      />
      <DetailBody>
        <DetailSection title="Firma und Anzeige">
          <InfoList
            items={[
              {
                label: 'Firma',
                value: company.name,
                actions: (
                  <>
                    <ToolButton
                      variant="inline"
                      label="Firma bearbeiten"
                      onClick={() => setDialog('company')}
                    >
                      <PenIcon />
                    </ToolButton>
                    <ToolLink
                      variant="inline"
                      label="Firmenseite öffnen"
                      to={paths.company(company.id)}
                      state={companyState}
                      viewTransition
                    >
                      <ArrowRightIcon />
                    </ToolLink>
                  </>
                ),
              },
              { label: 'Ort', value: posting.location || '—' },
              {
                label: 'Webseite',
                value: <WebsiteLink website={company.website} />,
              },
              { label: 'Anschrift', wrap: true, value: <Address company={company} /> },
              { label: 'Veröffentlicht', value: fmtDate(posting.publishedAt) },
              { label: 'Erfasst', value: fmtDate(posting.createdAt) },
            ]}
          />
        </DetailSection>
        <DetailSection title="Stellenbeschreibung" grow>
          <DetailProse source={posting.description} />
        </DetailSection>
      </DetailBody>
      {dialog === 'posting' && <PostingEditDialog posting={posting} onClose={closeDialog} />}
      {dialog === 'company' && <CompanyDialog company={company} onClose={closeDialog} />}
    </DetailCard>
  )
}
