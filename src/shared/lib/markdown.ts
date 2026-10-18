// Kleiner Markdown-Renderer. Escaped den Text, bevor Formatierung
// eingesetzt wird — das Ergebnis ist daher sicher für dangerouslySetInnerHTML.

export function esc(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  )
}

/** Nur diese Adressen werden zu Links (kein javascript: usw.). */
export const isSafeUrl = (url: string) => /^(https?:\/\/\S|mailto:\S)/i.test(url.trim())

const formatInline = (escaped: string) =>
  escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+?)\*/g, '$1<em>$2</em>')
    .replace(/~~(.+?)~~/g, '<s>$1</s>')
    .replace(/`([^`\n]+?)`/g, '<code>$1</code>')

const LINK = /\[([^\]\n]+)\]\(([^)\s]+)\)/g

const inline = (t: string) => {
  // Links zuerst durch Platzhalter (Private-Use-Zeichen) ersetzen, damit Formatierung nicht in die Adresse greift
  const links: string[] = []
  const withTokens = t.replace(LINK, (whole, text: string, url: string) => {
    if (!isSafeUrl(url)) return whole
    links.push(
      `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${formatInline(esc(text))}</a>`,
    )
    return `\uE000${links.length - 1}\uE000`
  })
  return formatInline(esc(withTokens)).replace(/\uE000(\d+)\uE000/g, (_, i: string) => links[Number(i)] ?? '')
}

const TASK = /^\s*[-*]\s+\[([ xX])\](?:\s+|$)/
const UL = /^\s*[-*•]\s+/
const OL = /^\s*\d+[.)]\s+/
const HR = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/
const FENCE = /^\s*```/

export function md(src: string | null | undefined): string {
  if (!src || !src.trim()) return ''
  const out: string[] = []
  let list: string[] | null = null
  let lt: 'ul' | 'ol' | 'tasks' = 'ul'
  let code: string[] | null = null
  const close = () => {
    if (list) {
      out.push(lt === 'tasks' ? `<ul data-tasks="">${list.join('')}</ul>` : `<${lt}>${list.join('')}</${lt}>`)
      list = null
    }
  }
  const openList = (t: typeof lt) => {
    if (list && lt !== t) close()
    lt = t
    return (list = list ?? [])
  }
  for (const raw of src.replace(/\r/g, '').split('\n')) {
    if (code) {
      if (FENCE.test(raw)) {
        out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`)
        code = null
      } else code.push(raw)
      continue
    }
    const line = raw.trimEnd()
    const task = TASK.exec(line)
    if (task) {
      const done = task[1] !== ' '
      openList('tasks').push(`<li data-done="${done}">${inline(line.slice(task[0].length))}</li>`)
      continue
    }
    const ul = UL.test(line) && !HR.test(line)
    const ol = OL.test(line)
    if (ul || ol) {
      openList(ul ? 'ul' : 'ol').push('<li>' + inline(line.replace(ul ? UL : OL, '')) + '</li>')
      continue
    }
    close()
    if (!line.trim()) continue
    const h = /^(#{1,6})\s+/.exec(line)
    if (FENCE.test(line)) code = []
    else if (HR.test(line)) out.push('<hr>')
    else if (/^>\s?/.test(line))
      out.push('<blockquote>' + inline(line.replace(/^>\s?/, '')) + '</blockquote>')
    else if (h) {
      const level = h[1]?.length ?? 3
      const tg = level === 1 ? 'h2' : level === 2 ? 'h3' : 'h4'
      out.push(`<${tg}>` + inline(line.replace(/^#{1,6}\s+/, '')) + `</${tg}>`)
    } else out.push('<p>' + inline(line) + '</p>')
  }
  close()
  // Nicht geschlossener Codeblock: bis zum Ende als Code
  if (code) out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`)
  return out.join('')
}

/* ---------- HTML → Markdown (für den WYSIWYG-Editor) ---------- */

function mdInline(node: Node): string {
  let out = ''
  node.childNodes.forEach((c) => {
    if (c.nodeType === Node.TEXT_NODE) {
      out += (c.nodeValue ?? '').replace(/ /g, ' ').replace(/​/g, '')
      return
    }
    if (!(c instanceof Element)) return
    const t = c.tagName
    if (t === 'BR') {
      out += '\n'
      return
    }
    const inner = mdInline(c)
    if (!inner.trim()) {
      out += inner
      return
    }
    if (t === 'B' || t === 'STRONG') out += `**${inner}**`
    else if (t === 'I' || t === 'EM') out += `*${inner}*`
    else if (t === 'S' || t === 'DEL' || t === 'STRIKE') out += `~~${inner}~~`
    else if (t === 'CODE') out += '`' + inner + '`'
    else if (t === 'A') {
      const href = c.getAttribute('href') ?? ''
      out += isSafeUrl(href)
        ? `[${inner.replace(/\n+/g, ' ')}](${href.trim().replace(/\)/g, '%29').replace(/\s/g, '%20')})`
        : inner
    } else out += inner
  })
  return out
}

/** Text eines Codeblocks; Zeilenumbrüche aus <br> und Zeilen-<div>s des Editors. */
function preText(node: Node): string {
  let out = ''
  node.childNodes.forEach((c) => {
    if (c.nodeType === Node.TEXT_NODE) out += (c.nodeValue ?? '').replace(/ /g, ' ').replace(/​/g, '')
    else if (c instanceof Element && c.tagName === 'BR') out += '\n'
    else if (c instanceof Element && /^(DIV|P)$/.test(c.tagName))
      out += (out && !out.endsWith('\n') ? '\n' : '') + preText(c)
    else out += preText(c)
  })
  return out
}

export function htmlToMd(root: Element): string {
  const blocks: string[] = []
  let loose = ''
  const flush = () => {
    if (loose.trim()) blocks.push(loose.trim())
    loose = ''
  }
  const line = (t: string) => t.replace(/\n+/g, ' ').trim()
  const walk = (el: Element) => {
    el.childNodes.forEach((c) => {
      if (c.nodeType === Node.TEXT_NODE) {
        loose += c.nodeValue ?? ''
        return
      }
      if (!(c instanceof Element)) return
      const t = c.tagName
      if (t === 'H1' || t === 'H2') {
        flush()
        const x = line(mdInline(c))
        if (x) blocks.push('# ' + x)
      } else if (t === 'H3') {
        flush()
        const x = line(mdInline(c))
        if (x) blocks.push('## ' + x)
      } else if (/^H[4-6]$/.test(t)) {
        flush()
        const x = line(mdInline(c))
        if (x) blocks.push('### ' + x)
      } else if (t === 'UL' || t === 'OL') {
        flush()
        const tasks = t === 'UL' && c.hasAttribute('data-tasks')
        const items = [...c.querySelectorAll(':scope > li')]
          .map((li, i) => {
            const text = line(mdInline(li))
            if (!text) return ''
            if (tasks) return `- [${li.getAttribute('data-done') === 'true' ? 'x' : ' '}] ${text}`
            return (t === 'OL' ? `${i + 1}. ` : '- ') + text
          })
          .filter(Boolean)
        if (items.length) blocks.push(items.join('\n'))
      } else if (t === 'BLOCKQUOTE') {
        flush()
        const x = line(mdInline(c))
        if (x) blocks.push('> ' + x)
      } else if (t === 'HR') {
        flush()
        blocks.push('---')
      } else if (t === 'PRE') {
        flush()
        const x = preText(c).replace(/^\n+|\n+$/g, '')
        if (x.trim()) blocks.push('```\n' + x + '\n```')
      } else if (t === 'P' || t === 'DIV') {
        flush()
        if (c.querySelector('ul,ol,h1,h2,h3,h4,p,div,blockquote,pre,hr')) walk(c)
        else
          mdInline(c)
            .split('\n')
            .map((y) => y.trim())
            .filter(Boolean)
            .forEach((y) => blocks.push(y))
      } else if (t === 'BR') flush()
      else loose += mdInline(c)
    })
  }
  walk(root)
  flush()
  return blocks.join('\n\n')
}

/** Eingefügtes HTML inert parsen (DOMParser führt keine Skripte/Handler aus). */
export function pastedHtmlToMd(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  doc.querySelectorAll('script,style').forEach((x) => x.remove())
  return htmlToMd(doc.body)
}
