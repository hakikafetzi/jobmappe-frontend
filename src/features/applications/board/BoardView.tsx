import { useRef, useState, type CSSProperties, type DragEvent, type HTMLAttributes } from 'react'
import { useApplicationColumn } from '../../../api/applications'
import type { ApplicationCompact, ApplicationPriority, ApplicationStatus } from '../../../api/types'
import { APP_STATUS, BOARD_COLUMNS } from '../../../domain/labels'
import { canMoveTo } from '../../../domain/transitions'
import { cx } from '../../../shared/lib/cx'
import { Button } from '../../../shared/ui/Button'
import { ArchiveIcon, InboxIcon } from '../../../shared/ui/icons'
import { ErrorState, LoadingState } from '../../../shared/ui/QueryState'
import { boardCardStyle, boardColumnStyle, boardDropzoneStyle } from '../viewTransition'
import styles from './Board.module.css'
import { BoardCard } from './BoardCard'

type Props = {
  /** Filter für alle Spalten (Backend-Parameter `priority`) */
  priority?: ApplicationPriority
  onMove: (app: ApplicationCompact, status: ApplicationStatus) => void
  /** Karte auf „Abgeschlossen“ gezogen */
  onDropClosed: (app: ApplicationCompact) => void
  onShowClosed: () => void
}

const CLOSED_ZONE = 'closed'

type DropTarget = Pick<HTMLAttributes<HTMLElement>, 'onDragOver' | 'onDragLeave' | 'onDrop'>
type CardHandlers = { onDragStart: (app: ApplicationCompact) => void; onDragEnd: () => void }

/**
 * Kanban-Board der laufenden Bewerbungen. Jede Spalte lädt ihren Status seitenweise selbst
 * (`?status=…`) und zeigt die Gesamtzahl aus dem Backend; weitere Karten über „Mehr laden“.
 */
export function BoardView({ priority, onMove, onDropClosed, onShowClosed }: Props) {
  const [collapsed, setCollapsed] = useState<ReadonlySet<ApplicationStatus>>(new Set())
  const [dragOver, setDragOver] = useState<string | null>(null)
  // Status der gezogenen Karte: Spalten, in die sie nicht wechseln darf, nehmen sie nicht an
  const [dragFrom, setDragFrom] = useState<ApplicationStatus | null>(null)
  const dragged = useRef<ApplicationCompact | null>(null)
  // Aktion erst nach dragend ausführen: Verschiebt sich die Karte schon beim drop im DOM,
  // verliert der Browser das Quell-Element und der Drag-Vorgang endet nicht sauber.
  const pendingDrop = useRef<(() => void) | null>(null)

  const toggle = (status: ApplicationStatus) =>
    setCollapsed((s) => {
      const next = new Set(s)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      return next
    })

  // Gemeinsame Handler für Spalten und Ablage
  const dropTarget = (
    key: string,
    onDrop: (app: ApplicationCompact) => void,
    accepts = true,
  ): DropTarget => ({
    onDragOver: (e: DragEvent) => {
      if (!dragged.current || !accepts) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (dragOver !== key) setDragOver(key)
    },
    onDragLeave: (e: DragEvent) => {
      if (!e.currentTarget.contains(e.relatedTarget as Node | null))
        setDragOver((k) => (k === key ? null : k))
    },
    onDrop: (e: DragEvent) => {
      e.preventDefault()
      const app = dragged.current
      if (!accepts) return
      if (app) pendingDrop.current = () => onDrop(app)
    },
  })

  const cardHandlers: CardHandlers = {
    onDragStart: (app) => {
      dragged.current = app
      pendingDrop.current = null
      setDragFrom(app.status)
    },
    onDragEnd: () => {
      const run = pendingDrop.current
      pendingDrop.current = null
      dragged.current = null
      setDragOver(null)
      setDragFrom(null)
      run?.()
    },
  }

  return (
    <div className={styles.board}>
      {BOARD_COLUMNS.map((col, index) => {
        const blocked = dragFrom !== null && dragFrom !== col.status && !canMoveTo(dragFrom, col.status)
        return (
          <BoardColumn
            key={col.status}
            index={index}
            column={col}
            priority={priority}
            collapsed={collapsed.has(col.status)}
            onToggle={() => toggle(col.status)}
            dragOver={dragOver === col.status}
            blocked={blocked}
            dropTarget={dropTarget(
              col.status,
              (app) => {
                if (canMoveTo(app.status, col.status)) onMove(app, col.status)
              },
              !blocked,
            )}
            cardHandlers={cardHandlers}
          />
        )
      })}
      <section
        className={cx(styles.column, styles.dropzone, dragOver === CLOSED_ZONE && styles.dragOver)}
        aria-label="Abgeschlossen"
        style={boardDropzoneStyle}
        data-vt-part="dropzone"
        {...dropTarget(CLOSED_ZONE, onDropClosed)}
      >
        <button
          type="button"
          className={styles.head}
          onClick={onShowClosed}
          title="Abgeschlossene Bewerbungen in der Tabelle ansehen"
        >
          <span className={styles.dot} aria-hidden="true" />
          <span className={styles.name}>Abgeschlossen</span>
        </button>
        <div className={styles.zone}>
          <ArchiveIcon />
          Karte hierher ziehen
        </div>
      </section>
    </div>
  )
}

type ColumnProps = {
  index: number
  column: (typeof BOARD_COLUMNS)[number]
  priority?: ApplicationPriority
  collapsed: boolean
  onToggle: () => void
  dragOver: boolean
  blocked: boolean
  dropTarget: DropTarget
  cardHandlers: CardHandlers
}

function BoardColumn({
  index,
  column: col,
  priority,
  collapsed,
  onToggle,
  dragOver,
  blocked,
  dropTarget,
  cardHandlers,
}: ColumnProps) {
  const query = useApplicationColumn(col.status, priority)
  const items = query.data?.pages.flatMap((p) => p.content) ?? []
  const total = query.data?.pages[0]?.totalElements
  return (
    <section
      className={cx(
        styles.column,
        collapsed && styles.collapsed,
        dragOver && styles.dragOver,
        blocked && styles.blocked,
      )}
      aria-label={APP_STATUS[col.status].short}
      style={boardColumnStyle(index)}
      data-vt-part="column"
      {...dropTarget}
    >
      <button
        type="button"
        className={styles.head}
        aria-expanded={!collapsed}
        title={collapsed ? 'Ausklappen' : 'Einklappen'}
        onClick={onToggle}
        onDragEnter={() => collapsed && onToggle()}
      >
        <span className={styles.dot} style={{ '--dot': col.color } as CSSProperties} aria-hidden="true" />
        <span className={styles.name}>{APP_STATUS[col.status].short}</span>
        {total !== undefined && <span className={styles.count}>{total}</span>}
        <span className={styles.caret} aria-hidden="true">
          ▾
        </span>
      </button>
      <div className={styles.body}>
        {query.isPending ? (
          <LoadingState />
        ) : query.error ? (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        ) : items.length ? (
          <>
            {items.map((a, k) => (
              <BoardCard key={a.id} application={a} style={boardCardStyle(index, k)} {...cardHandlers} />
            ))}
            {query.hasNextPage && (
              <Button
                size="sm"
                variant="ghost"
                className={styles.more}
                disabled={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                {query.isFetchingNextPage ? 'Wird geladen …' : 'Mehr laden'}
              </Button>
            )}
          </>
        ) : (
          <div className={styles.empty}>
            <InboxIcon />
            Keine Bewerbung
          </div>
        )}
      </div>
    </section>
  )
}
