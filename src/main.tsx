// Apply saved theme before React renders to avoid flash
const savedTheme = localStorage.getItem('gc_theme') ?? 'dark'
document.documentElement.setAttribute('data-theme', savedTheme)

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
