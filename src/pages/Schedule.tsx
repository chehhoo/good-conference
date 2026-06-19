import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, Share2 } from 'lucide-react'
import { scheduleApi, type CampSession } from '../api/client'
import { useAuth } from '../auth-context'
import SessionCard from '../components/SessionCard'
import ShareModal from '../components/ShareModal'

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

export default function Schedule() {
  const qc = useQueryClient()
  const { person } = useAuth()
  const personId = person?.id ?? null

  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [pendingId, setPendingId] = useState<number | null>(null)
  const [showShare, setShowShare] = useState(false)
  const shareUrl = window.location.origin + import.meta.env.BASE_URL

  const { data: sessions = [], isLoading, isError } = useQuery<CampSession[]>({
    queryKey: ['schedule', personId],
    queryFn: scheduleApi.getAll,
  })

  const signup = useMutation({
    mutationFn: (id: number) => scheduleApi.signup(id),
    onMutate: (id) => setPendingId(id),
    onSettled: () => {
      setPendingId(null)
      qc.invalidateQueries({ queryKey: ['schedule', personId] })
      qc.invalidateQueries({ queryKey: ['my-signups', personId] })
    },
  })

  const unsignup = useMutation({
    mutationFn: (id: number) => scheduleApi.unsignup(id),
    onMutate: (id) => setPendingId(id),
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

  const visible = selectedDay != null
    ? sessions.filter(s => s.day === selectedDay)
    : sessions

  const grouped = groupByTime(visible)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Day tab bar — sticky so it stays visible while scrolling */}
      {days.length > 0 && (
        <div className="sticky top-0 z-10 bg-brand-900 border-b border-brand-700 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 flex gap-0.5 overflow-x-auto scrollbar-hide items-center">
            <button
              onClick={() => setSelectedDay(null)}
              className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                selectedDay === null
                  ? 'border-b-2 border-white text-white'
                  : 'text-blue-300 hover:text-white'
              }`}
            >
              全部
            </button>
            {days.map(d => {
              const first = firstByDay.get(d)
              return (
                <button
                  key={d}
                  onClick={() => setSelectedDay(d)}
                  className={`shrink-0 px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
                    selectedDay === d
                      ? 'border-b-2 border-white text-white'
                      : 'text-blue-300 hover:text-white'
                  }`}
                >
                  第 {d} 天
                  {/* Show date only on larger screens — too cramped on mobile */}
                  {first && (
                    <span className="hidden sm:inline ml-1 text-xs opacity-60">
                      {fmtDayDate(first.startTime)}
                    </span>
                  )}
                </button>
              )
            })}
            <button
              onClick={() => setShowShare(true)}
              className="ml-auto shrink-0 p-2 rounded-lg text-blue-300 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="分享 Share"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-safe">
        {isLoading && (
          <div className="flex justify-center py-20 text-gray-400">
            <Loader2 size={32} className="animate-spin" />
          </div>
        )}

        {isError && (
          <div className="text-center py-20 text-sm">
            <p className="text-red-500">無法載入行程，請稍後再試。</p>
            <p className="text-gray-400 mt-1">Could not load schedule. Please try again later.</p>
          </div>
        )}

        {!isLoading && !isError && visible.length === 0 && (
          <div className="text-center py-20 text-sm">
            <p className="text-gray-400">尚未排定行程。</p>
            <p className="text-gray-300 mt-1">No sessions scheduled yet.</p>
          </div>
        )}

        {grouped.map(([timeKey, slot]) => (
          <section key={timeKey} className="mb-6 sm:mb-8">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <span className="text-xs sm:text-sm font-semibold text-brand-700 bg-blue-50 px-3 py-1 rounded-full whitespace-nowrap">
                {fmtSlot(timeKey)}
              </span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
