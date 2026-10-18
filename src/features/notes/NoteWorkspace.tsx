import { useId, useState } from 'react'
import { useCategories } from '../../api/noteCategories'
import { useNotesInfinite } from '../../api/notes'
import type { NoteDetail } from '../../api/types'
import { paths } from '../../app/paths'
import { MOBILE_QUERY, useMediaQuery } from '../../shared/hooks/useMediaQuery'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { Dialog, DialogCloseButton } from '../../shared/ui/Dialog'
import {
  CloseIcon,
  CollapseIcon,
  ExpandIcon,
  ExternalLinkIcon,
  MinimizeIcon,
  PanelIcon,
  ResetSizeIcon,
} from '../../shared/ui/icons'
import { useToast } from '../../shared/ui/toastContext'
import { ToolButton } from '../../shared/ui/ToolButton'
import { handOverDraft, takeDraft } from './noteDraftHandoff'
import { LoadedNoteForm } from './NoteForm'
import { NoteFullscreen } from './NoteFullscreen'
import { notePopupFeatures, notePopupRect } from './popupFeatures'
import { ALL_NOTES, categoryTabs, neighbourNote } from './noteText'
import { visibleWindows, type NoteApplication, type NoteWindow } from './noteWindows'
import type { NoteWorkspaceApi } from './useNoteWorkspace'

type Props = { ws: NoteWorkspaceApi }

type Replacement = {
  wid: number
  noteId: string | null
  categoryName: string | null
  application?: NoteApplication | null
}

/**
 * Alle offenen (nicht minimierten) Notizen der App: als schwebende Fenster nebeneinander (Desktop),
 * als eigene Seite (mobil) oder im Vollbild mit Notizliste und bis zu zwei Notizen im Split.
 */
export function NoteWorkspace({ ws }: Props) {
  const { state, dispatch, prefs, updatePrefs, resetPrefs } = ws
  const visible = visibleWindows(state)
  // Bewerbung, in deren Kontext das aktive Fenster geöffnet wurde: Neue Notizen aus dem Vollbild
  // werden ihr zugeordnet (die Notizliste zeigt trotzdem alle Notizen)
  const active = visible.find((w) => w.wid === state.focused) ?? visible.at(-1)
  const application: NoteApplication | null = active?.scope ?? null
  const mobile = useMediaQuery(MOBILE_QUERY)
  const fullscreen = prefs.fullscreen && !mobile
  const categories = useCategories()
  const toast = useToast()
  const idPrefix = useId()
  const [tabState, setTabState] = useState(ALL_NOTES)
  // Suche in der Notizliste (q); schließt den Ordner aus wie auf der Notizen-Seite
  const [search, setSearchState] = useState('')
  const {
    tabs,
    activeTab: tab,
    categoryId: tabCategoryId,
    categoryName: tabCategory,
  } = categoryTabs(categories.data, tabState)
  // Notizliste der Seitenleiste; nur im Vollbild gebraucht
  // Immer alle Notizen (nicht nur die der Bewerbung); filtert nur nach Ordner oder Suche
  const notes = useNotesInfinite(
    search ? { q: search } : { noteCategoryId: tabCategoryId },
    fullscreen && visible.length > 0,
  )
  // Ein Ordner beendet die Suche, eine Suche zeigt alle Ordner
  const setTab = (next: string) => {
    setTabState(next)
    setSearchState('')
  }
  const setSearch = (q: string) => {
    setSearchState(q)
    if (q) setTabState(ALL_NOTES)
  }
  // Ersetzen einer Notiz mit ungespeicherten Änderungen wartet auf „Verwerfen“
  const [pending, setPending] = useState<Replacement | null>(null)

  if (!visible.length) return null

  const find = (wid: number | null) => visible.find((w) => w.wid === wid)
  const close = (wid: number) => dispatch({ type: 'close', wid })

  const replace = (r: Replacement) => {
    const w = find(r.wid)
    if (!w) return
    if (w.noteId !== null && w.noteId === r.noteId) return dispatch({ type: 'focus', wid: w.wid })
    if (w.draft?.dirty) setPending(r)
    else dispatch({ type: 'replace', ...r })
  }

  const popOut = (w: NoteWindow) => {
    // Neue oder geänderte Notizen nehmen ihren Entwurf mit
    const token =
      w.noteId === null || w.draft?.dirty
        ? handOverDraft({ draft: w.draft, categoryName: w.categoryName, application: w.application })
        : null
    const rect = notePopupRect({
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      screenX: window.screenX,
      screenY: window.screenY,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
    })
    const opened = window.open(
      paths.noteWindow(w.noteId, token ?? undefined),
      `jobmappe-notiz-${w.noteId ?? token ?? w.wid}`,
      notePopupFeatures(rect),
    )
    // Manche Browser (Safari) übergehen die Größe aus den Angaben; ein vom Skript geöffnetes Fenster
    // lässt sich danach noch anpassen. Öffnet es als Tab, bleibt das wirkungslos.
    try {
      opened?.resizeTo(rect.width, rect.height)
      opened?.moveTo(rect.left, rect.top)
    } catch {
      // nicht erlaubt: Größe bleibt, wie der Browser sie wählt
    }
    if (!opened) {
      takeDraft(token) // aufräumen
      toast('Das Fenster wurde vom Browser blockiert.', { tone: 'error' })
      return
    }
    close(w.wid)
  }

  const toggleFullscreen = () => {
    if (!fullscreen) dispatch({ type: 'enterFullscreen' })
    updatePrefs({ fullscreen: !fullscreen })
  }

  const reset = (wid: number) => {
    resetPrefs()
    dispatch({ type: 'move', wid, position: null })
  }

  // Seiten im Vollbild
  const leftWid = find(state.left) ? state.left : state.focused
  const rightWid = state.right !== leftWid && find(state.right) ? state.right : null
  const activeWid = state.focused === rightWid ? rightWid : leftWid

  const onSavedIn = (w: NoteWindow) => (saved: NoteDetail, categoryId: string | null) => {
    if (!fullscreen) return close(w.wid)
    if (tab !== ALL_NOTES && tab !== categoryId) setTab(ALL_NOTES)
    dispatch({ type: 'saved', wid: w.wid, noteId: saved.id })
  }

  const onDeletedIn = (w: NoteWindow) => (id: string) => {
    if (!fullscreen) return close(w.wid)
    // Nächste Notiz der Liste öffnen, aber nicht die, die schon auf der anderen Seite steht
    const other = find(w.wid === leftWid ? rightWid : leftWid)?.noteId
    const shown = (notes.data?.pages.flatMap((p) => p.content) ?? []).filter((n) => n.id !== other)
    dispatch({
      type: 'replace',
      wid: w.wid,
      noteId: neighbourNote(shown, id),
      categoryName: tabCategory,
      application,
    })
  }

  // Links neben Ordner und Bewerbung: Fenster herauslösen bzw. zurücksetzen (nicht mobil)
  const tools = (w: NoteWindow) =>
    mobile ? undefined : (
      <>
        <ToolButton label="In eigenem Fenster öffnen" onClick={() => popOut(w)}>
          <ExternalLinkIcon />
        </ToolButton>
        <ToolButton label="Originalgröße und Position" onClick={() => reset(w.wid)}>
          <ResetSizeIcon />
        </ToolButton>
      </>
    )

  // In die Leiste unten; dort holt ein Klick die Notiz zurück (auf jeder Seite)
  const minimizeButton = (w: NoteWindow) => (
    <ToolButton label="Minimieren" onClick={() => dispatch({ type: 'minimize', wid: w.wid })}>
      <MinimizeIcon />
    </ToolButton>
  )

  // Rechts in der Kopfleiste: Minimieren, Vollbild und Schließen (mobil: Zurück-Pfeil, Minimieren)
  const controls = (w: NoteWindow) =>
    mobile ? (
      <>
        <DialogCloseButton onClose={() => close(w.wid)} />
        {minimizeButton(w)}
      </>
    ) : (
      <>
        {minimizeButton(w)}
        <ToolButton
          label={fullscreen ? 'Vollbild beenden' : 'Vollbild'}
          aria-pressed={fullscreen}
          onClick={toggleFullscreen}
        >
          {fullscreen ? <CollapseIcon /> : <ExpandIcon />}
        </ToolButton>
        <ToolButton label="Schließen" tooltipAlign="end" onClick={() => close(w.wid)}>
          <CloseIcon />
        </ToolButton>
      </>
    )

  const form = (w: NoteWindow, leading?: React.ReactNode) => (
    <LoadedNoteForm
      key={`${w.wid}-${w.version}`}
      noteId={w.noteId}
      defaultCategoryName={w.categoryName}
      defaultApplication={w.application}
      categories={categories.data ?? []}
      draft={w.draft}
      onDraftChange={(draft) => dispatch({ type: 'draft', wid: w.wid, draft })}
      titleId={`${idPrefix}-${w.wid}`}
      tools={tools(w)}
      controls={controls(w)}
      leading={leading}
      closeLabel={fullscreen ? 'Schließen' : 'Abbrechen'}
      onClose={() => close(w.wid)}
      onSaved={onSavedIn(w)}
      onDeleted={onDeletedIn(w)}
    />
  )

  let content: React.ReactNode
  if (fullscreen) {
    const left = find(leftWid)
    const right = find(rightWid)
    const expand = prefs.sidebarCollapsed ? (
      <ToolButton label="Notizliste ausklappen" onClick={() => updatePrefs({ sidebarCollapsed: false })}>
        <PanelIcon />
      </ToolButton>
    ) : undefined
    content = (
      <NoteFullscreen
        notes={notes}
        tabs={tabs}
        tab={tab}
        onTabChange={setTab}
        search={search}
        onSearch={setSearch}
        sidebarWidth={prefs.sidebarWidth}
        onSidebarWidth={(sidebarWidth) => updatePrefs({ sidebarWidth })}
        collapsed={prefs.sidebarCollapsed}
        onCollapsedChange={(sidebarCollapsed) => updatePrefs({ sidebarCollapsed })}
        activeNoteId={find(activeWid)?.noteId ?? null}
        panes={[left, right]
          .filter((w): w is NoteWindow => !!w)
          .map((w, i) => ({
            wid: w.wid,
            active: w.wid === activeWid,
            content: form(w, i === 0 ? expand : undefined),
          }))}
        onActivatePane={(wid) => dispatch({ type: 'focus', wid })}
        onOpen={(noteId) => activeWid !== null && replace({ wid: activeWid, noteId, categoryName: null })}
        onOpenBeside={(noteId) => dispatch({ type: 'openInSplit', noteId, categoryName: null })}
        onNew={() =>
          activeWid !== null &&
          replace({ wid: activeWid, noteId: null, categoryName: tabCategory, application })
        }
        drafts={visible
          .filter((w) => w.noteId === null)
          .map((w) => ({
            wid: w.wid,
            title: w.draft?.title.trim() || 'Neue Notiz',
            active: w.wid === activeWid,
          }))}
        onOpenDraft={(wid) => dispatch({ type: 'showInPane', wid })}
        onDropNote={(noteId, side) => {
          if (side === 'right') dispatch({ type: 'openInSplit', noteId, categoryName: null })
          else if (leftWid !== null) replace({ wid: leftWid, noteId, categoryName: null })
        }}
        onClose={() => activeWid !== null && close(activeWid)}
      />
    )
  } else {
    // Stapel per z-index; die Reihenfolge im DOM bleibt fest, sonst verlöre ein nach vorn geholtes
    // Fenster beim Umhängen den Fokus. Mobil nur das vorderste (eigene Seite).
    const byZ = visible.toSorted((a, b) => a.z - b.z)
    const front = byZ.at(-1)
    const shown = mobile ? visible.filter((w) => w === front) : visible
    content = shown.map((w) => (
      <Dialog
        key={w.wid}
        onClose={() => close(w.wid)}
        size="document"
        modeless={!mobile}
        movable={
          mobile
            ? undefined
            : {
                position: w.position,
                onMove: (position) => {
                  dispatch({ type: 'move', wid: w.wid, position })
                  updatePrefs({ position })
                },
              }
        }
        resizable={{ width: prefs.width, height: prefs.height, onResize: (size) => updatePrefs(size) }}
        stackIndex={byZ.indexOf(w)}
        onActivate={() => dispatch({ type: 'focus', wid: w.wid })}
        aria-labelledby={`${idPrefix}-${w.wid}`}
      >
        {form(w)}
      </Dialog>
    ))
  }

  return (
    <>
      {content}
      {pending && (
        <ConfirmDialog
          title="Änderungen verwerfen?"
          confirmLabel="Verwerfen"
          danger
          onCancel={() => setPending(null)}
          onConfirm={() => {
            dispatch({ type: 'replace', ...pending })
            setPending(null)
          }}
        >
          Die geöffnete Notiz hat ungespeicherte Änderungen. Beim Wechseln gehen sie verloren.
        </ConfirmDialog>
      )}
    </>
  )
}
