import { useQuery } from '@tanstack/react-query'
import { Loader2, User } from 'lucide-react'
import { myApi, type FamilyMember, type MealDay } from '../api/client'
import { useAuth } from '../auth-context'

const MEAL_LABELS = ['早餐', '午餐', '晚餐'] as const
const MEAL_KEYS: (keyof MealDay)[] = ['breakfast', 'lunch', 'dinner']
const NIGHT_LABELS = ['第一夜', '第二夜', '第三夜', '第四夜']

const LODGING_BADGES: Record<string, { label: string; cn: string }> = {
  STAY:          { label: '住宿 Stay',     cn: 'bg-blue-100 text-blue-700' },
  COMMUTE:       { label: '通勤 Commute',  cn: 'bg-amber-100 text-amber-700' },
  SELF_ARRANGED: { label: '自行安排',      cn: 'bg-gray-100 text-gray-600' },
}

const AGE_LABELS: Record<string, string> = {
  AD: '成人',
  YA: '青年',
  JR: '少年',
  CH: '兒童',
  IN: '嬰幼兒',
}

const GENDER_LABELS: Record<string, string> = {
  M: '男',
  F: '女',
  C: '兒',
}

function MealsGrid({ meals }: { meals: FamilyMember['meals'] }) {
  if (!meals) return <p className="text-xs text-gray-400">無膳食資料</p>

  const days = Object.keys(meals).sort()
  const hasAnyMeal = days.some(d =>
    MEAL_KEYS.some(k => meals[d][k] === true)
  )
  if (!hasAnyMeal) return <p className="text-xs text-gray-400">無膳食安排</p>

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="text-gray-500">
            <th className="text-left py-1 pr-2 font-medium">天</th>
            {MEAL_LABELS.map(l => (
              <th key={l} className="text-center py-1 px-1 font-medium">{l}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map(d => {
            const row = meals[d]
            if (MEAL_KEYS.every(k => !row[k])) return null
            return (
              <tr key={d} className="border-t border-gray-100">
                <td className="py-1 pr-2 text-gray-500">第{d}天</td>
                {MEAL_KEYS.map(k => (
                  <td key={k} className="text-center py-1 px-1">
                    {row[k] === true
                      ? <span className="text-green-600 font-bold">✓</span>
                      : <span className="text-gray-200">—</span>
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
  if (!lodging) return <p className="text-xs text-gray-400">無住宿資料</p>

  const badge = lodging.status ? LODGING_BADGES[lodging.status] : null
  const rooms = Object.entries(lodging.nights).filter(([, room]) => room != null)

  return (
    <div className="space-y-1.5">
      {badge && (
        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${badge.cn}`}>
          {badge.label}
        </span>
      )}
      {rooms.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-1">
          {rooms.map(([night, room]) => (
            <span key={night} className="text-xs bg-gray-50 border border-gray-200 rounded px-2 py-0.5 text-gray-700">
              {NIGHT_LABELS[Number(night) - 1] ?? `夜${night}`}: {room}
            </span>
          ))}
        </div>
      )}
      {rooms.length === 0 && lodging.status === 'STAY' && (
        <p className="text-xs text-gray-400">房間尚未分配</p>
      )}
    </div>
  )
}

function MemberCard({ member }: { member: FamilyMember }) {
  const displayName = member.chineseName || `${member.firstName} ${member.lastName}`
  const engName = member.chineseName ? `${member.firstName} ${member.lastName}` : null

  return (
    <div className={`bg-white rounded-xl border border-t-[3px] shadow-sm p-4 space-y-4 ${
      member.isMe ? 'border-t-blue-600 border-blue-100' : 'border-t-gray-300 border-gray-100'
    }`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-full p-2 ${member.isMe ? 'bg-blue-100' : 'bg-gray-100'}`}>
          <User size={20} className={member.isMe ? 'text-blue-600' : 'text-gray-500'} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900">{displayName}</span>
            {member.isMe && (
              <span className="text-[11px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-medium">我</span>
            )}
          </div>
          {engName && <p className="text-xs text-gray-500">{engName}</p>}
          <div className="flex gap-1.5 mt-0.5">
            {member.gender && (
              <span className="text-[11px] text-gray-500">{GENDER_LABELS[member.gender] ?? member.gender}</span>
            )}
            {member.ageCode && (
              <span className="text-[11px] text-gray-500">· {AGE_LABELS[member.ageCode] ?? member.ageCode}</span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">膳食 Meals</p>
        <MealsGrid meals={member.meals} />
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">住宿 Lodging</p>
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
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center py-20 gap-2 text-gray-500">
        <p>無法載入資料</p>
        <p className="text-sm">Unable to load info</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        我的資訊 <span className="text-base font-normal text-gray-500">My Info</span>
      </h1>

      {data.members.map(m => (
        <MemberCard key={m.id} member={m} />
      ))}
    </div>
  )
}
