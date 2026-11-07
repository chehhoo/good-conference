import { useEffect, useRef } from 'react'
import { X, User } from 'lucide-react'
import { useQueries } from '@tanstack/react-query'
import { speakersApi, type Speaker } from '../api/client'
import { useLang } from '../lang-context'

interface Props {
  speakerIds: number[]
  fallbackName?: string | null
  onClose: () => void
}

function resolvePhotoUrl(url: string | null): string | null {
  if (!url) return null
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  if (url.startsWith('/api/')) return (import.meta.env.VITE_API_BASE_URL ?? '') + url.slice(4)
  return url
}

function SpeakerBio({ speaker, fallback, showName }: { speaker: Speaker | undefined; isLoading: boolean; isError: boolean; fallback?: string | null; showName?: boolean }) {
  const { primary, secondary } = useLang()

  if (!speaker) {
    return (
      <div className="space-y-3">
        <div className="w-24 h-24 rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface2)' }}>
          <User size={36} style={{ color: 'var(--text-dim)' }} />
        </div>
        {fallback && <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{fallback}</p>}
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>簡介即將更新 · Bio coming soon</p>
      </div>
    )
  }

  const displayName = [primary(speaker.nameChn, speaker.nameEng), secondary(speaker.nameChn, speaker.nameEng)].filter(Boolean).join(' · ')
  const photoUrl = resolvePhotoUrl(speaker.photoUrl)

  return (
    <div className="space-y-3">
      {photoUrl ? (
        <img src={photoUrl} alt={displayName} className="w-24 h-24 rounded-2xl object-cover" style={{ background: 'var(--surface2)' }} />
      ) : (
        <div className="w-24 h-24 rounded-2xl flex items-center justify-center" style={{ background: 'var(--surface2)' }}>
          <User size={36} style={{ color: 'var(--text-dim)' }} />
        </div>
      )}
      {showName && <p className="text-base font-black" style={{ color: 'var(--text)' }}>{displayName}</p>}
      {primary(speaker.bioChn, speaker.bioEng) && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{primary(speaker.bioChn, speaker.bioEng)}</p>
      )}
      {secondary(speaker.bioChn, speaker.bioEng) && (
        <p className="text-sm leading-relaxed" style={{ color: primary(speaker.bioChn, speaker.bioEng) ? 'var(--text-dim)' : 'var(--text)' }}>
          {secondary(speaker.bioChn, speaker.bioEng)}
        </p>
      )}
      {!speaker.bioChn && !speaker.bioEng && (
        <p className="text-sm" style={{ color: 'var(--text-dim)' }}>簡介即將更新 · Bio coming soon</p>
      )}
    </div>
  )
}

export default function SpeakerSheet({ speakerIds, fallbackName, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const { primary, secondary } = useLang()

  const results = useQueries({
    queries: speakerIds.map(id => ({
      queryKey: ['speaker', id] as const,
      queryFn: () => speakersApi.getById(id),
      staleTime: 5 * 60_000,
      retry: false,
    })),
  })

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const anyLoading = results.some(r => r.isLoading)

  // Header: for a single speaker, use their loaded name. For multiple, use fallbackName.
  const headerName = (() => {
    if (speakerIds.length === 1) {
      const s = results[0]?.data
      return s
        ? [primary(s.nameChn, s.nameEng), secondary(s.nameChn, s.nameEng)].filter(Boolean).join(' · ')
        : fallbackName ?? '…'
    }
    const derived = results.map(r => r.data ? primary(r.data.nameChn, r.data.nameEng) : '').filter(Boolean).join('、')
    return fallbackName ?? (derived || '…')
  })()

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
            {anyLoading ? '載入中… Loading…' : headerName}
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
        <div className="overflow-y-auto px-5 space-y-6" style={{ paddingBottom: 'calc(5rem + env(safe-area-inset-bottom))' }}>
          {anyLoading && (
            <div className="py-10 flex justify-center">
              <div className="w-8 h-8 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--border)', borderTopColor: 'var(--accent)' }} />
            </div>
          )}

          {!anyLoading && results.map((r, i) => (
            <div key={speakerIds[i]}>
              {i > 0 && <div className="border-t mb-6" style={{ borderColor: 'var(--border)' }} />}
              <SpeakerBio
                speaker={r.data}
                isLoading={r.isLoading}
                isError={r.isError}
                fallback={r.isError ? (fallbackName ?? null) : null}
                showName={speakerIds.length > 1}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
