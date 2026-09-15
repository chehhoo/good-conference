import { useEffect, useRef } from 'react'
import QRCode from 'react-qr-code'
import { X } from 'lucide-react'

export default function BadgeOverlay({ uid, displayName, onClose }: {
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
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6"
      style={{ background: '#FFFFFF' }}
      onClick={onClose}
    >
      <button onClick={onClose} className="absolute top-5 right-5 p-2 rounded-full" style={{ background: 'rgba(0,0,0,0.07)', color: '#1A1A1A' }} aria-label="Close">
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
