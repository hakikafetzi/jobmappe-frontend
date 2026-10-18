import '@tanstack/react-query'
import type { MutationErrorMeta } from './errors'

declare module '@tanstack/react-query' {
  interface Register {
    mutationMeta: MutationErrorMeta
  }
}
