import { ServerCrash } from 'lucide-react'

interface Props {
  onRetry?: () => void
}

export function ApiErrorCard({ onRetry }: Props) {
  return (
    <div className="rounded-2xl p-5 border space-y-3"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-3">
        <ServerCrash size={22} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <div>
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            無法連線伺服器 · Cannot reach server
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
            請稍後再試，或聯繫大會工作人員。
            <br />
            Please try again, or find a conference organizer.
          </p>
        </div>
      </div>

      <p className="text-xs leading-relaxed rounded-xl px-3 py-2"
        style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}>
        💡 如在深夜（00:00–08:00），伺服器可能正在進行例行維護，請 8 點後再試。
        <br />
        If this is between midnight and 8am, the server may be under scheduled maintenance — please try again after 8am.
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="w-full py-2 rounded-xl text-sm font-bold"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          重試 · Retry
        </button>
      )}
    </div>
  )
}
