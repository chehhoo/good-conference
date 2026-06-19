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

  const { data, isLoading } = useQuery({
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
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  const sessions = data ?? []

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
        <BookMarked size={40} strokeWidth={1.5} />
        <p className="text-lg font-medium">尚未報名任何場次</p>
        <p className="text-sm">No sessions signed up yet</p>
      </div>
    )
  }

  const byDay = groupByDay(sessions)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        我的行程 <span className="text-base font-normal text-gray-500">My Schedule</span>
      </h1>

      {byDay.map(([day, daySessions]) => (
        <section key={day}>
          {day > 0 && (
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
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
