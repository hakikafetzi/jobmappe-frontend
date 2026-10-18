import { useRef, useState, type RefObject } from 'react'
import { isSafeUrl } from '../lib/markdown'
import { Button } from '../ui/Button'
import { TextInput } from '../ui/Field'
import { useAnchoredPopover } from '../ui/useAnchoredPopover'
import { applyLink, editorRange, linkAt, removeLink } from './commands'
import styles from './LinkPopover.module.css'

/** Link-Knopf der Toolbar: fragt die Adresse in einem Popover ab und setzt sie auf die Auswahl. */
export function LinkPopover({
  editorRef,
  className,
}: {
  editorRef: RefObject<HTMLDivElement | null>
  className?: string
}) {
  const { open, anchorRef, buttonRef, popoverRef, buttonProps, popoverProps, close, closeToButton } =
    useAnchoredPopover()
  // Auswahl im Editor, bevor der Fokus ins Popover wandert
  const rangeRef = useRef<Range | null>(null)
  const [url, setUrl] = useState('')
  const [hasLink, setHasLink] = useState(false)
  const [error, setError] = useState(false)

  const remember = () => {
    const root = editorRef.current
    if (!root || open) return
    rangeRef.current = editorRange(root)
    const link = linkAt(root, rangeRef.current)
    setHasLink(!!link)
    setUrl(link?.getAttribute('href') ?? '')
    setError(false)
  }

  const finish = (action: (root: HTMLDivElement) => void) => {
    const root = editorRef.current
    if (!root) return
    close()
    action(root)
  }

  const submit = () => {
    const value = url.trim()
    const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(value) ? value : `https://${value}`
    if (!value || !isSafeUrl(withScheme)) {
      setError(true)
      return
    }
    finish((root) => applyLink(root, rangeRef.current, withScheme))
  }

  return (
    <div ref={anchorRef} className={styles.anchor}>
      <button
        type="button"
        ref={buttonRef}
        className={className}
        title="Link (Strg+K)"
        aria-label="Link (Strg+K)"
        data-link-button=""
        {...buttonProps}
        onMouseDown={(e) => e.preventDefault()} // Auswahl im Editor behalten
        onClickCapture={remember}
      >
        Link
      </button>
      <div
        className={styles.popover}
        role="dialog"
        aria-label="Link einfügen"
        ref={popoverRef}
        {...popoverProps}
      >
        {open && (
          <div className={styles.body}>
            <TextInput
              compact
              autoFocus
              type="url"
              aria-label="Adresse des Links"
              aria-invalid={error || undefined}
              placeholder="https://…"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                setError(false)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  submit()
                } else if (e.key === 'Escape') {
                  e.preventDefault()
                  closeToButton()
                }
              }}
            />
            {error && (
              <div className={styles.error} role="alert">
                Nur http(s)- oder mailto-Links
              </div>
            )}
            <div className={styles.actions}>
              {hasLink && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => finish((root) => removeLink(root, rangeRef.current))}
                >
                  Link entfernen
                </Button>
              )}
              <Button size="sm" variant="primary" onClick={submit}>
                Übernehmen
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
