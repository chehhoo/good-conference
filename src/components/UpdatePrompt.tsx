import { useRegisterSW } from 'virtual:pwa-register/react'

export function UpdatePrompt() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW()

  if (!needRefresh) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[300] flex items-center justify-between gap-3 px-4 py-3 text-sm font-semibold"
      style={{ background: 'var(--gold)', color: '#1a1200' }}
    >
      <span>新版本可用 · Update available</span>
      <button
        onClick={() => updateServiceWorker(true)}
        className="px-3 py-1.5 rounded-lg text-xs font-bold shrink-0"
        style={{ background: 'rgba(0,0,0,0.15)', color: '#1a1200' }}
      >
        重新載入 Reload
      </button>
    </div>
  )
}
