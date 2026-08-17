import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import QRCode from 'react-qr-code'
import { QrCode, Utensils, Maximize2, X } from 'lucide-react'
import { myApi, type MealDay } from '../api/client'
import { useAuth } from '../auth-context'

const MEAL_LABELS: { key: keyof MealDay; zh: string; emoji: string }[] = [
  { key: 'breakfast', zh: '早餐', emoji: '🌅' },
  { key: 'lunch',     zh: '午餐', emoji: '☀️' },
  { key: 'dinner',    zh: '晚餐', emoji: '🌙' },
]

function MealPill({ value }: { value: boolean | null }) {
  if (value === true)
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>✓ 有</span>
  if (value === false)
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'var(--border)', color: 'var(--text-dim)' }}>無</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'var(--border2)', color: 'var(--text-dim)' }}>—</span>
}

function BadgeOverlay({ uid, displayName, onClose }: {
  uid: string; displayName: string; onClose: () => void
}) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  useEffect(() => {
    // Request screen wake lock so display doesn't dim while badge is shown
    if ('wakeLock' in navigator) {
      navigator.wakeLock.request('screen')
        .then(lock => { wakeLockRef.current = lock })
        .catch(() => { /* gracefully ignore — not all browsers support it */ })
    }
    // Re-acquire if page becomes visible again (e.g. user switches apps)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && 'wakeLock' in navigator) {
        navigator.wakeLock.request('screen')
          .then(lock => { wakeLockRef.current = lock })
          .catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      wakeLockRef.current?.release().catch(() => {})
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6"
      style={{ background: '#FFFFFF' }}
      onClick={onClose}
    >
      {/* Close hint */}
      <button
        onClick={onClose}
        className="absolute top-5 right-5 p-2 rounded-full"
        style={{ background: 'rgba(0,0,0,0.07)', color: '#1A1A1A' }}
        aria-label="Close badge"
      >
        <X size={20} />
      </button>

      {/* QR — sized to fill most of the screen */}
      <div className="p-4 rounded-3xl" style={{ background: '#FFFFFF', boxShadow: '0 0 0 3px rgba(0,0,0,0.06)' }}>
        <QRCode value={uid} size={Math.min(window.innerWidth - 80, 300)} />
      </div>

      {/* Name */}
      <div className="text-center px-6">
        <p className="font-black text-4xl tracking-tight leading-none" style={{ color: '#111111' }}>
          {displayName}
        </p>
        <p className="mt-2 text-sm font-medium" style={{ color: '#999999' }}>
          出示此碼給工作人員 · Show to staff
        </p>
      </div>

      {/* Tap-anywhere hint */}
      <p className="absolute bottom-8 text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(0,0,0,0.25)' }}>
        點擊任意處關閉 · Tap anywhere to close
      </p>
    </div>
  )
}

export default function MyQR() {
  const { person } = useAuth()
  const personId = person?.id ?? null
  const displayName = person?.chineseName || (person ? `${person.firstName} ${person.lastName}` : '')
  const uid = person?.uid || (person ? String(person.id) : null)
  const [badgeOpen, setBadgeOpen] = useState(false)

  const openBadge = useCallback(() => setBadgeOpen(true), [])
  const closeBadge = useCallback(() => setBadgeOpen(false), [])

  // Close on Escape key
  useEffect(() => {
    if (!badgeOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeBadge() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [badgeOpen, closeBadge])

  const { data: family } = useQuery({
    queryKey: ['my-family', personId],
    queryFn: myApi.family,
    staleTime: 60_000,
  })

  const me = family?.members.find(m => m.isMe)
  const meals = me?.meals ?? {}

  return (
    <>
      {badgeOpen && uid && (
        <BadgeOverlay uid={uid} displayName={displayName} onClose={closeBadge} />
      )}

      <div className="max-w-sm mx-auto px-4 py-6 flex flex-col items-center gap-5">

        {/* QR code card */}
        <div className="w-full rounded-3xl p-6 flex flex-col items-center gap-4 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--text-dim)' }}>
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

          {/* Full-screen badge button */}
          {uid && (
            <button
              onClick={openBadge}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold w-full justify-center transition-colors"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <Maximize2 size={15} />
              顯示大碼 · Show Full Badge
            </button>
          )}
        </div>

        {/* Meal plan card */}
        <div className="w-full rounded-3xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase mb-4" style={{ color: 'var(--text-dim)' }}>
            <Utensils size={13} />
            餐食計劃 · Meal Plan
          </div>

          {Object.keys(meals).length === 0 ? (
            <p className="text-sm text-center py-2" style={{ color: 'var(--text-dim)' }}>無餐食資料 No meal data</p>
          ) : (
            <div className="space-y-5">
              {Object.entries(meals)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([day, mealDay]) => (
                  <div key={day}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>
                      第 {day} 天 · Day {day}
                    </p>
                    <div className="space-y-1.5">
                      {MEAL_LABELS.map(({ key, zh, emoji }) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm" style={{ color: 'var(--text-mid)' }}>{emoji} {zh}</span>
                          <MealPill value={mealDay[key]} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
