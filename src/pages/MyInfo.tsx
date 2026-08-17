import { useQuery } from '@tanstack/react-query'
import { Loader2, User } from 'lucide-react'
import { myApi, type FamilyMember, type MealDay } from '../api/client'
import { useAuth } from '../auth-context'

const MEAL_LABELS = ['早餐', '午餐', '晚餐'] as const
const MEAL_KEYS: (keyof MealDay)[] = ['breakfast', 'lunch', 'dinner']
const NIGHT_LABELS = ['第一夜', '第二夜', '第三夜', '第四夜']

const LODGING_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  STAY:          { label: '住宿 Stay',    color: '#63B3ED', bg: 'rgba(99,179,237,0.15)' },
  COMMUTE:       { label: '通勤 Commute', color: 'var(--gold)', bg: 'var(--gold-dim)' },
  SELF_ARRANGED: { label: '自行安排',     color: 'var(--text-dim)', bg: 'var(--border)' },
}

const AGE_LABELS: Record<string, string> = {
  AD: '成人', YA: '青年', JR: '少年', CH: '兒童', IN: '嬰幼兒',
}

const GENDER_LABELS: Record<string, string> = { M: '男', F: '女', C: '兒' }

function MealsGrid({ meals }: { meals: FamilyMember['meals'] }) {
  if (!meals) return <p className="text-xs" style={{ color: 'var(--text-dim)' }}>無膳食資料</p>
  const days = Object.keys(meals).sort()
  const hasAny = days.some(d => MEAL_KEYS.some(k => meals[d][k] === true))
  if (!hasAny) return <p className="text-xs" style={{ color: 'var(--text-dim)' }}>無膳食安排</p>
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr style={{ color: 'var(--text-dim)' }}>
            <th className="text-left py-1 pr-2 font-medium">天</th>
            {MEAL_LABELS.map(l => <th key={l} className="text-center py-1 px-2 font-medium">{l}</th>)}
          </tr>
        </thead>
        <tbody>
          {days.map(d => {
            const row = meals[d]
            if (MEAL_KEYS.every(k => !row[k])) return null
            return (
              <tr key={d} className="border-t" style={{ borderColor: 'var(--border)' }}>
                <td className="py-1 pr-2" style={{ color: 'var(--text-dim)' }}>第{d}天</td>
                {MEAL_KEYS.map(k => (
                  <td key={k} className="text-center py-1 px-2">
                    {row[k] === true
                      ? <span style={{ color: 'var(--green)' }} className="font-bold">✓</span>
                      : <span style={{ color: 'var(--border)' }}>—</span>
                    }
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function LodgingInfo({ lodging }: { lodging: FamilyMember['lodging'] }) {
  if (!lodging) return <p className="text-xs" style={{ color: 'var(--text-dim)' }}>無住宿資料</p>
  const badge = lodging.status ? LODGING_STATUS[lodging.status] : null
  const rooms = Object.entries(lodging.nights).filter(([, room]) => room != null)
  return (
    <div className="space-y-2">
      {badge && (
        <span className="inline-block text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: badge.bg, color: badge.color }}>
          {badge.label}
        </span>
      )}
      {rooms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {rooms.map(([night, room]) => (
            <span key={night} className="text-xs px-2 py-0.5 rounded border" style={{ borderColor: 'var(--border)', color: 'var(--text-mid)' }}>
              {NIGHT_LABELS[Number(night) - 1] ?? `夜${night}`}: {room}
            </span>
          ))}
        </div>
      )}
      {rooms.length === 0 && lodging.status === 'STAY' && (
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>房間尚未分配</p>
      )}
    </div>
  )
}

function MemberCard({ member }: { member: FamilyMember }) {
  const displayName = member.chineseName || `${member.firstName} ${member.lastName}`
  const engName = member.chineseName ? `${member.firstName} ${member.lastName}` : null

  return (
    <div className="rounded-2xl p-4 space-y-4 border"
      style={{
        background: 'var(--surface)',
        borderColor: member.isMe ? 'var(--accent)' : 'var(--border)',
        borderTopWidth: member.isMe ? 2 : 1,
        borderTopColor: member.isMe ? 'var(--accent)' : 'var(--border)',
      }}>
      <div className="flex items-center gap-3">
        <div className="rounded-full p-2" style={{ background: member.isMe ? 'var(--accent-dim)' : 'var(--surface2)' }}>
          <User size={18} style={{ color: member.isMe ? 'var(--accent)' : 'var(--text-dim)' }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold" style={{ color: 'var(--text)' }}>{displayName}</span>
            {member.isMe && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: 'var(--accent)', color: '#fff' }}>我</span>
            )}
          </div>
          {engName && <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{engName}</p>}
          <div className="flex gap-1.5 mt-0.5">
            {member.gender && <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{GENDER_LABELS[member.gender] ?? member.gender}</span>}
            {member.ageCode && <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>· {AGE_LABELS[member.ageCode] ?? member.ageCode}</span>}
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>膳食 Meals</p>
        <MealsGrid meals={member.meals} />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>住宿 Lodging</p>
        <LodgingInfo lodging={member.lodging} />
      </div>
    </div>
  )
}

export default function MyInfo() {
  const { person, token } = useAuth()
  const personId = person?.id ?? null

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-family', personId],
    queryFn: myApi.family,
    staleTime: 60_000,
    enabled: !!token,
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--text-dim)' }} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center py-20 gap-2" style={{ color: 'var(--text-dim)' }}>
        <p>無法載入資料</p>
        <p className="text-sm">Unable to load info</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
      <div className="flex items-baseline gap-2">
        <h1 className="text-2xl font-black" style={{ color: 'var(--text)' }}>我的資訊</h1>
        <span className="text-sm" style={{ color: 'var(--text-dim)' }}>My Info</span>
      </div>

      {data.members.map(m => (
        <MemberCard key={m.id} member={m} />
      ))}
    </div>
  )
}
