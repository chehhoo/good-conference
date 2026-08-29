import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, MapPin, User, Users, X, Clock } from 'lucide-react'
import { scheduleApi, type CampSession } from '../api/client'
import { useAuth } from '../auth-context'
import ShareModal from '../components/ShareModal'
import { Share2 } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'

type ViewMode = 'all' | 'mine'

const GOING_TYPES = new Set(['WORKSHOP', 'GENERAL', 'PLENARY', 'WORSHIP'])

const TYPE_COLOR: Record<string, string> = {
  PLENARY:  'var(--accent)',
  WORSHIP:  'var(--gold)',
  WORKSHOP: '#63B3ED',
  GENERAL:  'var(--green)',
  OTHER:    'var(--border2)',
}

const TYPE_LABEL: Record<string, string> = {
  PLENARY:  '全體大會',
  WORSHIP:  '敬拜',
  WORKSHOP: '工作坊',
  GENERAL:  '分組',
  OTHER:    '',
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function fmtDayDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' })
}

interface RowProps {
  session: CampSession
  onSignup: (id: number) => void
  onUnsignup: (id: number) => void
  onSelect: (s: CampSession) => void
  loading: boolean
  isLast: boolean
}

function overlaps(a: CampSession, b: CampSession) {
  return a.id !== b.id &&
    new Date(a.startTime) < new Date(b.endTime) &&
    new Date(a.endTime) > new Date(b.startTime)
}

function SessionDetailSheet({ session: s, onClose, onSignup, onUnsignup, loading, allSessions }: {
  session: CampSession
  onClose: () => void
  onSignup: (id: number) => void
  onUnsignup: (id: number) => void
  loading: boolean
  allSessions: CampSession[]
}) {
  const canGo = GOING_TYPES.has(s.sessionType)
  const atCapacity = s.capacity != null && s.signupCount >= s.capacity
  const typeColor = TYPE_COLOR[s.sessionType] ?? 'var(--text-dim)'
  const pct = s.capacity ? Math.min(100, Math.round((s.signupCount / s.capacity) * 100)) : null

  const conflictingSessions = !s.signedUp
    ? allSessions.filter(other => other.signedUp && overlaps(s, other))
    : []

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-h-[85vh] overflow-y-auto"
        style={{ background: 'var(--surface)', boxShadow: '0 -4px 40px rgba(0,0,0,0.4)' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border2)' }} />
        </div>

        <div className="px-5 pb-10 pt-2">
          {/* Close */}
          <div className="flex justify-end mb-2">
            <button onClick={onClose} className="p-1.5 rounded-full" style={{ background: 'var(--surface2)', color: 'var(--text-dim)' }}>
              <X size={16} />
            </button>
          </div>

          {/* Type badge */}
          {TYPE_LABEL[s.sessionType] && (
            <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded"
              style={{ background: `color-mix(in srgb, ${typeColor} 18%, transparent)`, color: typeColor }}>
              {TYPE_LABEL[s.sessionType]}
            </span>
          )}

          {/* Title */}
          <h2 className="text-xl font-black mt-2 leading-snug" style={{ color: 'var(--text)' }}>{s.title}</h2>
          {s.titleEng && <p className="text-sm mt-0.5" style={{ color: 'var(--text-dim)' }}>{s.titleEng}</p>}

          {/* Time */}
          <div className="flex items-center gap-2 mt-4">
            <Clock size={13} style={{ color: 'var(--text-dim)' }} />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-mid)' }}>
              {fmtTime(s.startTime)} – {fmtTime(s.endTime)}
            </span>
          </div>

          {/* Speaker */}
          {(s.speaker || s.speakerEng) && (
            <div className="flex items-start gap-2 mt-2">
              <User size={13} className="mt-0.5 shrink-0" style={{ color: 'var(--text-dim)' }} />
              <div>
                {s.speaker && <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{s.speaker}</p>}
                {s.speakerEng && <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{s.speakerEng}</p>}
              </div>
            </div>
          )}

          {/* Location */}
          {s.location && (
            <div className="flex items-center gap-2 mt-2">
              <MapPin size={13} style={{ color: 'var(--text-dim)' }} />
              <span className="text-sm" style={{ color: 'var(--text-mid)' }}>{s.location}</span>
            </div>
          )}

          {/* Capacity */}
          {s.capacity != null && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--text-dim)' }}>
                <span className="flex items-center gap-1"><Users size={11} />{s.signupCount} / {s.capacity} 人</span>
                {atCapacity && <span style={{ color: 'var(--accent)' }} className="font-semibold">額滿</span>}
                {s.sessionType === 'WORKSHOP' && !atCapacity && (pct ?? 0) >= 80 && (
                  <span style={{ color: 'var(--amber)' }} className="font-semibold">剩 {s.capacity! - s.signupCount} 位</span>
                )}
                {s.sessionType !== 'WORKSHOP' && (pct ?? 0) >= 75 && !atCapacity && <span style={{ color: 'var(--amber)' }} className="font-semibold">剩餘少量</span>}
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full" style={{
                  width: `${pct ?? 0}%`,
                  background: (pct ?? 0) >= 100 ? 'var(--accent)' : (pct ?? 0) >= 75 ? 'var(--amber)' : 'var(--green)'
                }} />
              </div>
            </div>
          )}

          {/* Description */}
          {s.description && (
            <div className="mt-4 p-3 rounded-2xl" style={{ background: 'var(--surface2)' }}>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-mid)' }}>{s.description}</p>
            </div>
          )}

          {/* Conflict warning */}
          {conflictingSessions.length > 0 && (
            <div className="mt-4 p-3 rounded-2xl" style={{ background: 'color-mix(in srgb, var(--amber) 15%, transparent)', border: '1px solid var(--amber)' }}>
              <p className="text-xs font-bold mb-1" style={{ color: 'var(--amber)' }}>⚠️ 時間衝突 · Schedule Conflict</p>
              {conflictingSessions.map(c => (
                <p key={c.id} className="text-xs" style={{ color: 'var(--text-mid)' }}>
                  與「{c.title}」時間重疊 ({fmtTime(c.startTime)}–{fmtTime(c.endTime)})
                </p>
              ))}
            </div>
          )}

          {/* Going toggle */}
          {canGo && (
            <div className="mt-5">
              {s.signedUp ? (
                <button
                  disabled={loading}
                  onClick={() => onUnsignup(s.id)}
                  className="w-full py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-50"
                  style={{ background: 'var(--green)', color: '#fff' }}
                >
                  🙋 我去！ · 點擊取消
                </button>
              ) : atCapacity ? (
                <button disabled className="w-full py-3 rounded-2xl text-sm font-bold"
                  style={{ background: 'var(--border)', color: 'var(--text-dim)' }}>
                  額滿 Full
                </button>
              ) : (
                <button
                  disabled={loading}
                  onClick={() => onSignup(s.id)}
                  className="w-full py-3 rounded-2xl text-sm font-bold transition-all disabled:opacity-40"
                  style={{ background: 'var(--accent)', color: '#fff' }}
                >
                  想去？標記我要參加！
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function SessionRow({ session: s, onSignup, onUnsignup, onSelect, loading, isLast }: RowProps) {
  const canGo = GOING_TYPES.has(s.sessionType)
  const isOther = s.sessionType === 'OTHER'
  const typeColor = TYPE_COLOR[s.sessionType] ?? 'var(--text-dim)'
  const atCapacity = s.capacity != null && s.signupCount >= s.capacity
  const pct = s.capacity ? Math.min(100, Math.round((s.signupCount / s.capacity) * 100)) : null

  return (
    <div className="flex gap-0" style={{ opacity: isOther ? 0.7 : 1 }}>
      {/* Time + timeline line */}
      <div className="flex flex-col items-center" style={{ width: 52, flexShrink: 0 }}>
        <span
          className="text-xs font-bold tabular-nums leading-none pt-0.5"
          style={{ color: isOther ? 'var(--text-dim)' : typeColor }}
        >
          {fmtTime(s.startTime)}
        </span>
        {!isLast && (
          <div className="flex-1 w-px mt-1.5" style={{ background: 'var(--border)', minHeight: 16 }} />
        )}
      </div>

      {/* Dot */}
      <div className="flex flex-col items-center mt-0.5" style={{ width: 20, flexShrink: 0 }}>
        <div
          className="rounded-full"
          style={{
            width: 8, height: 8, flexShrink: 0,
            background: isOther ? 'var(--border2)' : typeColor,
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-5 cursor-pointer" onClick={() => onSelect(s)}>
        {/* Type badge */}
        {TYPE_LABEL[s.sessionType] && (
          <span
            className="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded"
            style={{ background: `color-mix(in srgb, ${typeColor} 18%, transparent)`, color: typeColor }}
          >
            {TYPE_LABEL[s.sessionType]}
          </span>
        )}

        {/* Title + going toggle inline */}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span
            className="font-semibold leading-snug"
            style={{ color: isOther ? 'var(--text-dim)' : 'var(--text)', fontSize: 14 }}
          >
            {s.title}
          </span>
          {canGo && !atCapacity && (
            s.signedUp ? (
              <button
                disabled={loading}
                onClick={() => onUnsignup(s.id)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all disabled:opacity-50 shrink-0"
                style={{ background: 'var(--green)', color: '#fff' }}
                title="取消"
              >
                🙋 我去！
              </button>
            ) : (
              <button
                disabled={loading}
                onClick={() => onSignup(s.id)}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold transition-all disabled:opacity-40 shrink-0"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}
              >
                想去？
              </button>
            )
          )}
          {canGo && atCapacity && (
            <span className="text-[11px] px-2 py-0.5 rounded-full shrink-0"
              style={{ background: 'var(--border)', color: 'var(--text-dim)' }}>
              額滿
            </span>
          )}
        </div>

        {s.titleEng && (
          <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--text-dim)' }}>{s.titleEng}</p>
        )}

        {/* Meta row: speaker, location */}
        {(s.speaker || s.location) && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
            {s.speaker && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-dim)' }}>
                <User size={10} className="shrink-0" />{s.speaker}
              </span>
            )}
            {s.location && (
              <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-dim)' }}>
                <MapPin size={10} className="shrink-0" />{s.location}
              </span>
            )}
          </div>
        )}

        {/* Capacity bar (workshop/general only) */}
        {canGo && s.capacity != null && (
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)', maxWidth: 80 }}>
              <div className="h-full rounded-full" style={{
                width: `${pct ?? 0}%`,
                background: (pct ?? 0) >= 100 ? 'var(--accent)' : (pct ?? 0) >= 75 ? 'var(--amber)' : 'var(--green)'
              }} />
            </div>
            <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--text-dim)' }}>
              <Users size={9} />{s.signupCount}/{s.capacity}
            </span>
            {s.sessionType === 'WORKSHOP' && !atCapacity && (pct ?? 0) >= 80 && (
              <span className="text-[10px] font-bold shrink-0" style={{ color: 'var(--amber)' }}>
                剩 {s.capacity - s.signupCount} 位
              </span>
            )}
            {s.sessionType === 'WORKSHOP' && atCapacity && (
              <span className="text-[10px] font-bold shrink-0" style={{ color: 'var(--accent)' }}>額滿</span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function Schedule() {
  usePageTitle('大會行程', 'Conference Schedule')
  const qc = useQueryClient()
  const { person } = useAuth()
  const personId = person?.id ?? null

  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [showShare, setShowShare] = useState(false)
  const [detailSession, setDetailSession] = useState<CampSession | null>(null)
  const shareUrl = window.location.origin + import.meta.env.BASE_URL

  const { data: sessions = [], isLoading, isError } = useQuery<CampSession[]>({
    queryKey: ['schedule', personId],
    queryFn: scheduleApi.getAll,
  })

  const signup = useMutation({
    mutationFn: (id: number) => scheduleApi.signup(id),
    onMutate: (id) => { setPendingId(id); setMutationError(null) },
    onError: () => setMutationError('報名失敗，請再試一次。 Sign up failed, please try again.'),
    onSettled: () => {
      setPendingId(null)
      qc.invalidateQueries({ queryKey: ['schedule', personId] })
      qc.invalidateQueries({ queryKey: ['my-signups', personId] })
    },
  })

  const unsignup = useMutation({
    mutationFn: (id: number) => scheduleApi.unsignup(id),
    onMutate: (id) => { setPendingId(id); setMutationError(null) },
    onError: () => setMutationError('取消報名失敗，請再試一次。 Cancel failed, please try again.'),
    onSettled: () => {
      setPendingId(null)
      qc.invalidateQueries({ queryKey: ['schedule', personId] })
      qc.invalidateQueries({ queryKey: ['my-signups', personId] })
    },
  })

  const days = [...new Set(sessions.map(s => s.day).filter((d): d is number => d != null))].sort()

  const firstByDay = new Map<number, CampSession>()
  for (const s of sessions) {
    if (s.day != null && !firstByDay.has(s.day)) firstByDay.set(s.day, s)
  }

  const byDay = selectedDay != null ? sessions.filter(s => s.day === selectedDay) : sessions
  const preFilter = viewMode === 'mine' ? byDay.filter(s => s.signedUp) : byDay
  const visible = [...preFilter].sort((a, b) => a.startTime.localeCompare(b.startTime))

  // Group by day for the "全部" view
  const groupedByDay: { day: number; label: string; sessions: CampSession[] }[] = []
  if (selectedDay === null && visible.length > 0) {
    const dayMap = new Map<number, CampSession[]>()
    for (const s of visible) {
      const d = s.day ?? 0
      const bucket = dayMap.get(d) ?? []
      bucket.push(s)
      dayMap.set(d, bucket)
    }
    for (const [d, ss] of [...dayMap.entries()].sort(([a], [b]) => a - b)) {
      const first = ss[0]
      const dateLabel = new Date(first.startTime).toLocaleDateString('zh-TW', {
        month: 'long', day: 'numeric', weekday: 'short',
      })
      groupedByDay.push({ day: d, label: `第 ${d} 天 · ${dateLabel}`, sessions: ss })
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Sticky header */}
      {days.length > 0 && (
        <div className="sticky top-0 z-10 border-b" style={{ background: 'var(--nav)', borderColor: 'var(--border)' }}>
          <div className="max-w-4xl mx-auto px-4 pt-3 pb-2 flex gap-2 items-center">
            <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {(['all', 'mine'] as ViewMode[]).map(m => (
                <button
                  key={m}
                  onClick={() => setViewMode(m)}
                  className="px-4 py-1.5 text-xs font-bold transition-colors"
                  style={{
                    background: viewMode === m ? 'var(--accent)' : 'var(--surface)',
                    color: viewMode === m ? '#fff' : 'var(--text-dim)',
                  }}
                >
                  {m === 'all' ? '全部場次' : '我的報名 ✓'}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowShare(true)}
              className="ml-auto p-2 rounded-lg"
              style={{ color: 'var(--text-dim)' }}
              aria-label="分享"
            >
              <Share2 size={16} />
            </button>
          </div>
          {/* Day tabs */}
          <div className="max-w-4xl mx-auto px-4 flex gap-0.5 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedDay(null)}
              className="shrink-0 px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap relative"
              style={{ color: selectedDay === null ? 'var(--accent)' : 'var(--text-dim)' }}
            >
              全部
              {selectedDay === null && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'var(--accent)' }} />}
            </button>
            {days.map(d => {
              const first = firstByDay.get(d)
              const isActive = selectedDay === d
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className="shrink-0 px-4 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap relative"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--text-dim)' }}
                >
                  第 {d} 天
                  {first && (
                    <span className="hidden sm:inline ml-1 text-xs opacity-60">
                      {fmtDayDate(first.startTime)}
                    </span>
                  )}
                  {isActive && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: 'var(--accent)' }} />}
                </button>
              )
            })}
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto px-4 pt-5 pb-safe">
        {mutationError && (
          <div className="mb-4 text-sm rounded-xl px-3 py-2 flex justify-between items-center"
            style={{ background: 'rgba(200,52,26,0.12)', color: 'var(--accent)' }}>
            <span>{mutationError}</span>
            <button onClick={() => setMutationError(null)} className="ml-3 opacity-70">✕</button>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--text-dim)' }} />
          </div>
        )}

        {isError && (
          <div className="text-center py-20 text-sm" style={{ color: 'var(--text-dim)' }}>
            <p style={{ color: 'var(--accent)' }}>無法載入行程，請稍後再試。</p>
            <p className="mt-1">Could not load schedule. Please try again later.</p>
          </div>
        )}

        {!isLoading && !isError && visible.length === 0 && (
          <div className="text-center py-20 text-sm" style={{ color: 'var(--text-dim)' }}>
            {viewMode === 'mine'
              ? <p>尚未報名任何場次。No sign-ups yet.</p>
              : <p>尚未排定行程。No sessions scheduled yet.</p>
            }
          </div>
        )}

        {visible.length > 0 && selectedDay !== null && (
          <div>
            {visible.map((s, i) => (
              <SessionRow
                key={s.id}
                session={s}
                onSignup={id => signup.mutate(id)}
                onUnsignup={id => unsignup.mutate(id)}
                onSelect={setDetailSession}
                loading={pendingId === s.id}
                isLast={i === visible.length - 1}
              />
            ))}
          </div>
        )}

        {visible.length > 0 && selectedDay === null && (
          <div>
            {groupedByDay.map(({ day, label, sessions: daySessions }) => (
              <div key={day} className="mb-6">
                <div className="flex items-center gap-3 mb-3 sticky top-0 py-2 -mx-4 px-4"
                  style={{ background: 'var(--bg)', zIndex: 1 }}>
                  <span className="text-xs font-black tracking-widest uppercase"
                    style={{ color: 'var(--accent)' }}>
                    {label}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                </div>
                {daySessions.map((s, i) => (
                  <SessionRow
                    key={s.id}
                    session={s}
                    onSignup={id => signup.mutate(id)}
                    onUnsignup={id => unsignup.mutate(id)}
                    onSelect={setDetailSession}
                    loading={pendingId === s.id}
                    isLast={i === daySessions.length - 1}
                  />
                ))}
              </div>
            ))}
          </div>
        )}
      </main>

      {showShare && <ShareModal url={shareUrl} onClose={() => setShowShare(false)} />}

      {detailSession && (
        <SessionDetailSheet
          session={detailSession}
          onClose={() => setDetailSession(null)}
          onSignup={id => { signup.mutate(id); setDetailSession(s => s?.id === id ? { ...s, signedUp: true } : s) }}
          onUnsignup={id => { unsignup.mutate(id); setDetailSession(s => s?.id === id ? { ...s, signedUp: false } : s) }}
          loading={pendingId === detailSession.id}
          allSessions={sessions}
        />
      )}
    </div>
  )
}
