import { useEffect, useRef } from 'react'
import { X, User } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { speakersApi } from '../api/client'

interface Props {
  speakerId: number
  fallbackName?: string | null
  onClose: () => void
}

export default function SpeakerSheet({ speakerId, fallbackName, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)

  const { data: speaker, isLoading, isError } = useQuery({
    queryKey: ['speaker', speakerId],
    queryFn: () => speakersApi.getById(speakerId),
    staleTime: 5 * 60_000,
    retry: false,
  })

  // Close on backdrop click
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const displayName = speaker
    ? [speaker.nameChn, speaker.nameEng].filter(Boolean).join(' · ')
    : fallbackName ?? ''

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={e => { e.stopPropagation(); if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={sheetRef}
        className="w-full max-w-lg mx-auto rounded-t-3xl overflow-hidden"
        style={{ background: 'var(--surface)', maxHeight: '85dvh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border2)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 shrink-0">
          <h2 className="text-base font-black" style={{ color: 'var(--text)' }}>
            {isLoading ? '載入中…' : displayName}
          </h2>
          <button
            onClick={e => { e.stopPropagation(); onClose() }}
            className="p-2 rounded-xl"
            style={{ color: 'var(--text-dim)' }}
            aria-label="關閉"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto px-5" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
          {isLoading && (
            <div className="py-10 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
            </div>
          )}

          {isError && (
            <div className="space-y-4">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center"
                style={{ background: 'var(--surface2)' }}>
                <User size={36} style={{ color: 'var(--text-dim)' }} />
              </div>
              <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                簡介即將更新 · Bio coming soon
              </p>
            </div>
          )}

          {!isLoading && speaker && (
            <div className="space-y-5">
              {/* Photo */}
              {speaker.photoUrl ? (
                <img
                  src={speaker.photoUrl}
                  alt={displayName}
                  className="w-24 h-24 rounded-2xl object-cover"
                  style={{ background: 'var(--surface2)' }}
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center"
                  style={{ background: 'var(--surface2)' }}>
                  <User size={36} style={{ color: 'var(--text-dim)' }} />
                </div>
              )}

              {/* Bio — Chinese */}
              {speaker.bioChn && (
                <div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
                    {speaker.bioChn}
                  </p>
                </div>
              )}

              {/* Bio — English */}
              {speaker.bioEng && (
                <div className={speaker.bioChn ? 'border-t pt-4' : ''} style={{ borderColor: 'var(--border)' }}>
                  <p className="text-sm leading-relaxed" style={{ color: speaker.bioChn ? 'var(--text-dim)' : 'var(--text)' }}>
                    {speaker.bioEng}
                  </p>
                </div>
              )}

              {/* No bio yet */}
              {!speaker.bioChn && !speaker.bioEng && (
                <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                  簡介即將更新 · Bio coming soon
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
