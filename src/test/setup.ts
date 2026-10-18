import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { resetBackend, server } from './msw'

/* ---- Browser-APIs, die jsdom nicht (vollständig) kennt ---- */

if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

// <dialog>.showModal/show/close: jsdom setzt nur das open-Attribut nicht zuverlässig
if (!HTMLDialogElement.prototype.show) {
  HTMLDialogElement.prototype.show = function show(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
}
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open')
  }
}

// Die Stellen-Liste scrollt die gewählte Zeile in Sicht; jsdom kennt kein Layout
if (!Element.prototype.scrollIntoView) Element.prototype.scrollIntoView = () => {}

// Der Editor nutzt execCommand; in jsdom ohne Wirkung
if (!document.execCommand) document.execCommand = () => false

/* ---- Fake-Backend pro Test ---- */

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
beforeEach(() => {
  resetBackend()
})
afterEach(() => {
  cleanup()
  server.resetHandlers()
  localStorage.clear()
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.motion
})
afterAll(() => server.close())
