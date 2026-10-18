// Formatierungsbefehle für den contenteditable-Editor. Nutzt document.execCommand: offiziell
// „deprecated“, aber in allen Browsern vorhanden und die einzige Undo-fähige Variante ohne
// Editor-Bibliothek. Bei wachsenden Anforderungen durch z. B. Tiptap ersetzen.
import { esc } from '../lib/markdown'

export type EditorCommand =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bold'
  | 'italic'
  | 'strike'
  | 'ul'
  | 'ol'
  | 'tasks'
  | 'quote'
  | 'code'
  | 'codeblock'
  | 'hr'

const BLOCK_TAGS = /^(P|DIV|H1|H2|H3|H4|LI|BLOCKQUOTE|PRE)$/

/** Block-Element, in dem der Cursor steht. */
function currentBlock(root: HTMLElement): HTMLElement | null {
  const sel = getSelection()
  let n: Node | null = sel?.rangeCount ? sel.anchorNode : null
  while (n && n !== root) {
    if (n instanceof HTMLElement && BLOCK_TAGS.test(n.tagName)) return n
    n = n.parentNode
  }
  return null
}

const isTaskItem = (el: Element | null): el is HTMLLIElement =>
  el?.tagName === 'LI' && !!el.parentElement?.hasAttribute('data-tasks')

/** Punkt der Checkliste, in dem der Cursor steht. */
export function currentTaskItem(root: HTMLElement): HTMLLIElement | null {
  const block = currentBlock(root)
  return isTaskItem(block) ? block : null
}

export function toggleTask(li: HTMLElement) {
  li.setAttribute('data-done', li.getAttribute('data-done') === 'true' ? 'false' : 'true')
}

/**
 * Hält die Checklisten-Attribute stimmig, nachdem der Browser das DOM verändert hat: Neue Punkte
 * (Enter kopiert die Attribute des vorigen) starten offen, Punkte außerhalb einer Checkliste
 * verlieren ihr Kästchen. `fresh` = soeben per Enter entstandener Punkt.
 */
export function normalizeTasks(root: HTMLElement, fresh?: HTMLElement | null) {
  root
    .querySelectorAll('ul[data-tasks] > li:not([data-done])')
    .forEach((li) => li.setAttribute('data-done', 'false'))
  root.querySelectorAll('[data-done]').forEach((el) => {
    if (!isTaskItem(el)) el.removeAttribute('data-done')
  })
  root.querySelectorAll('[data-tasks]').forEach((el) => {
    if (el.tagName !== 'UL') el.removeAttribute('data-tasks')
  })
  if (fresh && isTaskItem(fresh)) fresh.setAttribute('data-done', 'false')
}

function caretInto(el: HTMLElement) {
  const sel = getSelection()
  if (!sel) return
  const r = document.createRange()
  r.setStart(el, 0)
  r.collapse(true)
  sel.removeAllRanges()
  sel.addRange(r)
}

const emptyParagraph = () => Object.assign(document.createElement('p'), { innerHTML: '<br>' })

/** Nach einem Codeblock einen Absatz anhängen, damit man darunter weiterschreiben kann. */
function ensureParagraphAfterCode(root: HTMLElement) {
  const pre = currentBlock(root)
  if (pre?.tagName === 'PRE' && pre.parentNode === root && !pre.nextElementSibling)
    pre.after(emptyParagraph())
}

/** Nach einer Linie steht der Cursor lose im Editor: in den folgenden (oder einen neuen) Absatz setzen. */
function caretAfterRule(root: HTMLElement) {
  const sel = getSelection()
  const range = sel?.rangeCount ? sel.getRangeAt(0) : null
  if (!range || range.startContainer !== root) return
  const next = root.childNodes[range.startOffset] ?? null
  if (next instanceof HTMLParagraphElement) return caretInto(next)
  const p = emptyParagraph()
  root.insertBefore(p, next)
  caretInto(p)
}

/**
 * Chrome legt neue Listen in den bisherigen Absatz (<p><ul>…</ul></p>). Das ist ungültiges HTML und
 * bringt Enter durcheinander: Absätze, die nur noch eine Liste enthalten, durch die Liste ersetzen.
 */
function unwrapLists(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>('p > ul, p > ol').forEach((list) => {
    const p = list.parentElement
    if (!p) return
    const onlyList = [...p.childNodes].every(
      (c) =>
        c === list || c instanceof HTMLBRElement || (c.nodeType === Node.TEXT_NODE && !c.nodeValue?.trim()),
    )
    if (onlyList) p.replaceWith(list)
  })
}

/** Position des Cursors als Zeichenzahl ab Anfang des Blocks. */
function caretOffset(block: HTMLElement | null): number | null {
  const sel = getSelection()
  if (!block || !sel?.rangeCount) return null
  const r = sel.getRangeAt(0).cloneRange()
  r.setStart(block, 0)
  return r.toString().length
}

/** Setzt den Cursor `offset` Zeichen hinter den Anfang von `block`. */
function placeCaret(block: HTMLElement, offset: number) {
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT)
  let left = offset
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const len = n.nodeValue?.length ?? 0
    if (left <= len) {
      const r = document.createRange()
      r.setStart(n, left)
      r.collapse(true)
      getSelection()?.removeAllRanges()
      getSelection()?.addRange(r)
      return
    }
    left -= len
  }
}

/**
 * Liste umschalten. Chrome legt neue Listen in den bisherigen Absatz und setzt den Cursor an den
 * Anfang des Punkts: beides hier korrigieren.
 */
function toggleList(root: HTMLElement, command: 'insertUnorderedList' | 'insertOrderedList') {
  const offset = caretOffset(currentBlock(root))
  document.execCommand(command)
  unwrapLists(root)
  const block = currentBlock(root)
  if (block && offset !== null && getSelection()?.isCollapsed) placeCaret(block, offset)
}

export function runCommand(root: HTMLElement, cmd: EditorCommand) {
  root.focus()
  document.execCommand('defaultParagraphSeparator', false, 'p')
  const block = currentBlock(root)
  const tag = block?.tagName ?? ''
  // Erneut klicken schaltet die Überschrift/das Zitat/den Codeblock zurück zum Absatz
  const toggleBlock = (t: string) =>
    document.execCommand('formatBlock', false, tag === t.toUpperCase() ? 'p' : t)
  switch (cmd) {
    case 'h1':
      toggleBlock('h2')
      break
    case 'h2':
      toggleBlock('h3')
      break
    case 'h3':
      toggleBlock('h4')
      break
    case 'quote':
      toggleBlock('blockquote')
      break
    case 'codeblock':
      toggleBlock('pre')
      ensureParagraphAfterCode(root)
      break
    case 'bold':
      document.execCommand('bold')
      break
    case 'italic':
      document.execCommand('italic')
      break
    case 'strike':
      document.execCommand('strikeThrough')
      break
    case 'ul':
      toggleList(root, 'insertUnorderedList')
      break
    case 'ol':
      toggleList(root, 'insertOrderedList')
      break
    case 'tasks': {
      if (isTaskItem(block)) {
        toggleTask(block)
        break
      }
      if (!(tag === 'LI' && block?.parentElement?.tagName === 'UL')) toggleList(root, 'insertUnorderedList')
      const ul = currentBlock(root)?.closest('ul')
      if (ul && root.contains(ul)) {
        ul.setAttribute('data-tasks', '')
        ul.querySelectorAll(':scope > li').forEach((li) => li.setAttribute('data-done', 'false'))
      }
      break
    }
    case 'hr':
      document.execCommand('insertHorizontalRule')
      caretAfterRule(root)
      break
    case 'code': {
      const text = getSelection()?.toString()
      if (text) document.execCommand('insertHTML', false, `<code>${esc(text)}</code>&#8203;`)
      break
    }
  }
  root.dispatchEvent(new Event('input', { bubbles: true }))
}

/** Enter im Codeblock: Zeilenumbruch statt neuem Block. true = behandelt. */
export function lineBreakInCodeBlock(root: HTMLElement): boolean {
  if (currentBlock(root)?.tagName !== 'PRE') return false
  if (!document.execCommand('insertLineBreak')) document.execCommand('insertHTML', false, '<br>')
  return true
}

/* ---------- Links ---------- */

/** Link, in dem die Auswahl steht. */
export function linkAt(root: HTMLElement, range: Range | null): HTMLAnchorElement | null {
  const n = range?.startContainer
  const el = n instanceof Element ? n : n?.parentElement
  const a = el?.closest('a')
  return a && root.contains(a) ? a : null
}

/** Aktuelle Auswahl im Editor (zum Merken, bevor der Fokus in ein Popover wandert). */
export function editorRange(root: HTMLElement): Range | null {
  const sel = getSelection()
  if (!sel?.rangeCount) return null
  const range = sel.getRangeAt(0)
  return root.contains(range.commonAncestorContainer) ? range.cloneRange() : null
}

function restore(root: HTMLElement, range: Range | null) {
  root.focus()
  const sel = getSelection()
  if (!sel || !range) return
  sel.removeAllRanges()
  sel.addRange(range)
}

/** Setzt einen Link auf die Auswahl; ohne Auswahl wird die Adresse als Linktext eingefügt. */
export function applyLink(root: HTMLElement, range: Range | null, url: string) {
  const existing = linkAt(root, range)
  if (existing) existing.setAttribute('href', url)
  else {
    restore(root, range)
    if (range && !range.collapsed) document.execCommand('createLink', false, url)
    else document.execCommand('insertHTML', false, `<a href="${esc(url)}">${esc(url)}</a>&#8203;`)
  }
  root.dispatchEvent(new Event('input', { bubbles: true }))
}

export function removeLink(root: HTMLElement, range: Range | null) {
  const a = linkAt(root, range)
  if (!a) return
  const r = document.createRange()
  r.selectNodeContents(a)
  restore(root, r)
  document.execCommand('unlink')
  root.dispatchEvent(new Event('input', { bubbles: true }))
}

/* ---------- Kürzel ---------- */

/** Markdown-Kürzel am Zeilenanfang: "- ", "1. ", "# ", "## ", "### ", "> ", "[] ", "``` " */
const LINE_SHORTCUTS: Record<string, EditorCommand> = {
  '-': 'ul',
  '*': 'ul',
  '1.': 'ol',
  '#': 'h1',
  '##': 'h2',
  '###': 'h3',
  '>': 'quote',
  '[]': 'tasks',
  '[ ]': 'tasks',
  '```': 'codeblock',
}

/** Wendet ein Kürzel an, falls der Text vor dem Cursor eines ist. true = angewendet. */
export function applyLineShortcut(root: HTMLElement): boolean {
  const block = currentBlock(root)
  const sel = getSelection()
  if (!block || block.tagName === 'LI' || block.tagName === 'PRE' || !sel?.isCollapsed || !sel.anchorNode)
    return false
  const before = sel.getRangeAt(0).cloneRange()
  before.setStart(block, 0)
  const cmd = LINE_SHORTCUTS[before.toString()]
  if (!cmd) return false
  const typed = document.createRange()
  typed.setStart(block, 0)
  typed.setEnd(sel.anchorNode, sel.anchorOffset)
  sel.removeAllRanges()
  sel.addRange(typed)
  document.execCommand('delete')
  runCommand(root, cmd)
  return true
}
