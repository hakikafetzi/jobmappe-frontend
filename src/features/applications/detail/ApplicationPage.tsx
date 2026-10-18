import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useApplication, usePatchApplication } from '../../../api/applications'
import type { ApplicationDetail, ApplicationPriority, ApplicationStatus } from '../../../api/types'
import { APP_STATUS } from '../../../domain/labels'
import { moveDialog } from '../../../domain/transitions'
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle'
import { plainKey, useHotkey } from '../../../shared/hooks/useHotkey'
import { cx } from '../../../shared/lib/cx'
import { BackLink } from '../../../shared/ui/BackLink'
import { QueryView } from '../../../shared/ui/QueryState'
import { useToast } from '../../../shared/ui/toastContext'
import { noteApplicationOf } from '../../notes/noteText'
import { NotesPanel } from '../../notes/NotesPanel'
import { CloseApplicationDialog } from '../CloseApplicationDialog'
import { MarkAppliedDialog } from '../MarkAppliedDialog'
import { ReopenDialog } from '../ReopenDialog'
import { ResetToDraftDialog } from '../ResetToDraftDialog'
import { ApplicationHeader } from './ApplicationHeader'
import styles from './ApplicationPage.module.css'
import { ApplicationViaDialog } from './ApplicationViaDialog'
import { CompanyCard } from './CompanyCard'
import { OverviewCard } from './OverviewCard'
import { StatusCard } from './StatusCard'
import { useBackLink } from './useBackLink'

export function ApplicationPage() {
  const { applicationId = '' } = useParams()
  const query = useApplication(applicationId)
  const back = useBackLink(query.data?.jobPosting.id)
  const navigate = useNavigate()
  useDocumentTitle(query.data?.jobPosting.title ?? 'Bewerbung')

  // Escape führt zurück; in Dialogen und Feldern greift es nicht
  useHotkey(plainKey('Escape'), () => void navigate(back.to))

  return (
    <div className={cx(styles.page, !query.data && styles.centered)}>
      <div className={styles.back}>
        <BackLink to={back.to}>{back.label}</BackLink>
      </div>
      <QueryView page query={query}>
        {(app) => <ApplicationContent app={app} />}
      </QueryView>
    </div>
  )
}

function ApplicationContent({ app }: { app: ApplicationDetail }) {
  const toast = useToast()
  const patch = usePatchApplication()
  const [dialog, setDialog] = useState<'via' | 'close' | 'apply' | 'reset' | 'reopen' | null>(null)
  const closeDialog = () => setDialog(null)
  const subject = {
    id: app.id,
    status: app.status,
    jobTitle: app.jobPosting.title,
    companyName: app.company.name,
  }

  const setStatus = (status: ApplicationStatus) => {
    const ask = moveDialog(app.status, status)
    if (ask) {
      setDialog(ask)
      return
    }
    patch.mutate(
      { id: app.id, patch: { status } },
      { onSuccess: () => toast(`Status: ${APP_STATUS[status].label}`) },
    )
  }
  const setPriority = (priority: ApplicationPriority) =>
    patch.mutate({ id: app.id, patch: { priority } }, { onSuccess: () => toast('Priorität geändert') })

  return (
    <>
      <ApplicationHeader app={app} onClose={() => setDialog('close')} onReopen={() => setDialog('reopen')} />
      <div className={styles.grid}>
        <div className={styles.main}>
          <OverviewCard app={app} onEditVia={() => setDialog('via')} />
        </div>
        <aside className={styles.side} aria-label="Status und Firma">
          <StatusCard app={app} onStatusChange={setStatus} onPriorityChange={setPriority} />
          <CompanyCard company={app.company} />
        </aside>
      </div>
      <div className={styles.bottom}>
        <NotesPanel application={noteApplicationOf(app)} />
      </div>

      {dialog === 'via' && <ApplicationViaDialog app={app} onClose={closeDialog} />}
      {dialog === 'close' && <CloseApplicationDialog app={subject} onClose={closeDialog} />}
      {dialog === 'apply' && <MarkAppliedDialog app={subject} onClose={closeDialog} />}
      {dialog === 'reset' && <ResetToDraftDialog app={subject} onClose={closeDialog} />}
      {dialog === 'reopen' && <ReopenDialog app={subject} onClose={closeDialog} />}
    </>
  )
}
