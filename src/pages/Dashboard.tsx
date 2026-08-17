import { useState, useCallback, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, MapPin, QrCode, Maximize2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'react-qr-code'
import { scheduleApi, myApi, type CampSession, type MealDay } from '../api/client'
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

  // My meals for today
  const me = family?.members.find(m => m.isMe)
  const todayMeals = todayDayNum != null && me?.meals
    ? me.meals[String(todayDayNum)] ?? null
    : me?.meals
      ? Object.values(me.meals)[0] ?? null
      : null

  const todayLabel = todayDayNum != null ? `第 ${todayDayNum} 天` : ''

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

        <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'rgba(236,241,255,0.5)' }}>
          ATTENDEE · 大會學員
        </div>

        <div className="text-5xl font-black tracking-tight leading-none mb-2 text-white" style={{ textWrap: 'balance' }}>
          {displayName}
        </div>
        {engName && <div className="text-sm mb-4" style={{ color: 'rgba(236,241,255,0.6)' }}>{engName}</div>}

        <div className="flex items-center justify-between gap-2">
          <div className="text-xs flex items-center gap-1.5" style={{ color: 'rgba(236,241,255,0.5)' }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
            {me?.lodging?.status === 'STAY' ? '住宿' : me?.lodging?.status === 'COMMUTE' ? '通勤' : ''}
          </div>
          <div className="flex items-center gap-2">
            {uid && (
              <button
                onClick={openBadge}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.25)' }}
              >
                <Maximize2 size={13} />
                顯示大碼
              </button>
            )}
            <button
              onClick={() => navigate('/my-qr')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)' }}
            >
              <QrCode size={14} />
              我的 QR
            </button>
          </div>
        </div>
      </div>

      {/* ── Today meals ── */}
      {todayMeals && (
        <div>
          <div className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--text-dim)' }}>
            今日餐食 · {todayLabel}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MEAL_SLOTS.map(({ key, zh, emoji }) => {
              const has = todayMeals[key]
              return (
                <div key={key} className="rounded-2xl p-3 flex flex-col items-center gap-1.5 border"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <span className="text-xl">{emoji}</span>
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-mid)' }}>{zh}</span>
                  {has === true
                    ? <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>✓ 有</span>
                    : <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-dim)' }}>—</span>
                  }
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

        <div className="space-y-3">
          {todaySessions.slice(0, 4).map(s => (
            <DashSessionCard
              key={s.id} session={s}
              loading={pendingId === s.id}
              onSignup={() => signup.mutate(s.id)}
              onUnsignup={() => unsignup.mutate(s.id)}
            />
          ))}
        </div>

        {todaySessions.length > 4 && (
          <button onClick={() => navigate('/schedule')} className="mt-3 w-full py-3 rounded-2xl text-sm font-semibold border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--text-mid)', background: 'var(--surface)' }}>
            查看全部 {todaySessions.length} 場次
          </button>
        )}

        {!sessLoading && todaySessions.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-dim)' }}>今日無安排場次</p>
        )}
      </div>
    </div>
    </>
  )
}

function DashSessionCard({ session: s, onSignup, onUnsignup, loading }: {
  session: CampSession; onSignup: () => void; onUnsignup: () => void; loading: boolean
}) {
  const atCapacity = s.capacity != null && s.signupCount >= s.capacity
  const pct = s.capacity ? Math.min(100, Math.round((s.signupCount / s.capacity) * 100)) : null
  const typeColor = TYPE_ACCENT[s.sessionType] ?? 'var(--text-dim)'

  return (
    <div className="rounded-2xl p-4 border flex gap-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {/* Time column */}
      <div className="flex flex-col items-center min-w-[40px]">
        <span className="text-sm font-black leading-none" style={{ color: 'var(--accent)' }}>{fmt(s.startTime)}</span>
        <div className="w-px flex-1 my-1.5 rounded-full" style={{ background: 'var(--border)', minHeight: 12 }} />
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{fmt(s.endTime)}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
            style={{ background: `${typeColor}22`, color: typeColor }}>
            {TYPE_LABELS[s.sessionType] ?? s.sessionType}
          </span>
        </div>
        <div className="font-bold leading-snug mb-1" style={{ color: 'var(--text)', fontSize: 15 }}>{s.title}</div>
        {s.speaker && <div className="text-xs mb-1.5" style={{ color: 'var(--text-mid)' }}>{s.speaker}</div>}
        {s.location && (
          <div className="flex items-center gap-1 text-xs mb-2" style={{ color: 'var(--text-dim)' }}>
            <MapPin size={11} />{s.location}
          </div>
        )}
        {pct != null && (
          <div className="h-1 rounded-full overflow-hidden mb-2" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full" style={{
              width: `${pct}%`,
              background: pct >= 100 ? 'var(--accent)' : pct >= 75 ? 'var(--amber)' : 'var(--green)'
            }} />
          </div>
        )}
        {s.signedUp ? (
          <button disabled={loading} onClick={onUnsignup}
            className="text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors"
            style={{ background: 'var(--green-dim)', color: 'var(--green)', borderColor: 'transparent' }}>
            ✓ 已報名 · 取消
          </button>
        ) : (
          <button disabled={loading || atCapacity} onClick={onSignup}
            className="text-xs font-bold px-3 py-1.5 rounded-xl transition-colors"
            style={{ background: atCapacity ? 'var(--border)' : 'var(--accent)', color: atCapacity ? 'var(--text-dim)' : '#fff' }}>
            {atCapacity ? '額滿' : '報名'}
          </button>
        )}
      </div>
    </div>
  )
}


