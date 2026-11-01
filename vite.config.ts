import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json'

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['cclife-logo.webp', 'login-bg.webp'],
      manifest: {
        id: '/',
        scope: '/',
        lang: 'zh-TW',
        name: '中國福音大會 & Grace Conference 2026',
        short_name: 'CGC 2026',
        description: '中國福音大會 暨 Grace Conference 2026 大會入口',
        theme_color: '#0B1629',
        background_color: '#0B1629',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            // Cache GET /api/schedule and /api/conference/* (non-auth, non-OTP) with NetworkFirst
            // Auth and OTP endpoints are excluded — they must always reach the server.
            // We do NOT cache per-person endpoints (my/family, my/meal-scans, my/sms-consent)
            // because serving stale person data to a different user after logout is a privacy risk.
            // Those endpoints refresh on every login anyway.
            urlPattern: ({ url, request }: { url: URL; request: Request }) => {
              if (request.method !== 'GET') return false
              if (!url.pathname.startsWith('/api/')) return false
              const excluded = ['/api/conference/login', '/api/conference/otp/', '/api/conference/switch-member',
                '/api/conference/my/']
              return !excluded.some(p => url.pathname.startsWith(p))
            },
            handler: 'NetworkFirst' as const,
            options: {
              cacheName: 'api-schedule-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8090',
        changeOrigin: true,
      },
    },
  },
})
