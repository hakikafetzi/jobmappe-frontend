import type { ApplicationDetail } from '../../../api/types'
import { paths } from '../../../app/paths'
import { APP_CHANNEL, POSTING_STATUS_LABEL } from '../../../domain/labels'
import { fmtDate } from '../../../shared/lib/format'
import { IconButton } from '../../../shared/ui/IconButton'
import { InfoList } from '../../../shared/ui/InfoList'
import { Markdown } from '../../../shared/ui/Markdown'
import { TextAnchor, TextLink } from '../../../shared/ui/TextButton'
import styles from './OverviewCard.module.css'

export function OverviewCard({ app, onEditVia }: { app: ApplicationDetail; onEditVia: () => void }) {
  const posting = app.jobPosting
  return (
    <section className={styles.card} aria-label="Überblick">
      <div className={styles.head}>
        <h2 className={styles.title}>Überblick</h2>
      </div>
      <div className={styles.info}>
        <InfoList
          items={[
            { label: 'Beworben am', value: app.appliedAt ? fmtDate(app.appliedAt) : 'Noch nicht' },
            {
              label: 'Bewerbungsweg',
              value: (
                <span className={styles.via}>
                  {app.appliedVia ? APP_CHANNEL[app.appliedVia] : '—'}
                  <IconButton subtle aria-label="Bewerbungsweg bearbeiten" onClick={onEditVia}>
                    ✎
                  </IconButton>
                </span>
              ),
            },
            { label: 'Veröffentlicht', value: fmtDate(posting.publishedAt) },
            { label: 'Ort', value: posting.location || '—' },
            { label: 'Anzeige', value: POSTING_STATUS_LABEL[posting.status] },
          ]}
        />
      </div>
      <div className={styles.head}>
        <h2 className={styles.title}>Stellenbeschreibung</h2>
        <div className={styles.links}>
          <TextLink to={paths.posting(posting.id, 'all')}>Zur Stelle</TextLink>
          {posting.url && <TextAnchor href={posting.url}>Originalanzeige ↗</TextAnchor>}
        </div>
      </div>
      <div className={styles.description}>
        <Markdown source={posting.description} fill />
      </div>
    </section>
  )
}
