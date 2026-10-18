import { useState } from 'react'
import { Link } from 'react-router'
import { useCompany, useCompanyPostingsPage } from '../../api/companies'
import { PAGE_SIZE } from '../../api/pagination'
import type { CompanyDetail as Company } from '../../api/types'
import { paths } from '../../app/paths'
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle'
import { fmtDate, plural } from '../../shared/lib/format'
import { Address } from '../../shared/ui/Address'
import { Avatar } from '../../shared/ui/Avatar'
import { BackLink } from '../../shared/ui/BackLink'
import { Button } from '../../shared/ui/Button'
import { EmptyState } from '../../shared/ui/EmptyState'
import { BriefcaseIcon, PenIcon } from '../../shared/ui/icons'
import { InfoList } from '../../shared/ui/InfoList'
import { Pager } from '../../shared/ui/Pager'
import { QueryView } from '../../shared/ui/QueryState'
import { WebsiteLink } from '../../shared/ui/WebsiteLink'
import { ApplicationPresenceChip } from './ApplicationPresenceChip'
import { CompanyDialog } from './company-edit/CompanyDialog'
import styles from './CompanyDetail.module.css'
import { DetailBody, DetailCard, DetailHeader, DetailSection } from './DetailCard'
import { companyJobsParams } from './pageSwitch'

type Props = { companyId: string; backToPostingId?: string }

export function CompanyDetail({ companyId, backToPostingId }: Props) {
  const query = useCompany(companyId)
  // Stellen gleichzeitig laden statt erst, wenn die Karte steht
  const postings = useCompanyPostingsPage(companyId, companyJobsParams(0))
  useDocumentTitle(query.data?.name ?? 'Firma')
  return (
    <QueryView query={query}>
      {(company) => (
        <CompanyDetailCard
          company={company}
          backToPostingId={backToPostingId}
          busy={query.isPlaceholderData || postings.isPlaceholderData}
        />
      )}
    </QueryView>
  )
}

function CompanyDetailCard({
  company,
  backToPostingId,
  busy,
}: {
  company: Company
  backToPostingId?: string
  busy: boolean
}) {
  const [editing, setEditing] = useState(false)
  const missing = <span className={styles.missing}>nicht hinterlegt</span>
  return (
    <DetailCard busy={busy}>
      <DetailHeader
        back={
          backToPostingId && (
            <BackLink to={paths.posting(backToPostingId, 'all')} viewTransition>
              Zurück zur Stelle
            </BackLink>
          )
        }
        leading={<Avatar name={company.name} size="xl" />}
        title={company.name}
        meta={`${plural(company.jobsCount, 'Stelle', 'Stellen')} erfasst`}
        actions={
          <Button onClick={() => setEditing(true)}>
            <PenIcon width={14} height={14} />
            Firma bearbeiten
          </Button>
        }
      />
      <DetailBody>
        <DetailSection title="Firmendaten">
          <InfoList
            items={[
              {
                label: 'Webseite',
                value: <WebsiteLink website={company.website} fallback={missing} />,
              },
              { label: 'Anschrift', wrap: true, value: <Address company={company} fallback={missing} /> },
            ]}
          />
        </DetailSection>
        <DetailSection title={`Stellen bei ${company.name}`}>
          {/* key: neue Firma beginnt auf der ersten Seite */}
          <CompanyJobs key={company.id} companyId={company.id} />
        </DetailSection>
      </DetailBody>
      {editing && <CompanyDialog company={company} onClose={() => setEditing(false)} />}
    </DetailCard>
  )
}

function CompanyJobs({ companyId }: { companyId: string }) {
  const [page, setPage] = useState(0)
  const query = useCompanyPostingsPage(companyId, companyJobsParams(page))
  return (
    <QueryView query={query}>
      {({ content: postings, totalPages, totalElements }) =>
        postings.length ? (
          <>
            <div className={styles.jobs}>
              {postings.map((p) => (
                <Link key={p.id} to={paths.posting(p.id, 'all')} className={styles.job} viewTransition>
                  <div className={styles.jobText}>
                    <div className={styles.jobTitle}>{p.title}</div>
                    <div className={styles.jobMeta}>
                      {p.location || 'Ort offen'}, erfasst am {fmtDate(p.createdAt)}
                    </div>
                  </div>
                  <ApplicationPresenceChip hasApplication={p.hasApplication} />
                </Link>
              ))}
            </div>
            <Pager
              page={page}
              totalPages={totalPages}
              range={{ size: PAGE_SIZE, total: totalElements }}
              onChange={setPage}
            />
          </>
        ) : (
          <EmptyState compact icon={<BriefcaseIcon />}>
            Zu dieser Firma sind noch keine Stellen erfasst.
          </EmptyState>
        )
      }
    </QueryView>
  )
}
