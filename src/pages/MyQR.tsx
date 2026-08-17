import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import QRCode from 'react-qr-code'
import { QrCode, Utensils, Maximize2, X } from 'lucide-react'
import { myApi, type MealDay, type MealScanRecord, type FamilyMember } from '../api/client'
import { useAuth } from '../auth-context'

// ── helpers ──────────────────────────────────────────────────────────────────

const MEAL_SLOTS: { key: keyof MealDay; zh: string; en: string; emoji: string }[] = [
  { key: 'breakfast', zh: '早餐', en: 'Breakfast', emoji: '🌅' },
  { key: 'lunch',     zh: '午餐', en: 'Lunch',     emoji: '☀️' },
  { key: 'dinner',    zh: '晚餐', en: 'Dinner',    emoji: '🌙' },
]

function fmtTime(iso: string) {
  return iso.slice(11, 16)  // "2024-12-20T18:34:21" → "18:34"
}

function memberDisplayName(m: FamilyMember) {
  return m.chineseName || `${m.firstName} ${m.lastName}`
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

// ── Family meal slot block ────────────────────────────────────────────────────

function FamilyMealSlot({
  emoji, zh, en, entitled, scans,
}: {
  emoji: string
  zh: string
  en: string
  entitled: FamilyMember[]
  scans: MealScanRecord[]
}) {
  if (entitled.length === 0) return null

  // Sort taken scans by time for display order
  const taken = [...scans]
    .sort((a, b) => a.scannedAt.localeCompare(b.scannedAt))
    .map(s => {
      const member = entitled.find(m => m.id === s.personId)
      return { scan: s, member }
    })
    .filter(r => r.member)

  const allTaken = taken.length === entitled.length

  return (
    <div className="flex items-start gap-3 py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border2)' }}>
      {/* Left: emoji + name */}
      <span className="text-base w-6 shrink-0">{emoji}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {zh} <span className="font-normal text-xs" style={{ color: 'var(--text-dim)' }}>{en}</span>
        </span>
        {/* Taken names */}
        {taken.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {taken.map(({ scan, member }) => (
              <div key={scan.personId} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-mid)' }}>
                <span className="font-semibold" style={{ color: 'var(--green)' }}>
                  {memberDisplayName(member!)}
                </span>
                <span style={{ color: 'var(--text-dim)' }}>· {fmtTime(scan.scannedAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Right: count badge */}
      <span className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5"
        style={{
          background: allTaken ? 'var(--green-dim)' : taken.length > 0 ? 'var(--gold-dim)' : 'var(--border)',
          color:      allTaken ? 'var(--green)'     : taken.length > 0 ? 'var(--gold)'     : 'var(--text-dim)',
        }}>
        {taken.length}/{entitled.length}
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
    retry: false,
  })

  const members = family?.members ?? []

  // Group scans by "day:slot"
  const scansBySlot = new Map<string, MealScanRecord[]>()
  for (const s of scanRecords) {
    const k = `${s.day}:${s.slot}`
    const arr = scansBySlot.get(k) ?? []
    arr.push(s)
    scansBySlot.set(k, arr)
  }

  // Collect all days from all members' meal plans
  const allDays = [...new Set(
    members.flatMap(m => Object.keys(m.meals ?? {})).map(Number)
  )].sort((a, b) => a - b)

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
            <button onClick={openBadge}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold w-full justify-center"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              <Maximize2 size={15} />
              顯示大碼 · Show Full Badge
            </button>
          )}
        </div>

        {/* Meal plan card */}
        <div className="w-full rounded-3xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--text-dim)' }}>
              <Utensils size={13} />
              家庭餐食 · Family Meal Pickup
            </div>
            {scanRecords.length > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                {totalTaken} 筆已取
              </span>
            )}
          </div>

          {allDays.length === 0 ? (
            <p className="text-sm text-center py-2" style={{ color: 'var(--text-dim)' }}>無餐食資料 No meal data</p>
          ) : (
            <div className="space-y-5">
              {allDays.map(day => (
                <div key={day}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-dim)' }}>
                    第 {day} 天 · Day {day}
                  </p>
                  <div className="space-y-2">
                    {MEAL_SLOTS.map(({ key, zh, en, emoji }) => {
                      // Members entitled for this slot on this day
                      const entitled = members.filter(m => m.meals?.[String(day)]?.[key] === true)
                      const scans = scansBySlot.get(`${day}:${key}`) ?? []
                      return (
                        <FamilyMealSlot
                          key={key}
                          emoji={emoji}
                          zh={zh}
                          en={en}
                          entitled={entitled}
                          scans={scans}
                        />
                      )
                    })}
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
