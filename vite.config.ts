import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

const FONT_PACKAGES = ['@fontsource-variable/inter', '@fontsource-variable/jetbrains-mono']

// Die OFL verlangt, dass Copyright und Lizenztext mit den Schriften (src/styles/fonts.css) weitergegeben
// werden. Die Texte kommen aus den installierten Paketen, damit sie zur ausgelieferten Version passen.
function fontLicenses(): Plugin {
  const require = createRequire(import.meta.url)
  return {
    name: 'font-licenses',
    apply: 'build',
    generateBundle() {
      const source = FONT_PACKAGES.map(
        (pkg) => `${pkg}\n\n${readFileSync(require.resolve(`${pkg}/LICENSE`), 'utf8').trim()}\n`,
      ).join('\n\n')
      this.emitFile({ type: 'asset', fileName: 'fonts-LICENSE.txt', source })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), fontLicenses()],
  server: {
    // Backend (Spring Boot) läuft lokal auf :8080; der Proxy erspart CORS im Dev-Betrieb
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: { modules: { classNameStrategy: 'non-scoped' } },
    restoreMocks: true,
  },
})
