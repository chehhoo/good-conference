import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Bell, X } from 'lucide-react'
import { announcementsApi, type Announcement } from '../api/client'
import { useAuth } from '../auth-context'
import { useLang } from '../lang-context'

const STORAGE_KEY = 'gc_read_announcements'

function getReadIds(): Set<number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveReadIds(ids: Set<number>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {}
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

function formatDate(iso: string, todayLabel: string) {
  try {
    const d = new Date(iso)
    const today = new Date()
    if (d.toDateString() === today.toDateString()) return todayLabel
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

export function NotificationBell() {
  const { token } = useAuth()
  const { t, primary, secondary } = useLang()
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState<Set<number>>(getReadIds)
  const panelRef = useRef<HTMLDivElement>(null)

  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: announcementsApi.getAll,
    refetchInterval: 30_000,
    staleTime: 25_000,
    enabled: !!token,
  })

  const unreadCount = announcements.filter(a => !readIds.has(a.id)).length

  function openPanel() {
    setOpen(true)
    const allIds = new Set([...readIds, ...announcements.map(a => a.id)])
    setReadIds(allIds)
    saveReadIds(allIds)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={open ? () => setOpen(false) : openPanel}
        className="relative p-2 rounded-xl transition-colors"
        style={{ color: unreadCount > 0 ? 'var(--accent)' : 'var(--text-dim)' }}
        aria-label="公告 Announcements"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 flex items-center justify-center rounded-full text-[9px] font-black leading-none"
            style={{
              background: 'var(--accent)',
              color: '#fff',
              minWidth: 14,
              height: 14,
              padding: '0 3px',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 rounded-2xl shadow-xl overflow-hidden z-50"
          style={{
            width: 320,
            maxHeight: 420,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
              公告 Announcements
            </span>
            <button onClick={() => setOpen(false)} style={{ color: 'var(--text-dim)' }}>
              <X size={16} />
            </button>
          </div>

          <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
            {announcements.length === 0 ? (
              <p className="px-4 py-6 text-sm text-center" style={{ color: 'var(--text-dim)' }}>
                {t('暫無公告', 'No announcements')}
              </p>
            ) : (
              announcements.map(a => (
                <div
                  key={a.id}
                  className="px-4 py-3 border-b last:border-b-0"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <p className="text-sm leading-snug" style={{ color: 'var(--text)' }}>
                    {primary(a.message, a.messageEng)}
                  </p>
                  {secondary(a.message, a.messageEng) && (
                    <p className="text-xs mt-1 leading-snug" style={{ color: 'var(--text-mid)' }}>
                      {secondary(a.message, a.messageEng)}
                    </p>
                  )}
                  <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-dim)' }}>
                    {formatDate(a.createdAt, t('今天', 'Today'))} · {formatTime(a.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
