import { useState } from 'react'
import { useApplicationChoices } from '../../api/applications'
import { paths } from '../../app/paths'
import { useDebouncedCallback } from '../../shared/hooks/useDebouncedCallback'
import { Button, ButtonLink } from '../../shared/ui/Button'
import { ModalDialog } from '../../shared/ui/Dialog'
import { Avatar } from '../../shared/ui/Avatar'
import { EmptyState } from '../../shared/ui/EmptyState'
import { ArrowRightIcon, BriefcaseIcon, CheckCircleIcon, NoteIcon, SearchIcon } from '../../shared/ui/icons'
import { ErrorState, LoadingState } from '../../shared/ui/QueryState'
import { StatusChip } from '../applications/components/StatusChip'
import styles from './ApplicationPicker.module.css'
import { applicationLabel } from './noteText'
import type { NoteApplication } from './noteWindows'

/** Wartezeit nach dem letzten Tastendruck, bevor das Backend gefragt wird */
const SEARCH_DELAY_MS = 250

type Props = {
  /** Zugeordnete Bewerbung; null = keine */
  value: NoteApplication | null
  onChange: (value: NoteApplication | null) => void
  /** Link „Zur Bewerbung“ im Auswahldialog (nicht im eigenen Notizfenster ohne Navigation) */
  linkToApplication?: boolean
}

/** Bewerbung einer Notiz zuordnen oder die Zuordnung lösen (Knopf in der Kopfleiste + Auswahldialog). */
export function ApplicationPicker({ value, onChange, linkToApplication = true }: Props) {
  const [open, setOpen] = useState(false)
  const label = value ? applicationLabel(value) : 'Ohne Bewerbung'
  return (
    <>
      <button
        type="button"
        className={styles.trigger}
        aria-label={`Bewerbung: ${label}`}
        title={value ? label : 'Bewerbung zuordnen'}
        onClick={() => setOpen(true)}
      >
        <BriefcaseIcon />
        <span className={styles.label}>{label}</span>
      </button>
      {open && (
        <PickerDialog
          value={value}
          linkToApplication={linkToApplication}
          onClose={() => setOpen(false)}
          onPick={(picked) => {
            onChange(picked)
            setOpen(false)
          }}
        />
      )}
    </>
  )
}

function PickerDialog({
  value,
  linkToApplication,
  onClose,
  onPick,
}: {
  value: NoteApplication | null
  linkToApplication: boolean
  onClose: () => void
  onPick: (value: NoteApplication | null) => void
}) {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const search = useDebouncedCallback(setQuery, SEARCH_DELAY_MS)
  const result = useApplicationChoices(query, true)
  const choices = result.data?.pages.flatMap((p) => p.content) ?? []

  const pick = (a: (typeof choices)[number]) =>
    onPick({ id: a.id, jobTitle: a.jobTitle, companyName: a.companyName })

  return (
    <ModalDialog
      title="Bewerbung zuordnen"
      onClose={onClose}
      size="narrow"
      footerStart={
        value && linkToApplication ? (
          <ButtonLink to={paths.application(value.id)} variant="ghost">
            Zur Bewerbung
            <ArrowRightIcon className={styles.linkIcon} />
          </ButtonLink>
        ) : undefined
      }
      footer={<Button onClick={onClose}>Abbrechen</Button>}
    >
      <label className={styles.search}>
        <SearchIcon className={styles.searchIcon} />
        <input
          type="search"
          className={styles.searchInput}
          aria-label="Bewerbung suchen"
          placeholder="Stelle oder Firma suchen …"
          autoFocus
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            search.run(e.target.value.trim())
          }}
        />
      </label>

      {/* Zuordnung lösen: eigene Option über der Liste */}
      <button
        type="button"
        className={styles.option}
        aria-pressed={value === null}
        onClick={() => onPick(null)}
      >
        <span className={styles.noneIcon} aria-hidden="true">
          <NoteIcon />
        </span>
        <span className={styles.optionText}>
          <span className={styles.optionTitle}>Ohne Bewerbung</span>
          <span className={styles.optionMeta}>Die Notiz steht für sich</span>
        </span>
        {value === null && <CheckCircleIcon className={styles.check} aria-hidden="true" />}
      </button>

      <div className={styles.sectionLabel}>Bewerbungen</div>
      <div className={styles.scroll} aria-busy={result.isFetching}>
        {result.isPending ? (
          <LoadingState />
        ) : result.error ? (
          <ErrorState error={result.error} onRetry={() => void result.refetch()} />
        ) : choices.length ? (
          <>
            <ul className={styles.list}>
              {choices.map((a) => {
                const selected = value?.id === a.id
                return (
                  <li key={a.id}>
                    <button
                      type="button"
                      className={styles.option}
                      aria-pressed={selected}
                      onClick={() => pick(a)}
                    >
                      <Avatar name={a.companyName} size="md" />
                      <span className={styles.optionText}>
                        <span className={styles.optionTitle}>{a.jobTitle}</span>
                        <span className={styles.optionMeta}>{a.companyName}</span>
                      </span>
                      {selected ? (
                        <CheckCircleIcon className={styles.check} aria-hidden="true" />
                      ) : (
                        <StatusChip status={a.status} />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
            {result.hasNextPage && (
              <div className={styles.more}>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={result.isFetchingNextPage}
                  onClick={() => void result.fetchNextPage()}
                >
                  {result.isFetchingNextPage ? 'Wird geladen …' : 'Mehr laden'}
                </Button>
              </div>
            )}
          </>
        ) : (
          <EmptyState compact fill icon={<SearchIcon />}>
            {query ? `Keine Bewerbung passt zu „${query}“.` : 'Noch keine Bewerbungen.'}
          </EmptyState>
        )}
      </div>
    </ModalDialog>
  )
}
