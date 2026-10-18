import { useState } from 'react'
// Aus react-router/dom: nur damit wirken flushSync-Navigationen (animierter Ansichtswechsel)
import { RouterProvider } from 'react-router/dom'
import { AppProviders } from './providers'
import { createAppRouter } from './router'

export function App() {
  const [router] = useState(createAppRouter)
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  )
}
