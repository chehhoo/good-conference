import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookMarked, CalendarArrowDown, Loader2, Star } from 'lucide-react'
import { myApi, scheduleApi, type CampSession } from '../api/client'
import { useAuth } from '../auth-context'
import SessionCard from '../components/SessionCard'
import { ApiErrorCard } from '../components/ApiErrorCard'
import { useLang } from '../lang-context'
import { StarRatingSheet } from '../components/StarRatingSheet'

function escapeIcs(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function toIcsDate(iso: string) {
  return iso.replace(/[-:]/g, '').replace(/\.\d{3}/, '').replace('Z', 'Z') || iso
}

function buildIcs(sessions: CampSession[]): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Good Vessel//GFC 2026//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:GFC 2026 My Schedule',
  ]
  for (const s of sessions) {
    const uid = `gfc2026-session-${s.id}@goodvessel.org`
    const summary = s.titleEng ? `${s.title} / ${s.titleEng}` : s.title
    const desc = [s.description, s.descriptionEng].filter(Boolean).join(' / ')
    lines.push('BEGIN:VEVENT')
    lines.push(`UID:${uid}`)
    lines.push(`DTSTART:${toIcsDate(s.startTime)}`)
    lines.push(`DTEND:${toIcsDate(s.endTime)}`)
    lines.push(`SUMMARY:${escapeIcs(summary)}`)
    if (desc) lines.push(`DESCRIPTION:${escapeIcs(desc)}`)
    if (s.location) lines.push(`LOCATION:${escapeIcs(s.location)}`)
    lines.push('END:VEVENT')
  }
  lines.push('END:VCALENDAR')
  return lines.join('\r\n')
}

function downloadIcs(sessions: CampSession[]) {
  const content = buildIcs(sessions)
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'gfc2026-my-schedule.ics'
  a.click()
  URL.revokeObjectURL(url)
}

function groupByDay(sessions: Awaited<ReturnType<typeof myApi.mySignups>>) {
  const map = new Map<number, typeof sessions>()
  for (const s of sessions) {
    const day = s.day ?? 0
    const bucket = map.get(day) ?? []
    bucket.push(s)
    map.set(day, bucket)
  }
  return [...map.entries()].sort(([a], [b]) => a - b)
}

export default function MySchedule() {
  const qc = useQueryClient()
  const { person, token } = useAuth()
  const { t } = useLang()
  const myProgram = person?.programCode ?? null
  const personId = person?.id ?? null
  const [ratingSession, setRatingSession] = useState<CampSession | null>(null)
  const [localRatings, setLocalRatings] = useState<Record<number, number>>({})
  const now = Date.now()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-signups', personId],
    queryFn: myApi.mySignups,
    staleTime: 60_000,
    enabled: !!token,
  })

  const unsignup = useMutation({
    mutationFn: (id: number) => scheduleApi.unsignup(id),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['schedule', personId] })
      qc.invalidateQueries({ queryKey: ['my-signups', personId] })
    },
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--text-dim)' }} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10">
        <ApiErrorCard onRetry={() => refetch()} />
      </div>
    )
  }

  const sessions = data ?? []

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--text-dim)' }}>
        <BookMarked size={40} strokeWidth={1.5} />
        <p className="text-lg font-medium">尚未報名任何場次</p>
        <p className="text-sm">No sessions signed up yet</p>
      </div>
    )
  }

  const byDay = groupByDay(sessions)

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>我的行程</h1>
          <span className="text-sm" style={{ color: 'var(--text-dim)' }}>My Schedule</span>
        </div>
        <button
          onClick={() => downloadIcs(sessions)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-mid)' }}
          title={t('匯出行事曆', 'Export to Calendar')}
        >
          <CalendarArrowDown size={14} />
          <span>{t('匯出', 'Export .ics')}</span>
        </button>
      </div>

      {ratingSession && (
        <StarRatingSheet
          sessionId={ratingSession.id}
          sessionTitle={[ratingSession.title, ratingSession.titleEng].filter(Boolean).join(' / ')}
          initialRating={localRatings[ratingSession.id]}
          onClose={() => setRatingSession(null)}
          onRated={rating => setLocalRatings(prev => ({ ...prev, [ratingSession.id]: rating }))}
        />
      )}

      {byDay.map(([day, daySessions]) => (
        <section key={day}>
          {day > 0 && (
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
              第 {day} 天 · Day {day}
            </h2>
          )}
          <div className="space-y-3">
            {daySessions.map(s => {
              const ended = new Date(s.endTime).getTime() < now
              const rated = localRatings[s.id]
              return (
                <div key={s.id}>
                  <SessionCard
                    session={s}
                    loading={unsignup.isPending && unsignup.variables === s.id}
                    onUnsignup={ended ? undefined : () => unsignup.mutate(s.id)}
                    viewingProgram={myProgram}
                  />
                  {ended && (
                    <button
                      onClick={() => setRatingSession(s)}
                      className="w-full mt-1.5 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-colors"
                      style={{
                        background: rated ? 'var(--gold-dim)' : 'var(--surface)',
                        border: '1px solid var(--border)',
                        color: rated ? 'var(--gold)' : 'var(--text-dim)',
                      }}
                    >
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} size={13}
                          fill={rated && i <= rated ? 'var(--gold)' : 'none'}
                          color={rated && i <= rated ? 'var(--gold)' : 'var(--border)'}
                          strokeWidth={1.5}
                        />
                      ))}
                      <span>{rated ? t('已評分', 'Rated') : t('評分此場次', 'Rate this session')}</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
