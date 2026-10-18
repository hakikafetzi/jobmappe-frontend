import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import type { NoteCompact } from '../../api/types'
import { fmtDate } from '../../shared/lib/format'
import { Button } from '../../shared/ui/Button'
import { FolderIcon, SplitViewIcon } from '../../shared/ui/icons'
import { ToolButton } from '../../shared/ui/ToolButton'
import { NoteSheet } from './NoteSheet'
import styles from './NoteSidebarList.module.css'
import { applicationLabel } from './noteText'
import { NOTE_DRAG_TYPE, type DraftEntry } from './noteWindows'

type Props = {
  notes: NoteCompact[]
  /** Neue, noch nicht gespeicherte Notizen der offenen Fenster (oben, als „Entwurf“) */
  drafts: DraftEntry[]
  /** Gerade geöffnete Notiz (markiert) */
  activeId: string | null
  onOpen: (id: string) => void
  onOpenDraft: (wid: number) => void
  /** Rechts daneben öffnen (Split) */
  onOpenBeside: (id: string) => void
  /** Weitere Seiten der Infinite Query („Mehr laden“) */
  more?: { loading: boolean; onLoad: () => void }
}

/**
 * Notizliste in der Seitenleiste des Vollbilds: je Eintrag ein kleines Notizblatt, Titel, Bewerbung,
 * Ordner und Datum. Einträge lassen sich in den Split ziehen; per Tastatur gibt es „Daneben öffnen“.
 */
export function NoteSidebarList({ notes, drafts, activeId, onOpen, onOpenDraft, onOpenBeside, more }: Props) {
  // Zieh-Bild: statt der Zeile ein Quadrat mit Notizblatt und Titel (siehe unten)
  const [dragged, setDragged] = useState<NoteCompact | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  return (
    <>
      <ul className={styles.list}>
        {drafts.map((d) => (
          <li key={`draft-${d.wid}`} className={styles.row}>
            <button
              type="button"
              className={styles.item}
              aria-current={d.active || undefined}
              onClick={() => onOpenDraft(d.wid)}
            >
              <NoteSheet noteId={`draft-${d.wid}`} size="md" />
              <span className={styles.text}>
                <span className={styles.title}>{d.title}</span>
                <span className={styles.meta}>
                  <span className={styles.draft}>Entwurf</span>
                </span>
              </span>
            </button>
          </li>
        ))}
        {notes.map((n) => (
          // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- Ziehen ist eine Abkürzung; per Tastatur gibt es den Knopf „Daneben öffnen“
          <li
            key={n.id}
            className={styles.row}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'copy'
              e.dataTransfer.setData(NOTE_DRAG_TYPE, n.id)
              e.dataTransfer.setData('text/plain', n.title)
              // Vorschau sofort füllen: Der Browser nimmt das Bild noch in diesem Ereignis auf
              flushSync(() => setDragged(n))
              const preview = previewRef.current
              if (preview) e.dataTransfer.setDragImage(preview, preview.offsetWidth / 2, 24)
            }}
            onDragEnd={() => setDragged(null)}
          >
            <button
              type="button"
              className={styles.item}
              aria-current={n.id === activeId || undefined}
              onClick={() => onOpen(n.id)}
            >
              <NoteSheet noteId={n.id} size="md" />
              <span className={styles.text}>
                <span className={styles.title}>{n.title}</span>
                {/* Ohne Ordner steht das Datum neben der Bewerbung: Titel und Bewerbung rücken in die Mitte */}
                <span className={styles.subjectRow}>
                  <span className={styles.subject}>
                    {n.applicationId ? applicationLabel(n) : 'Ohne Bewerbung'}
                  </span>
                  {!n.noteCategory && <span className={styles.date}>{fmtDate(n.createdAt)}</span>}
                </span>
                {n.noteCategory && (
                  <span className={styles.meta}>
                    <span className={styles.category}>
                      <FolderIcon />
                      <span className={styles.categoryName}>{n.noteCategory}</span>
                    </span>
                    <span className={styles.date}>{fmtDate(n.createdAt)}</span>
                  </span>
                )}
              </span>
            </button>
            <span className={styles.action}>
              <ToolButton
                variant="inline"
                label="Daneben öffnen"
                tooltipAlign="end"
                onClick={() => onOpenBeside(n.id)}
              >
                <SplitViewIcon />
              </ToolButton>
            </span>
          </li>
        ))}
      </ul>
      {/* Außerhalb des Bildschirms; dient nur als Zieh-Bild */}
      <div ref={previewRef} className={styles.dragPreview} aria-hidden="true">
        {dragged && (
          <>
            <NoteSheet noteId={dragged.id} size="md" />
            <span className={styles.dragTitle}>{dragged.title}</span>
          </>
        )}
      </div>
      {more && (
        <div className={styles.more}>
          <Button size="sm" variant="ghost" disabled={more.loading} onClick={more.onLoad}>
            {more.loading ? 'Wird geladen …' : 'Mehr laden'}
          </Button>
        </div>
      )}
    </>
  )
}
