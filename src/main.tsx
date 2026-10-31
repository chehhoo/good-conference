// Apply saved theme before React renders to avoid flash
const savedTheme = localStorage.getItem('gc_theme') ?? 'dark'
document.documentElement.setAttribute('data-theme', savedTheme)

// Hidden clock mock: ?mockDate=2026-12-26T10:00:00 fakes the system date for the whole app.
// Works in production too (for testing conference-day views on the real site).
// Offset is saved to sessionStorage so it survives in-app navigation; clears when tab closes.
;(() => {
  const urlParam = new URLSearchParams(location.search).get('mockDate')
  const stored = sessionStorage.getItem('gc_mock_offset')
  let offset: number | null = null

  if (urlParam) {
    const fakeNow = new Date(urlParam).getTime()
    if (!isNaN(fakeNow)) {
      offset = fakeNow - Date.now()
      sessionStorage.setItem('gc_mock_offset', String(offset))
    }
  } else if (stored) {
    offset = Number(stored)
  }

  if (offset != null) {
    const _Date = Date
    class MockDate extends _Date {
      constructor(...args: ConstructorParameters<typeof Date>) {
        if (args.length) { super(...args) } else { super(_Date.now() + offset!) }
      }
      static now() { return _Date.now() + offset! }
      static override [Symbol.hasInstance](val: unknown) { return val instanceof _Date }
    }
    // @ts-expect-error intentional clock replacement for conference-day testing
    window.Date = MockDate
    console.info(`[mockDate] 🕐 Clock set to ${new _Date(_Date.now() + offset).toLocaleString()}`)
  }
})()

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { AuthProvider } from './auth-context'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 7 * 24 * 60 * 60 * 1000, // keep cache 7 days for offline use
    },
  },
})

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'gc_query_cache',
  throttleTime: 2000,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        buster: __APP_VERSION__,
      }}
    >
      <AuthProvider>
        <App />
      </AuthProvider>
    </PersistQueryClientProvider>
  </StrictMode>,
)
