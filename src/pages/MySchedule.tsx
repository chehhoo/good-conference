import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookMarked, Loader2 } from 'lucide-react'
import { myApi, scheduleApi } from '../api/client'
import { useAuth } from '../auth-context'
import SessionCard from '../components/SessionCard'

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
  const personId = person?.id ?? null

  const { data, isLoading, isError } = useQuery({
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
      <div className="flex flex-col items-center justify-center py-20 gap-3" style={{ color: 'var(--accent)' }}>
        <BookMarked size={40} strokeWidth={1.5} />
        <p className="text-lg font-medium">無法載入我的行程</p>
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Could not load your schedule. Please try again later.</p>
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
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>我的行程</h1>
        <span className="text-sm" style={{ color: 'var(--text-dim)' }}>My Schedule</span>
      </div>

      {byDay.map(([day, daySessions]) => (
        <section key={day}>
          {day > 0 && (
            <h2 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--text-dim)' }}>
              第 {day} 天 · Day {day}
            </h2>
          )}
          <div className="space-y-3">
            {daySessions.map(s => (
              <SessionCard
                key={s.id}
                session={s}
                loading={unsignup.isPending && unsignup.variables === s.id}
                onUnsignup={() => unsignup.mutate(s.id)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
