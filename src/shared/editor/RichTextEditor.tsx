// WYSIWYG-Editor, gespeichert wird Markdown. Bewusst unkontrolliert: Der Startwert wird nur
// beim Mounten gesetzt (zum Zurücksetzen per `key` neu mounten) — so springt der Cursor nicht.
import { Fragment, useLayoutEffect, useRef, useState } from 'react'
import { cx } from '../lib/cx'
import { esc, htmlToMd, md, pastedHtmlToMd } from '../lib/markdown'
import { useLatest } from '../hooks/useLatest'
import { proseClass } from '../ui/proseClass'
import {
  applyLineShortcut,
  currentTaskItem,
  lineBreakInCodeBlock,
  normalizeTasks,
  runCommand,
  toggleTask,
  type EditorCommand,
} from './commands'
import { LinkPopover } from './LinkPopover'
import styles from './RichTextEditor.module.css'

type Props = {
  initialValue: string
  onChange: (markdown: string) => void
  label: string
  placeholder: string
  variant?: 'boxed' | 'document'
  id?: string
  /** Cmd/Strg+S usw. */
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void
  autoFocus?: boolean
}

const TOOLS: {
  cmd: EditorCommand | 'link'
  title: string
  label: string
  className?: string
  separatorAfter?: boolean
}[] = [
  { cmd: 'h1', title: 'Große Überschrift', label: 'H1', className: styles.h1 },
  { cmd: 'h2', title: 'Überschrift', label: 'H2', className: styles.h2 },
  { cmd: 'h3', title: 'Kleine Überschrift', label: 'H3', className: styles.h3, separatorAfter: true },
  { cmd: 'bold', title: 'Fett (Strg+B)', label: 'B', className: styles.bold },
  { cmd: 'italic', title: 'Kursiv (Strg+I)', label: 'I', className: styles.italic },
  { cmd: 'strike', title: 'Durchgestrichen', label: 'S', className: styles.strike },
  { cmd: 'link', title: 'Link (Strg+K)', label: 'Link', separatorAfter: true },
  { cmd: 'ul', title: 'Aufzählung', label: '• ☰' },
  { cmd: 'ol', title: 'Nummerierte Liste', label: '1.' },
  { cmd: 'tasks', title: 'Checkliste', label: '☐', className: styles.tasks, separatorAfter: true },
  { cmd: 'quote', title: 'Zitat', label: '❝' },
  { cmd: 'code', title: 'Code', label: '</>' },
  { cmd: 'codeblock', title: 'Codeblock', label: '{ }' },
  { cmd: 'hr', title: 'Trennlinie', label: '—' },
]

export function RichTextEditor({
  initialValue,
  onChange,
  label,
  placeholder,
  variant = 'boxed',
  id,
  onKeyDown,
  autoFocus,
}: Props) {
  const areaRef = useRef<HTMLDivElement>(null)
  const toolbarRef = useRef<HTMLDivElement>(null)
  // Enter in einem Checklisten-Punkt: Der neue Punkt startet offen (siehe normalizeTasks)
  const freshTaskRef = useRef(false)
  const onChangeRef = useLatest(onChange)
  const [isEmpty, setIsEmpty] = useState(!initialValue.trim())
  const [initial] = useState(initialValue)

  useLayoutEffect(() => {
    const el = areaRef.current
    if (!el) return
    el.innerHTML = md(initial) || '<p><br></p>'
    if (autoFocus) el.focus()
  }, [initial, autoFocus])

  const sync = () => {
    const el = areaRef.current
    if (!el) return
    normalizeTasks(el, freshTaskRef.current ? currentTaskItem(el) : null)
    freshTaskRef.current = false
    setIsEmpty(!el.textContent?.trim() && !el.querySelector('li'))
    onChangeRef.current(htmlToMd(el))
  }

  return (
    <div className={variant === 'boxed' ? styles.boxed : styles.document}>
      <div ref={toolbarRef} className={styles.toolbar} role="toolbar" aria-label="Formatierung">
        {TOOLS.map(({ cmd, ...t }) => (
          <Fragment key={cmd}>
            {cmd === 'link' ? (
              <LinkPopover editorRef={areaRef} className={styles.tool} />
            ) : (
              <button
                type="button"
                className={cx(styles.tool, t.className)}
                title={t.title}
                aria-label={t.title}
                onMouseDown={(e) => e.preventDefault()} // Auswahl im Editor behalten
                onClick={() => areaRef.current && runCommand(areaRef.current, cmd)}
              >
                {t.label}
              </button>
            )}
            {t.separatorAfter && <span className={styles.separator} aria-hidden="true" />}
          </Fragment>
        ))}
      </div>
      <div
        ref={areaRef}
        id={id}
        className={cx(styles.area, proseClass, isEmpty && styles.empty)}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        tabIndex={0}
        data-autofocus={autoFocus || undefined}
        aria-multiline="true"
        aria-label={label}
        data-placeholder={placeholder}
        onFocus={() => document.execCommand('defaultParagraphSeparator', false, 'p')}
        onInput={sync}
        onKeyDown={(e) => {
          onKeyDown?.(e)
          const el = areaRef.current
          if (e.defaultPrevented || !el) return
          if (e.key === ' ' && applyLineShortcut(el)) e.preventDefault()
          else if (e.key === 'Enter' && !e.shiftKey) {
            if (lineBreakInCodeBlock(el)) e.preventDefault()
            else freshTaskRef.current = !!currentTaskItem(el)
          } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
            e.preventDefault()
            toolbarRef.current?.querySelector<HTMLButtonElement>('[data-link-button]')?.click()
          }
        }}
        onClick={(e) => {
          // Klick aufs Kästchen eines Checklisten-Punkts hakt ihn ab
          const li = e.target instanceof HTMLElement ? e.target.closest('li[data-done]') : null
          if (!li || e.clientX > li.getBoundingClientRect().left + 22) return
          toggleTask(li as HTMLElement)
          sync()
        }}
        onPaste={(e) => {
          e.preventDefault()
          const html = e.clipboardData.getData('text/html')
          const text = e.clipboardData.getData('text/plain')
          const markdown = html
            ? pastedHtmlToMd(html)
            : text.replace(/\r/g, '').replace(/^\s*[•●▪]\s*/gm, '- ')
          document.execCommand('insertHTML', false, md(markdown) || esc(text))
          sync()
        }}
      />
    </div>
  )
}
