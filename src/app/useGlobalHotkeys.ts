import type { NavigateFunction } from 'react-router'
import { modKey, plainKey, useHotkey } from '../shared/hooks/useHotkey'
import { isModalDialogOpen } from '../shared/lib/dom'
import { paths } from './paths'

/**
 * Tastenkürzel: N neue Stelle, 1–3 Hauptbereiche. ⌘K/Strg+K öffnet die Command
 * Palette — auch aus Eingabefeldern und bei offenem Notizfenster, nicht aber über einem anderen
 * Modal. Der Notiz-Editor nutzt ⌘K selbst (Link) und verhindert dann das Öffnen (defaultPrevented).
 */
export function useGlobalHotkeys({
  navigate,
  openNewPosting,
  openCommandPalette,
}: {
  navigate: NavigateFunction
  openNewPosting: () => void
  openCommandPalette: () => void
}) {
  useHotkey(
    modKey('k'),
    (e) => {
      if (isModalDialogOpen()) return
      e.preventDefault()
      openCommandPalette()
    },
    { whileTyping: true, inDialog: true },
  )
  useHotkey(plainKey('n'), (e) => {
    e.preventDefault()
    openNewPosting()
  })
  useHotkey(plainKey('1'), () => void navigate(paths.home()))
  useHotkey(plainKey('2'), () => void navigate(paths.postings()))
  useHotkey(plainKey('3'), () => void navigate(paths.applications()))
}
