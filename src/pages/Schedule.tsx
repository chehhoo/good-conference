import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Share2 } from 'lucide-react'
import { scheduleApi, type CampSession } from '../api/client'
import { useAuth } from '../auth-context'
import SessionCard from '../components/SessionCard'
import ShareModal from '../components/ShareModal'

type ViewMode = 'all' | 'mine'

function groupByTime(sessions: CampSession[]): [string, CampSession[]][] {
  const map = new Map<string, CampSession[]>()
  for (const s of sessions) {
    const key = s.startTime.slice(0, 16)
    const bucket = map.get(key) ?? []
    bucket.push(s)
    map.set(key, bucket)
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b))
}

function fmtSlot(iso: string) {
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function fmtDayDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' })
}

import { usePageTitle } from '../hooks/usePageTitle'

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

  // Build a lookup once so tab rendering is O(n) not O(n²)
  const firstByDay = new Map<number, CampSession>()
  for (const s of sessions) {
    if (s.day != null && !firstByDay.has(s.day)) firstByDay.set(s.day, s)
  }

  const byDay = selectedDay != null
    ? sessions.filter(s => s.day === selectedDay)
    : sessions
  const visible = viewMode === 'mine' ? byDay.filter(s => s.signedUp) : byDay

  const grouped = groupByTime(visible)

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Day tab bar + view toggle */}
      {days.length > 0 && (
        <div className="sticky top-0 z-10 border-b" style={{ background: 'var(--nav)', borderColor: 'var(--border)' }}>
          {/* View mode toggle */}
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
              className="ml-auto p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-dim)' }}
              aria-label="分享 Share"
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

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-5 pb-safe">
        {mutationError && (
          <div className="mb-4 text-sm rounded-xl px-3 py-2 flex justify-between items-center"
            style={{ background: 'rgba(200,52,26,0.12)', color: 'var(--accent)' }}>
            <span>{mutationError}</span>
            <button onClick={() => setMutationError(null)} className="ml-3 opacity-70 hover:opacity-100">✕</button>
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

        {grouped.map(([timeKey, slot]) => (
          <section key={timeKey} className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full whitespace-nowrap"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                {fmtSlot(timeKey)}
              </span>
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>
            <div className="space-y-3">
              {slot.map(s => (
                <SessionCard
                  key={s.id}
                  session={s}
                  onSignup={id => signup.mutate(id)}
                  onUnsignup={id => unsignup.mutate(id)}
                  loading={pendingId === s.id}
                />
              ))}
            </div>
          </section>
        ))}
      </main>

      {showShare && <ShareModal url={shareUrl} onClose={() => setShowShare(false)} />}
    </div>
  )
}
