import { Clock, MapPin, Users, User } from 'lucide-react'
import type { CampSession } from '../api/client'

const TYPE_COLORS: Record<string, string> = {
  PLENARY:  'bg-blue-100 text-blue-800',
  WORSHIP:  'bg-purple-100 text-purple-800',
  WORKSHOP: 'bg-amber-100 text-amber-800',
  GENERAL:  'bg-green-100 text-green-800',
  OTHER:    'bg-gray-100 text-gray-700',
}

const TYPE_LABELS: Record<string, string> = {
  PLENARY:  '全體大會',
  WORSHIP:  '敬拜',
  WORKSHOP: '工作坊',
  GENERAL:  '分組',
  OTHER:    '其他',
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

  return (
    <div className="bg-white rounded-xl border border-gray-100 border-t-[3px] border-t-blue-600 shadow-sm p-4 sm:p-5 flex flex-col gap-3">
      {/* Type badge + time */}
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[s.sessionType] ?? TYPE_COLORS.OTHER}`}>
          {TYPE_LABELS[s.sessionType] ?? s.sessionType}
        </span>
        <span className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
          <Clock size={12} />
          {fmt(s.startTime)}–{fmt(s.endTime)}
        </span>
      </div>

      {/* Title */}
      <div>
        <h3 className="text-base font-bold text-gray-900 leading-snug">{s.title}</h3>
        {s.titleEng && <p className="text-xs text-gray-500 mt-0.5">{s.titleEng}</p>}
      </div>

      {/* Speaker */}
      {(s.speaker || s.speakerEng) && (
        <div className="flex items-center gap-1.5 text-sm text-gray-700 min-w-0">
          <User size={13} className="shrink-0 text-gray-400" />
          <span className="truncate">{s.speaker}</span>
          {s.speakerEng && <span className="text-gray-400 shrink-0">· {s.speakerEng}</span>}
        </div>
      )}

      {/* Location */}
      {s.location && (
        <div className="flex items-center gap-1.5 text-sm text-gray-600 min-w-0">
          <MapPin size={13} className="shrink-0 text-gray-400" />
          <span className="truncate">{s.location}</span>
        </div>
      )}

      {/* Capacity bar */}
      {s.capacity != null && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Users size={12} />{s.signupCount} / {s.capacity}
            </span>
            {atCapacity && <span className="text-red-600 font-medium">已額滿 Full</span>}
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                pct! >= 100 ? 'bg-red-500' : pct! >= 75 ? 'bg-amber-400' : 'bg-green-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      {/* Description */}
      {s.description && (
        <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{s.description}</p>
      )}

      {/* Signup button — tall touch target (min ~48px) for mobile */}
      {(onSignup || onUnsignup) && (
        <div className="pt-1 mt-auto">
          {s.signedUp ? (
            <button
              disabled={loading}
              onClick={() => onUnsignup?.(s.id)}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-green-50 text-green-700 border border-green-200 hover:bg-red-50 hover:text-red-700 hover:border-red-200 active:scale-95 transition-all disabled:opacity-50"
            >
              ✓ 已報名 · 取消報名
            </button>
          ) : (
            <button
              disabled={loading || atCapacity}
              onClick={() => onSignup?.(s.id)}
              className="w-full py-3 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-40"
            >
              {atCapacity ? '額滿 Full' : '報名 Sign Up'}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
