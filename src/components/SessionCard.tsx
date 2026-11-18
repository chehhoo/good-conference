import { useState } from 'react'
import { MapPin, User } from 'lucide-react'
import { Link } from 'react-router-dom'
import { linkedSpeakerIds, type CampSession } from '../api/client'
import SpeakerSheet from './SpeakerSheet'
import { useLang } from '../lang-context'

const TYPE_ZH: Record<string, string> = {
  PLENARY:  '全體大會',
  WORSHIP:  '敬拜',
  WORKSHOP: '工作坊',
  GENERAL:  '分組',
  OTHER:    '其他',
}
const TYPE_EN: Record<string, string> = {
  PLENARY:  'Plenary',
  WORSHIP:  'Worship',
  WORKSHOP: 'Workshop',
  GENERAL:  'Session',
  OTHER:    'Other',
}

const TYPE_ACCENT: Record<string, string> = {
  PLENARY:  'var(--accent)',
  WORSHIP:  'var(--gold)',
  WORKSHOP: '#63B3ED',
  GENERAL:  'var(--green)',
  OTHER:    'var(--text-dim)',
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false })
}

interface Props {
  session: CampSession
  onSignup?: (id: number) => void
  onUnsignup?: (id: number) => void
  loading?: boolean
  /** When set, show a program chip if session.programCode differs from this value */
  viewingProgram?: string | null
}

// Deterministic avatar colors from session id — no real attendee data needed
const AVATAR_COLORS = ['#5b6af0','#e45c8a','#22b5a0','#f07a2a','#8b5cf6','#0ea5e9','#d97706','#16a34a']

function SocialCapacity({ id, count, capacity }: { id: number; count: number; capacity: number }) {
  const { t } = useLang()
  const pct = Math.min(100, Math.round((count / capacity) * 100))
  const spotsLeft = Math.max(0, capacity - count)
  const isAlmostFull = pct >= 80 && pct < 100
  const isFull = pct >= 100

  // Show up to 5 avatar circles, colors seeded by session id
  const avatarCount = Math.min(5, count)
  const avatars = Array.from({ length: avatarCount }, (_, i) => AVATAR_COLORS[(id + i) % AVATAR_COLORS.length])

  return (
    <div className="flex items-center gap-2">
      {/* Avatar stack */}
      {count > 0 && (
        <div className="flex items-center" style={{ gap: -4 }}>
          {avatars.map((color, i) => (
            <div
              key={i}
              className="rounded-full flex-shrink-0"
              style={{
                width: 18, height: 18,
                background: color,
                border: '2px solid var(--surface)',
                marginLeft: i === 0 ? 0 : -6,
              }}
            />
          ))}
        </div>
      )}

      {/* Count label */}
      <span className="text-xs font-semibold" style={{ color: 'var(--text-dim)' }}>
        {isFull
          ? <span style={{ color: 'var(--accent)' }}>{t('額滿 Full', 'Full')}</span>
          : isAlmostFull
            ? <><span style={{ color: 'var(--text-mid)' }}>{t(`${count} 人報名`, `${count} attending`)}</span></>
            : t(`${count} 人報名`, `${count} attending`)
        }
      </span>

      {/* Urgency badge */}
      {isAlmostFull && !isFull && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md ml-auto"
          style={{ background: 'var(--amber)', color: '#1a1200' }}>
          {t(`剩 ${spotsLeft} 位`, `${spotsLeft} left`)}
        </span>
      )}
      {isFull && (
        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md ml-auto"
          style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
          {t('等候名單', 'Waitlist')}
        </span>
      )}
    </div>
  )
}

export default function SessionCard({ session: s, onSignup, onUnsignup, loading, viewingProgram }: Props) {
  const [speakerOpen, setSpeakerOpen] = useState(false)
  const { t, primary, secondary } = useLang()
  const showProgramChip = s.programCode && s.programCode !== viewingProgram
  const atCapacity = s.capacity != null && s.signupCount >= s.capacity
  const typeColor = TYPE_ACCENT[s.sessionType] ?? 'var(--text-dim)'

  return (
    <div className="rounded-2xl p-4 flex gap-3 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {/* Time column */}
      <div className="flex flex-col items-center min-w-[40px]">
        <span className="text-sm font-black leading-none" style={{ color: 'var(--accent)' }}>{fmt(s.startTime)}</span>
        <div className="w-px flex-1 my-1.5 rounded-full" style={{ background: 'var(--border)', minHeight: 12 }} />
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{fmt(s.endTime)}</span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
            style={{ background: `${typeColor}22`, color: typeColor }}>
            {t(TYPE_ZH[s.sessionType] ?? s.sessionType, TYPE_EN[s.sessionType] ?? s.sessionType)}
          </span>
          {showProgramChip && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md"
              style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>
              {s.programName ?? s.programCode}
            </span>
          )}
        </div>

        <h3 className="font-bold leading-snug" style={{ color: 'var(--text)', fontSize: 15 }}>{primary(s.title, s.titleEng)}</h3>
        {secondary(s.title, s.titleEng) && <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{secondary(s.title, s.titleEng)}</p>}

        {(s.speaker || s.speakerEng) && (() => {
          const ids = linkedSpeakerIds(s)
          return ids.length > 0 ? (
            <>
              <button
                onClick={e => { e.stopPropagation(); setSpeakerOpen(true) }}
                className="flex items-center gap-1.5 text-xs min-w-0 hover:underline text-left"
                style={{ color: 'var(--text-mid)' }}
              >
                <User size={11} className="shrink-0" />
                <span className="truncate">{primary(s.speaker, s.speakerEng)}{secondary(s.speaker, s.speakerEng) ? ` · ${secondary(s.speaker, s.speakerEng)}` : ''}</span>
              </button>
              {speakerOpen && (
                <SpeakerSheet
                  speakerIds={ids}
                  fallbackName={[s.speaker, s.speakerEng].filter(Boolean).join(' · ')}
                  onClose={() => setSpeakerOpen(false)}
                />
              )}
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs min-w-0" style={{ color: 'var(--text-mid)' }}>
              <User size={11} className="shrink-0" />
              <span className="truncate">{primary(s.speaker, s.speakerEng)}{secondary(s.speaker, s.speakerEng) ? ` · ${secondary(s.speaker, s.speakerEng)}` : ''}</span>
            </div>
          )
        })()}

        {s.location && (
          <Link
            to={`/map?room=${encodeURIComponent(s.location)}`}
            className="flex items-center gap-1.5 text-xs min-w-0 hover:underline"
            style={{ color: 'var(--text-dim)' }}
          >
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{s.location}</span>
          </Link>
        )}

        {s.capacity != null && (
          <SocialCapacity id={s.id} count={s.signupCount} capacity={s.capacity} />
        )}

        {s.description && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: 'var(--text-dim)' }}>{s.description}</p>
        )}

        {(onSignup || onUnsignup) && (
          <div className="pt-1 mt-auto">
            {s.signedUp ? (
              <button
                disabled={loading}
                onClick={() => onUnsignup?.(s.id)}
                className="w-full py-2.5 rounded-xl text-xs font-bold border transition-colors disabled:opacity-50"
                style={{ background: 'var(--green-dim)', color: 'var(--green)', borderColor: 'transparent' }}
              >
                ✓ {t('已報名 · 取消報名', 'Signed Up · Cancel')}
              </button>
            ) : (
              <button
                disabled={loading || atCapacity}
                onClick={() => onSignup?.(s.id)}
                className="w-full py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-40"
                style={{ background: atCapacity ? 'var(--border)' : 'var(--accent)', color: atCapacity ? 'var(--text-dim)' : '#fff' }}
              >
                {atCapacity ? t('額滿 Full', 'Full') : t('報名 Sign Up', 'Sign Up')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
