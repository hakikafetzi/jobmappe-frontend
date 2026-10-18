import { useMemo } from 'react'
import { cx } from '../lib/cx'
import { md } from '../lib/markdown'
import { EmptyState } from './EmptyState'
import { NoteIcon } from './icons'
import styles from './Markdown.module.css'

type Props = {
  source: string | null | undefined
  /** Text, wenn nichts vorhanden ist */
  emptyText?: string
  /** Leerer Zustand füllt den (Flex-)Container und steht darin mittig */
  fill?: boolean
  className?: string
}

/** Zeigt Markdown an. md() escaped den Text, bevor es Formatierung einsetzt — daher sicher. */
export function Markdown({ source, emptyText = 'Keine Beschreibung erfasst.', fill, className }: Props) {
  const html = useMemo(() => md(source), [source])
  if (!html)
    return (
      <EmptyState fill={fill} icon={<NoteIcon />}>
        {emptyText}
      </EmptyState>
    )
  return <div className={cx(styles.prose, className)} dangerouslySetInnerHTML={{ __html: html }} />
}
