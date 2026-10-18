import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cx } from '../lib/cx'
import { ToastContext, type ShowToast, type ToastOptions } from './toastContext'
import styles from './Toast.module.css'

type Item = { id: number; message: string; options: ToastOptions; leaving: boolean }

const DURATION = { plain: 2200, action: 5200, error: 4200 }
const LEAVE_MS = 260

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Item[]>([])
  const seq = useRef(0)
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())

  const later = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.current.delete(t)
      fn()
    }, ms)
    timers.current.add(t)
  }, [])

  // Offene Timer beim Unmount aufräumen
  useEffect(() => {
    const pending = timers.current
    return () => pending.forEach(clearTimeout)
  }, [])

  const remove = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), [])

  const show = useCallback<ShowToast>(
    (message, options = {}) => {
      const id = ++seq.current
      setItems((l) => [...l, { id, message, options, leaving: false }])
      const ms = options.action ? DURATION.action : options.tone === 'error' ? DURATION.error : DURATION.plain
      later(() => {
        setItems((l) => l.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
        later(() => remove(id), LEAVE_MS)
      }, ms)
    },
    [later, remove],
  )

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={styles.region} role="status" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={cx(
              styles.toast,
              t.leaving && styles.leaving,
              t.options.tone === 'error' && styles.error,
            )}
          >
            <span className={styles.mark} aria-hidden="true">
              {t.options.tone === 'error' ? '!' : '✓'}
            </span>
            {t.message}
            {t.options.action && (
              <button
                type="button"
                className={styles.action}
                onClick={() => {
                  t.options.action?.onClick()
                  remove(t.id)
                }}
              >
                {t.options.action.label}
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
