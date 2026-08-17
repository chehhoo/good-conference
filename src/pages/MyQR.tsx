import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import QRCode from 'react-qr-code'
import { QrCode, Utensils, Maximize2, X, CheckCircle2, Clock, Minus } from 'lucide-react'
import { myApi, type MealDay, type MealScanRecord } from '../api/client'
import { useAuth } from '../auth-context'

// ── helpers ──────────────────────────────────────────────────────────────────

const MEAL_SLOTS: { key: keyof MealDay; zh: string; emoji: string }[] = [
  { key: 'breakfast', zh: '早餐', emoji: '🌅' },
  { key: 'lunch',     zh: '午餐', emoji: '☀️' },
  { key: 'dinner',    zh: '晚餐', emoji: '🌙' },
]

function fmtTime(iso: string) {
  // "2024-12-20T18:34:21" → "18:34"
  return iso.slice(11, 16)
}

function scanKey(day: number | string, slot: string) {
  return `${day}:${slot}`
}

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
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-6"
      style={{ background: '#FFFFFF' }}
      onClick={onClose}
    >
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

// ── Meal slot row ─────────────────────────────────────────────────────────────

function MealSlotRow({
  emoji, zh, entitled, scan,
}: {
  emoji: string
  zh: string
  entitled: boolean | null
  scan: MealScanRecord | undefined
}) {
  if (!entitled) {
    // Not on meal plan
    return (
      <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: 'var(--border2)' }}>
        <span className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-dim)' }}>
          <span>{emoji}</span>{zh}
        </span>
        <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-dim)' }}>
          <Minus size={13} />
          無此餐
        </span>
      </div>
    )
  }

  if (scan) {
    // Entitled + scanned — show time and who
    return (
      <div className="flex items-start justify-between py-2.5 border-b" style={{ borderColor: 'var(--border2)' }}>
        <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text)' }}>
          <span>{emoji}</span>{zh}
        </span>
        <div className="flex flex-col items-end gap-0.5 ml-3">
          <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
            <CheckCircle2 size={11} />
            已取餐 · {fmtTime(scan.scannedAt)}
          </span>
          {scan.scannedBy && (
            <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
              by {scan.scannedBy}
            </span>
          )}
        </div>
      </div>
    )
  }

  // Entitled but not yet scanned
  return (
    <div className="flex items-center justify-between py-2.5 border-b" style={{ borderColor: 'var(--border2)' }}>
      <span className="flex items-center gap-2 text-sm font-semibold" style={{ color: 'var(--text)' }}>
        <span>{emoji}</span>{zh}
      </span>
      <span className="flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
        style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>
        <Clock size={11} />
        未取餐
      </span>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MyQR() {
  const { person } = useAuth()
  const personId = person?.id ?? null
  const displayName = person?.chineseName || (person ? `${person.firstName} ${person.lastName}` : '')
  const uid = person?.uid || (person ? String(person.id) : null)
  const [badgeOpen, setBadgeOpen] = useState(false)
  const openBadge = useCallback(() => setBadgeOpen(true), [])
  const closeBadge = useCallback(() => setBadgeOpen(false), [])

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

  const { data: scanRecords = [] } = useQuery({
    queryKey: ['my-meal-scans', personId],
    queryFn: myApi.mealScans,
    staleTime: 30_000,
    retry: false, // gracefully degrade if endpoint not yet deployed
  })

  // Build lookup: "day:slot" → MealScanRecord
  const scanMap = new Map<string, MealScanRecord>()
  for (const s of scanRecords) {
    scanMap.set(scanKey(s.day, s.slot), s)
  }

  const me = family?.members.find(m => m.isMe)
  const meals = me?.meals ?? {}

  // Stats for header badge
  const totalEntitled = Object.values(meals).flatMap(d =>
    MEAL_SLOTS.map(s => d[s.key] ? 1 : 0 as number)
  ).reduce((a, b) => a + b, 0)
  const totalTaken = scanRecords.length

  return (
    <>
      {badgeOpen && uid && <BadgeOverlay uid={uid} displayName={displayName} onClose={closeBadge} />}

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

          {uid && (
            <button
              onClick={openBadge}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold w-full justify-center"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <Maximize2 size={15} />
              顯示大碼 · Show Full Badge
            </button>
          )}
        </div>

        {/* Meal plan card */}
        <div className="w-full rounded-3xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--text-dim)' }}>
              <Utensils size={13} />
              餐食計劃 · Meal Plan
            </div>
            {totalEntitled > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: totalTaken === totalEntitled ? 'var(--green-dim)' : 'var(--surface2)',
                  color: totalTaken === totalEntitled ? 'var(--green)' : 'var(--text-dim)',
                }}>
                {totalTaken} / {totalEntitled} 已取
              </span>
            )}
          </div>

          {Object.keys(meals).length === 0 ? (
            <p className="text-sm text-center py-2" style={{ color: 'var(--text-dim)' }}>無餐食資料 No meal data</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(meals)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([day, mealDay]) => (
                  <div key={day}>
                    <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>
                      第 {day} 天 · Day {day}
                    </p>
                    <div>
                      {MEAL_SLOTS.map(({ key, zh, emoji }, i) => (
                        <div key={key} style={i === MEAL_SLOTS.length - 1 ? { borderBottom: 'none' } : {}}>
                          <MealSlotRow
                            emoji={emoji}
                            zh={zh}
                            entitled={mealDay[key]}
                            scan={scanMap.get(scanKey(day, key))}
                          />
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
