import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query'
import { useState, type CSSProperties, type ReactNode } from 'react'
import type { NoteCompact, Page } from '../../api/types'
import { cx } from '../../shared/lib/cx'
import { Dialog } from '../../shared/ui/Dialog'
import styles from './NoteFullscreen.module.css'
import { NoteSidebar } from './NoteSidebar'
import { dropSide, NOTE_DRAG_TYPE, type DraftEntry } from './noteWindows'
import { SidebarResizeHandle } from './SidebarResizeHandle'

type Props = {
  notes: UseInfiniteQueryResult<InfiniteData<Page<NoteCompact>>>
  tabs: { value: string; label: string }[]
  tab: string
  onTabChange: (tab: string) => void
  /** Suche in der Notizliste ('' = keine) */
  search: string
  onSearch: (q: string) => void
  sidebarWidth: number
  onSidebarWidth: (width: number) => void
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  /** Notiz der aktiven Seite (in der Liste markiert) */
  activeNoteId: string | null
  /** Eine Seite oder zwei nebeneinander */
  panes: { wid: number; active: boolean; content: ReactNode }[]
  onActivatePane: (wid: number) => void
  onOpen: (noteId: string) => void
  onOpenBeside: (noteId: string) => void
  onNew: () => void
  drafts: DraftEntry[]
  onOpenDraft: (wid: number) => void
  /** Aus der Liste gezogen und links (ersetzen) oder rechts (daneben) abgelegt */
  onDropNote: (noteId: string, side: 'left' | 'right') => void
  onClose: () => void
}

/** Vollbild: Notizliste (einklappbar, breiter ziehbar) und eine oder zwei Notizen im Split. */
export function NoteFullscreen({
  notes,
  tabs,
  tab,
  onTabChange,
  search,
  onSearch,
  sidebarWidth,
  onSidebarWidth,
  collapsed,
  onCollapsedChange,
  activeNoteId,
  panes,
  onActivatePane,
  onOpen,
  onOpenBeside,
  onNew,
  drafts,
  onOpenDraft,
  onDropNote,
  onClose,
}: Props) {
  const [dragSide, setDragSide] = useState<'left' | 'right' | null>(null)
  const accepts = (e: React.DragEvent) => e.dataTransfer.types.includes(NOTE_DRAG_TYPE)

  return (
    <Dialog onClose={onClose} size="document" fullscreen modeless aria-label="Notizen">
      <div
        className={cx(styles.layout, collapsed && styles.collapsed)}
        style={{ '--sidebar-w': `${sidebarWidth}px` } as CSSProperties}
      >
        {!collapsed && (
          <NoteSidebar
            query={notes}
            tabs={tabs}
            tab={tab}
            onTabChange={onTabChange}
            search={search}
            onSearch={onSearch}
            activeId={activeNoteId}
            onOpen={onOpen}
            onOpenBeside={onOpenBeside}
            onNew={onNew}
            drafts={drafts}
            onOpenDraft={onOpenDraft}
            onCollapse={() => onCollapsedChange(true)}
          />
        )}
        {/* Nach der Liste, damit er nicht das erste fokussierbare Element ist (absolut positioniert) */}
        {!collapsed && <SidebarResizeHandle width={sidebarWidth} onResize={onSidebarWidth} />}
        {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- Ablagefläche für Drag & Drop; per Tastatur gibt es „Daneben öffnen“ */}
        <div
          className={cx(styles.panes, panes.length > 1 && styles.two)}
          onDragOver={(e) => {
            if (!accepts(e)) return
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
            setDragSide(dropSide(e.clientX, e.currentTarget.getBoundingClientRect()))
          }}
          onDragLeave={(e) => {
            if (!(e.relatedTarget instanceof Node) || !e.currentTarget.contains(e.relatedTarget))
              setDragSide(null)
          }}
          onDrop={(e) => {
            if (!accepts(e)) return
            e.preventDefault()
            const id = e.dataTransfer.getData(NOTE_DRAG_TYPE)
            const side = dropSide(e.clientX, e.currentTarget.getBoundingClientRect())
            setDragSide(null)
            if (id) onDropNote(id, side)
          }}
        >
          {panes.map((p) => (
            // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- Klick oder Fokus macht die Seite aktiv; bedient wird der Inhalt
            <div
              key={p.wid}
              className={cx(styles.pane, p.active && styles.active)}
              onPointerDownCapture={() => onActivatePane(p.wid)}
              onFocusCapture={() => onActivatePane(p.wid)}
            >
              {p.content}
            </div>
          ))}
          {dragSide && (
            <div className={styles.dropOverlay} aria-hidden="true">
              <span className={cx(styles.dropZone, dragSide === 'left' && styles.dropActive)}>
                Hier öffnen
              </span>
              <span className={cx(styles.dropZone, dragSide === 'right' && styles.dropActive)}>
                Daneben öffnen
              </span>
            </div>
          )}
        </div>
      </div>
    </Dialog>
  )
}
