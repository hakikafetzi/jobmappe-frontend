/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Basis-URL der Backend-API, Standard: `/api` (Vite-Proxy auf :8080). */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
