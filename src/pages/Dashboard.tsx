import { useState, useCallback, useEffect, useRef } from 'react'
import { usePageTitle } from '../hooks/usePageTitle'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, MapPin, Maximize2, X, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'react-qr-code'
import { scheduleApi, myApi, type CampSession, type MealDay, type MealScanRecord } from '../api/client'
import { useAuth } from '../auth-context'

const MEAL_SLOTS: { key: keyof MealDay; zh: string; emoji: string }[] = [
  { key: 'breakfast', zh: '早餐', emoji: '🌅' },
  { key: 'lunch',     zh: '午餐', emoji: '☀️' },
  { key: 'dinner',    zh: '晚餐', emoji: '🌙' },
]

const TYPE_LABELS: Record<string, string> = {
  PLENARY:  '全體大會',
  WORSHIP:  '敬拜',
  WORKSHOP: '工作坊',
  GENERAL:  '分組',
  OTHER:    '其他',
}

const TYPE_ACCENT: Record<string, string> = {
  PLENARY:  'var(--accent)',
  WORSHIP:  'var(--gold)',
  WORKSHOP: '#63B3ED',
  GENERAL:  'var(--green)',
  OTHER:    'var(--text-dim)',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function todayDay(sessions: CampSession[]): number | null {
  const today = new Date().toDateString()
  const match = sessions.find(s => new Date(s.startTime).toDateString() === today)
  return match?.day ?? null
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' })
}

function todayFull() {
  return new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
}

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

export default function Dashboard() {
  usePageTitle('今日總覽', 'Dashboard')
  const { person } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const personId = person?.id ?? null
  const displayName = person?.chineseName || (person ? `${person.firstName} ${person.lastName}` : '')
  const engName = person?.chineseName ? `${person.firstName} ${person.lastName}` : ''
  const uid = person?.uid || (person ? String(person.id) : null)
  const [badgeOpen, setBadgeOpen] = useState(false)
  const openBadge = useCallback(() => setBadgeOpen(true), [])
  const closeBadge = useCallback(() => setBadgeOpen(false), [])

  const { data: sessions = [], isLoading: sessLoading } = useQuery<CampSession[]>({
    queryKey: ['schedule', personId],
    queryFn: scheduleApi.getAll,
  })

  const { data: family } = useQuery({
    queryKey: ['my-family', personId],
    queryFn: myApi.family,
    staleTime: 60_000,
  })

  const { data: scanRecords = [] } = useQuery<MealScanRecord[]>({
    queryKey: ['my-meal-scans', personId],
    queryFn: myApi.mealScans,
    staleTime: 30_000,
    retry: false,
  })

  const [pendingId, setPendingId] = useState<number | null>(null)
  const signup = useMutation({
    mutationFn: (id: number) => scheduleApi.signup(id),
    onMutate: (id) => setPendingId(id),
    onSettled: () => { setPendingId(null); qc.invalidateQueries({ queryKey: ['schedule', personId] }) },
  })
  const unsignup = useMutation({
    mutationFn: (id: number) => scheduleApi.unsignup(id),
    onMutate: (id) => setPendingId(id),
    onSettled: () => { setPendingId(null); qc.invalidateQueries({ queryKey: ['schedule', personId] }) },
  })

  // Determine "today" in conference terms
  const todayDayNum = todayDay(sessions)
  const todaySessions = todayDayNum != null
    ? sessions.filter(s => s.day === todayDayNum)
    : sessions.filter(s => s.day === Math.min(...sessions.map(s => s.day ?? 999).filter(d => d < 999)))

  const me = family?.members.find(m => m.isMe)

  // Map conference day number → actual date string (from session data)
  const dayDateMap = new Map<number, string>()
  for (const s of sessions) {
    if (s.day != null && !dayDateMap.has(s.day)) {
      dayDateMap.set(s.day, s.startTime)
    }
  }

  // All meal days available across family members
  const allMealDays = [...new Set(
    (family?.members ?? []).flatMap(m => Object.keys(m.meals ?? {}).map(Number))
  )].sort((a, b) => a - b)

  const defaultMealDay = todayDayNum ?? allMealDays[0] ?? null
  const [selectedMealDay, setSelectedMealDay] = useState<number | null>(null)
  const mealDay = selectedMealDay ?? defaultMealDay

  const mealDayMeals = mealDay != null && me?.meals ? me.meals[String(mealDay)] ?? null : null

  const todayLabel = todayDayNum != null ? `第 ${todayDayNum} 天` : ''

  // Live clock for "Next Up" countdown
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const nextSession = sessions
    .filter(s => s.signedUp && new Date(s.startTime).getTime() > now)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0] ?? null

  function minsUntil(iso: string) {
    return Math.max(0, Math.round((new Date(iso).getTime() - now) / 60000))
  }

  return (
    <>
    {badgeOpen && uid && <BadgeOverlay uid={uid} displayName={displayName} onClose={closeBadge} />}
    <div className="max-w-lg mx-auto px-4 py-4 space-y-5">

      {/* ── Badge card ── */}
      <div
        className="rounded-3xl p-6 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #C8341A 0%, #16264A 55%, #0B1629 100%)' }}
      >
        {/* decorative circle */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full pointer-events-none"
          style={{ background: 'rgba(239,160,32,0.1)' }} />

        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(236,241,255,0.5)' }}>
            ATTENDEE · 大會學員
          </div>
          <div className="text-xs font-medium" style={{ color: 'rgba(236,241,255,0.45)' }}>
            {todayFull()}
          </div>
        </div>

        <div className="text-5xl font-black tracking-tight leading-none mb-2 text-white" style={{ textWrap: 'balance' }}>
          {displayName}
        </div>
        {engName && <div className="text-sm" style={{ color: 'rgba(236,241,255,0.6)' }}>{engName}</div>}
        {me?.church && (
          <div className="text-xs mt-1 mb-4 font-medium" style={{ color: 'rgba(236,241,255,0.45)' }}>
            {me.church.nameChn ?? me.church.nameEng}
            {me.church.nameChn && me.church.nameEng && ` · ${me.church.nameEng}`}
          </div>
        )}
        {!me?.church && <div className="mb-4" />}

        {uid && (
          <button
            onClick={openBadge}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white w-full justify-center"
            style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.22)' }}
          >
            <Maximize2 size={14} />
            顯示大碼 · Show Full Badge
          </button>
        )}
      </div>

      {/* ── Next Up ── */}
      {nextSession && (
        <div className="rounded-3xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={13} style={{ color: 'var(--gold)' }} />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
              下一場 · Next Up
            </span>
            <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>
              {minsUntil(nextSession.startTime) < 60
                ? `${minsUntil(nextSession.startTime)} 分鐘後`
                : `${Math.floor(minsUntil(nextSession.startTime) / 60)}h ${minsUntil(nextSession.startTime) % 60}m`}
            </span>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-col items-center min-w-[36px]">
              <span className="text-sm font-black leading-none" style={{ color: 'var(--accent)' }}>{fmt(nextSession.startTime)}</span>
              <div className="w-px flex-1 my-1" style={{ background: 'var(--border)', minHeight: 8 }} />
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{fmt(nextSession.endTime)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm leading-snug mb-1" style={{ color: 'var(--text)' }}>{nextSession.title}</div>
              {nextSession.speaker && <div className="text-xs mb-1" style={{ color: 'var(--text-mid)' }}>{nextSession.speaker}</div>}
              {nextSession.location && (
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-dim)' }}>
                  <MapPin size={10} />{nextSession.location}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Meals ── */}
      {allMealDays.length > 0 && (
        <div>
          {/* Header + day pills */}
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <div className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
              餐食
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {allMealDays.map(d => {
                const isToday = d === todayDayNum
                const isSelected = d === mealDay
                const dateIso = dayDateMap.get(d)
                const dateLabel = dateIso ? fmtDate(dateIso) : `第 ${d} 天`
                return (
                  <button
                    key={d}
                    onClick={() => setSelectedMealDay(d)}
                    className="text-[10px] font-bold px-2.5 py-1 rounded-full transition-all"
                    style={{
                      background: isSelected ? 'var(--accent)' : 'var(--surface)',
                      color: isSelected ? '#fff' : 'var(--text-dim)',
                      border: `1px solid ${isSelected ? 'transparent' : 'var(--border)'}`,
                    }}
                  >
                    {isToday ? `今日 · ${dateLabel}` : dateLabel}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Meal slots grid */}
          <div className="grid grid-cols-3 gap-2">
            {MEAL_SLOTS.map(({ key, zh, emoji }) => {
              const has = mealDayMeals?.[key]
              if (!has) return (
                <div key={key} className="rounded-2xl p-3 flex flex-col items-center gap-1.5 border opacity-40"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <span className="text-xl">{emoji}</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-mid)' }}>{zh}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)' }}>—</span>
                </div>
              )
              const members = family?.members ?? []
              const ordered = members.filter(m => mealDay != null && m.meals?.[String(mealDay)]?.[key] === true).length
              const picked = scanRecords.filter(s => s.day === mealDay && s.slot === key).length
              const allPicked = ordered > 0 && picked >= ordered
              return (
                <div key={key} className="rounded-2xl p-3 flex flex-col items-center gap-1.5 border"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <span className="text-xl">{emoji}</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-mid)' }}>{zh}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: allPicked ? 'var(--green-dim)' : picked > 0 ? 'var(--gold-dim)' : 'rgba(255,255,255,0.05)',
                      color: allPicked ? 'var(--green)' : picked > 0 ? 'var(--gold)' : 'var(--text-dim)',
                    }}>
                    {picked}/{ordered}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Today sessions ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
            今日場次 · {todayLabel}
          </div>
          <button onClick={() => navigate('/schedule')} className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>
            全部 →
          </button>
        </div>

        {sessLoading && (
          <div className="flex justify-center py-8"><Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-dim)' }} /></div>
        )}

        <div>
          {[...todaySessions]
            .filter(s => s.sessionType !== 'OTHER')
            .sort((a, b) => a.startTime.localeCompare(b.startTime))
            .map((s, i, arr) => (
              <DashSessionRow
                key={s.id} session={s}
                loading={pendingId === s.id}
                onSignup={() => signup.mutate(s.id)}
                onUnsignup={() => unsignup.mutate(s.id)}
                isLast={i === arr.length - 1}
              />
            ))}
        </div>

        {!sessLoading && todaySessions.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-dim)' }}>今日無安排場次</p>
        )}
      </div>
    </div>
    </>
  )
}

const GOING_TYPES = new Set(['WORKSHOP', 'GENERAL', 'PLENARY', 'WORSHIP'])

function DashSessionRow({ session: s, onSignup, onUnsignup, loading, isLast }: {
  session: CampSession; onSignup: () => void; onUnsignup: () => void; loading: boolean; isLast: boolean
}) {
  const isOther = s.sessionType === 'OTHER'
  const canGo = GOING_TYPES.has(s.sessionType)
  const atCapacity = s.capacity != null && s.signupCount >= s.capacity
  const typeColor = TYPE_ACCENT[s.sessionType] ?? 'var(--text-dim)'

  return (
    <div className="flex gap-0" style={{ opacity: isOther ? 0.65 : 1 }}>
      {/* Time + line */}
      <div className="flex flex-col items-center" style={{ width: 48, flexShrink: 0 }}>
        <span className="text-xs font-bold tabular-nums leading-none pt-0.5"
          style={{ color: isOther ? 'var(--text-dim)' : typeColor }}>
          {fmt(s.startTime)}
        </span>
        {!isLast && (
          <div className="flex-1 w-px mt-1.5" style={{ background: 'var(--border)', minHeight: 16 }} />
        )}
      </div>

      {/* Dot */}
      <div className="flex flex-col items-center mt-0.5" style={{ width: 18, flexShrink: 0 }}>
        <div className="rounded-full" style={{
          width: 7, height: 7,
          background: isOther ? 'var(--border2)' : typeColor,
        }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        {TYPE_LABELS[s.sessionType] && !isOther && (
          <span className="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded"
            style={{ background: `color-mix(in srgb, ${typeColor} 18%, transparent)`, color: typeColor }}>
            {TYPE_LABELS[s.sessionType]}
          </span>
        )}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="font-semibold leading-snug"
            style={{ color: isOther ? 'var(--text-dim)' : 'var(--text)', fontSize: 14 }}>
            {s.title}
          </span>
          {canGo && !atCapacity && (
            s.signedUp ? (
              <button disabled={loading} onClick={onUnsignup}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold transition-all shrink-0"
                style={{ background: 'var(--green)', color: '#fff' }}>
                🙋 我去！
              </button>
            ) : (
              <button disabled={loading} onClick={onSignup}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold transition-all shrink-0"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                想去？
              </button>
            )
          )}
          {canGo && atCapacity && (
            <span className="text-[11px] px-2 py-0.5 rounded-full shrink-0"
              style={{ background: 'var(--border)', color: 'var(--text-dim)' }}>額滿</span>
          )}
        </div>
        {(s.speaker || s.location) && (
          <div className="flex flex-wrap gap-x-3 mt-0.5">
            {s.speaker && (
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{s.speaker}</span>
            )}
            {s.location && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-dim)' }}>
                <MapPin size={10} className="shrink-0" />{s.location}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


