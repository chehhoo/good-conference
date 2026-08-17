import { useState, useEffect, useRef, useCallback } from 'react'
import QRCode from 'react-qr-code'
import { QrCode, Maximize2, X } from 'lucide-react'
import { useAuth } from '../auth-context'

// ── Full-screen badge overlay ─────────────────────────────────────────────────

function BadgeOverlay({ uid, displayName, onClose }: {
  uid: string; displayName: string; onClose: () => void
}) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen')
        .then(lock => { wakeLockRef.current = lock })
        .catch(() => {})
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && 'wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then(lock => { wakeLockRef.current = lock }).catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      wakeLockRef.current?.release().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6"
      style={{ background: '#FFFFFF' }} onClick={onClose}>
      <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full"
        style={{ background: 'rgba(0,0,0,0.07)', color: '#1A1A1A' }} aria-label="Close">
        <X size={20} />
      </button>
      <div className="p-4 rounded-3xl" style={{ boxShadow: '0 0 0 3px rgba(0,0,0,0.06)' }}>
        <QRCode value={uid} size={Math.min(window.innerWidth - 80, 300)} />
      </div>
      <div className="text-center px-6">
        <p className="font-black text-4xl tracking-tight leading-none" style={{ color: '#111111' }}>{displayName}</p>
        <p className="mt-2 text-sm font-medium" style={{ color: '#999999' }}>出示此碼給工作人員 · Show to staff</p>
      </div>
      <p className="absolute bottom-8 text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(0,0,0,0.25)' }}>
        點擊任意處關閉 · Tap anywhere to close
      </p>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MyQR() {
  const { person } = useAuth()
  const displayName = person?.chineseName || (person ? `${person.firstName} ${person.lastName}` : '')
  const uid = person?.uid || (person ? String(person.id) : null)
  const [badgeOpen, setBadgeOpen] = useState(false)
  const openBadge = useCallback(() => setBadgeOpen(true), [])
  const closeBadge = useCallback(() => setBadgeOpen(false), [])

  return (
    <>
      {badgeOpen && uid && <BadgeOverlay uid={uid} displayName={displayName} onClose={closeBadge} />}

      <div className="max-w-sm mx-auto px-4 py-6 flex flex-col items-center gap-5">
        <div className="w-full rounded-3xl p-6 flex flex-col items-center gap-4 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
            style={{ color: 'var(--text-dim)' }}>
            <QrCode size={14} />
            入場 QR · Check-in Code
          </div>

          {uid ? (
            <div className="p-3 bg-white rounded-2xl">
              <QRCode value={uid} size={220} />
            </div>
          ) : (
            <div className="w-[220px] h-[220px] rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--surface2)' }}>
              <span className="text-sm text-center px-4" style={{ color: 'var(--text-dim)' }}>尚未分配 QR 碼</span>
            </div>
          )}

          <div className="text-center">
            <p className="text-lg font-black" style={{ color: 'var(--text)' }}>{displayName}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>出示此碼給工作人員掃描 · Show to staff</p>
          </div>

          {uid && (
            <button
              onClick={openBadge}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold w-full justify-center"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              <Maximize2 size={15} />
              顯示大碼 · Show Full Badge
            </button>
          )}
        </div>

        <p className="text-xs text-center px-4" style={{ color: 'var(--text-dim)' }}>
          工作人員會掃描此碼為您報到或取餐。<br />
          Staff will scan this code for check-in and meal pickup.
        </p>
      </div>
    </>
  )
}
