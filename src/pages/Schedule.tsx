import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Loader2 } from 'lucide-react'
import { scheduleApi, type CampSession } from '../api/client'
import SessionCard from '../components/SessionCard'

function groupByTime(sessions: CampSession[]): [string, CampSession[]][] {
  const map = new Map<string, CampSession[]>()
  for (const s of sessions) {
    const key = s.startTime.slice(0, 16) // "YYYY-MM-DDTHH:MM"
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
  return new Date(iso).toLocaleDateString('zh-TW', { month: 'long', day: 'numeric', weekday: 'short' })
}

export default function Schedule() {
  const qc = useQueryClient()
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const { data: sessions = [], isLoading, isError } = useQuery<CampSession[]>({
    queryKey: ['schedule'],
    queryFn: scheduleApi.getAll,
  })

  const signup = useMutation({
    mutationFn: (id: number) => scheduleApi.signup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule'] }),
  })

  const unsignup = useMutation({
    mutationFn: (id: number) => scheduleApi.unsignup(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['schedule'] }),
  })

  // Derive available days from data
  const days = [...new Set(sessions.map(s => s.day).filter((d): d is number => d != null))].sort()

  const visible = selectedDay != null
    ? sessions.filter(s => s.day === selectedDay)
    : sessions

  const grouped = groupByTime(visible)
  const isMutating = signup.isPending || unsignup.isPending

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-900 text-white">
        <div className="max-w-4xl mx-auto px-5 py-8">
          <div className="flex items-center gap-3 mb-1">
            <CalendarDays size={28} />
            <h1 className="text-2xl font-bold tracking-tight">大會行程</h1>
          </div>
          <p className="text-blue-200 text-sm">Conference Schedule</p>
        </div>

        {/* Day tabs */}
        {days.length > 0 && (
          <div className="max-w-4xl mx-auto px-5 pb-0 flex gap-1 overflow-x-auto">
            <button
              onClick={() => setSelectedDay(null)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                selectedDay === null
                  ? 'bg-gray-50 text-brand-900'
                  : 'text-blue-200 hover:text-white hover:bg-brand-700'
              }`}
            >
              全部
            </button>
            {days.map(d => {
              const firstSession = sessions.find(s => s.day === d)
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap ${
                    selectedDay === d
                      ? 'bg-gray-50 text-brand-900'
                      : 'text-blue-200 hover:text-white hover:bg-brand-700'
                  }`}
                >
                  第 {d} 天
                  {firstSession && (
                    <span className="ml-1 text-xs opacity-70">
                      {fmtDayDate(firstSession.startTime)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-5 py-8">
        {isLoading && (
          <div className="flex justify-center py-20 text-gray-400">
            <Loader2 size={32} className="animate-spin" />
          </div>
        )}

        {isError && (
          <div className="text-center py-20 text-red-500 text-sm">
            無法載入行程，請稍後再試。<br />
            <span className="text-gray-400">Could not load schedule. Please try again later.</span>
          </div>
        )}

        {!isLoading && !isError && visible.length === 0 && (
          <div className="text-center py-20 text-gray-400 text-sm">
            尚未排定行程。<br />No sessions scheduled yet.
          </div>
        )}

        {grouped.map(([timeKey, slot]) => (
          <section key={timeKey} className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-semibold text-brand-700 bg-blue-50 px-3 py-1 rounded-full">
                {fmtSlot(timeKey)}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {slot.map(s => (
                <SessionCard
                  key={s.id}
                  session={s}
                  onSignup={id => signup.mutate(id)}
                  onUnsignup={id => unsignup.mutate(id)}
                  loading={isMutating}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  )
}
