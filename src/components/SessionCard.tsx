import { MapPin, Users, User } from 'lucide-react'
import type { CampSession } from '../api/client'

const TYPE_LABELS: Record<string, string> = {
  PLENARY:  '全體大會',
  WORSHIP:  '敬拜',
  WORKSHOP: '工作坊',
  GENERAL:  '分組',
  OTHER:    '其他',
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
}

export default function SessionCard({ session: s, onSignup, onUnsignup, loading }: Props) {
  const atCapacity = s.capacity != null && s.signupCount >= s.capacity
  const pct = s.capacity ? Math.min(100, Math.round((s.signupCount / s.capacity) * 100)) : null
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
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md"
            style={{ background: `${typeColor}22`, color: typeColor }}>
            {TYPE_LABELS[s.sessionType] ?? s.sessionType}
          </span>
        </div>

        <h3 className="font-bold leading-snug" style={{ color: 'var(--text)', fontSize: 15 }}>{s.title}</h3>
        {s.titleEng && <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{s.titleEng}</p>}

        {(s.speaker || s.speakerEng) && (
          <div className="flex items-center gap-1.5 text-xs min-w-0" style={{ color: 'var(--text-mid)' }}>
            <User size={11} className="shrink-0" />
            <span className="truncate">{s.speaker}{s.speakerEng ? ` · ${s.speakerEng}` : ''}</span>
          </div>
        )}

        {s.location && (
          <div className="flex items-center gap-1.5 text-xs min-w-0" style={{ color: 'var(--text-dim)' }}>
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{s.location}</span>
          </div>
        )}

        {s.capacity != null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-dim)' }}>
              <span className="flex items-center gap-1"><Users size={11} />{s.signupCount} / {s.capacity}</span>
              {atCapacity && <span style={{ color: 'var(--accent)' }} className="font-semibold">額滿</span>}
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div className="h-full rounded-full" style={{
                width: `${pct ?? 0}%`,
                background: (pct ?? 0) >= 100 ? 'var(--accent)' : (pct ?? 0) >= 75 ? 'var(--amber)' : 'var(--green)'
              }} />
            </div>
          </div>
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
                ✓ 已報名 · 取消報名
              </button>
            ) : (
              <button
                disabled={loading || atCapacity}
                onClick={() => onSignup?.(s.id)}
                className="w-full py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-40"
                style={{ background: atCapacity ? 'var(--border)' : 'var(--accent)', color: atCapacity ? 'var(--text-dim)' : '#fff' }}
              >
                {atCapacity ? '額滿 Full' : '報名 Sign Up'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
