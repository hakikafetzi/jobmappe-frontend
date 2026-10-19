import type { CompanySummary } from '../../../api/types'
import { Address } from '../../../shared/ui/Address'
import { InfoList } from '../../../shared/ui/InfoList'
import { Panel } from '../../../shared/ui/Panel'
import { WebsiteLink } from '../../../shared/ui/WebsiteLink'
import styles from './SideCards.module.css'

export function CompanyCard({ company }: { company: CompanySummary }) {
  return (
    <Panel title="Firma">
      <div className={styles.body}>
        <InfoList
          columns={1}
          items={[
            { label: 'Name', value: company.name },
            {
              label: 'Webseite',
              value: <WebsiteLink website={company.website} />,
            },
            {
              label: 'Anschrift',
              wrap: true,
              value: <Address company={company} />,
            },
          ]}
        />
      </div>
    </Panel>
  )
}
