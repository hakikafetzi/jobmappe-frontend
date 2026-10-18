import { describe, expect, it } from 'vitest'
import { htmlToMd, md, pastedHtmlToMd } from './markdown'

const toDom = (html: string) => {
  const el = document.createElement('div')
  el.innerHTML = html
  return el
}

describe('md', () => {
  it('rendert Überschriften, Listen und Inline-Formatierung', () => {
    expect(md('## Aufgaben\n\n- **Java** und *Spring*\n- `SQL`')).toBe(
      '<h3>Aufgaben</h3><ul><li><strong>Java</strong> und <em>Spring</em></li><li><code>SQL</code></li></ul>',
    )
  })

  it('escaped HTML, bevor formatiert wird (kein XSS)', () => {
    const html = md('<img src=x onerror=alert(1)> **<script>alert(1)</script>**')
    expect(html).not.toContain('<img')
    expect(html).not.toContain('<script')
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;')
  })

  it('liefert für leeren Text einen leeren String', () => {
    expect(md('')).toBe('')
    expect(md('   \n  ')).toBe('')
    expect(md(null)).toBe('')
  })

  it('unterscheidet nummerierte Listen und Zitate', () => {
    expect(md('1. eins\n2. zwei\n> Zitat')).toBe(
      '<ol><li>eins</li><li>zwei</li></ol><blockquote>Zitat</blockquote>',
    )
  })

  it('rendert Durchgestrichenes, Trennlinien und Codeblöcke', () => {
    expect(md('~~alt~~ neu\n\n---\n\n```\nconst a = 1\n\n<b>\n```')).toBe(
      '<p><s>alt</s> neu</p><hr><pre><code>const a = 1\n\n&lt;b&gt;</code></pre>',
    )
  })

  it('rendert Links nur für http(s) und mailto', () => {
    expect(md('[Seite](https://example.com/a_*b*)')).toBe(
      '<p><a href="https://example.com/a_*b*" target="_blank" rel="noopener noreferrer">Seite</a></p>',
    )
    expect(md('[böse](javascript:alert(1))')).not.toContain('<a')
  })

  it('rendert Checklisten getrennt von normalen Listen', () => {
    expect(md('- [ ] offen\n- [x] erledigt\n- normal')).toBe(
      '<ul data-tasks=""><li data-done="false">offen</li><li data-done="true">erledigt</li></ul><ul><li>normal</li></ul>',
    )
  })
})

describe('htmlToMd', () => {
  it('ist die Umkehrung von md für die Grundformen', () => {
    const source = '# Titel\n\nText mit **fett** und *kursiv*\n\n- a\n- b\n\n> Zitat'
    expect(htmlToMd(toDom(md(source)))).toBe(source)
  })

  it('ist die Umkehrung von md für die erweiterten Formen', () => {
    const source = [
      '### Klein',
      '~~weg~~ und [Link](https://example.com/x)',
      '---',
      '- [ ] offen\n- [x] erledigt',
      '```\nzeile 1\n\nzeile 3\n```',
    ].join('\n\n')
    expect(htmlToMd(toDom(md(source)))).toBe(source)
  })

  it('übernimmt nur sichere Links und Zeilen aus Codeblöcken des Editors', () => {
    expect(htmlToMd(toDom('<p><a href="javascript:x">a</a> <s>b</s></p><pre>x<br>y<div>z</div></pre>'))).toBe(
      'a ~~b~~\n\n```\nx\ny\nz\n```',
    )
  })

  it('entfernt Skripte aus eingefügtem HTML', () => {
    expect(pastedHtmlToMd('<p>Hallo</p><script>alert(1)</script>')).toBe('Hallo')
  })
})
