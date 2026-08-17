import { useQuery } from '@tanstack/react-query'
import QRCode from 'react-qr-code'
import { QrCode, Utensils } from 'lucide-react'
import { myApi, type MealDay } from '../api/client'
import { useAuth } from '../auth-context'

const MEAL_LABELS: { key: keyof MealDay; zh: string; emoji: string }[] = [
  { key: 'breakfast', zh: '早餐', emoji: '🌅' },
  { key: 'lunch',     zh: '午餐', emoji: '☀️' },
  { key: 'dinner',    zh: '晚餐', emoji: '🌙' },
]

function MealPill({ value }: { value: boolean | null }) {
  if (value === true)
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>✓ 有</span>
  if (value === false)
    return <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'var(--border)', color: 'var(--text-dim)' }}>無</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'var(--border2)', color: 'var(--text-dim)' }}>—</span>
}

export default function MyQR() {
  const { person } = useAuth()
  const personId = person?.id ?? null
  const displayName = person?.chineseName || (person ? `${person.firstName} ${person.lastName}` : '')
  const uid = person?.uid || (person ? String(person.id) : null)

  const { data: family } = useQuery({
    queryKey: ['my-family', personId],
    queryFn: myApi.family,
    staleTime: 60_000,
  })

  const me = family?.members.find(m => m.isMe)
  const meals = me?.meals ?? {}

  return (
    <div className="max-w-sm mx-auto px-4 py-6 flex flex-col items-center gap-5">

      {/* QR code card */}
      <div className="w-full rounded-3xl p-6 flex flex-col items-center gap-4 border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--text-dim)' }}>
          <QrCode size={14} />
          入場 QR · Check-in Code
        </div>

        {uid ? (
          <div className="p-3 bg-white rounded-2xl">
            <QRCode value={uid} size={220} />
          </div>
        ) : (
          <div className="w-[220px] h-[220px] rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--surface2)' }}>
            <span className="text-sm text-center px-4" style={{ color: 'var(--text-dim)' }}>尚未分配 QR 碼</span>
          </div>
        )}

        <div className="text-center">
          <p className="text-lg font-black" style={{ color: 'var(--text)' }}>{displayName}</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>出示此碼給工作人員掃描 · Show to staff</p>
        </div>
      </div>

      {/* Meal plan card */}
      <div className="w-full rounded-3xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase mb-4" style={{ color: 'var(--text-dim)' }}>
          <Utensils size={13} />
          餐食計劃 · Meal Plan
        </div>

        {Object.keys(meals).length === 0 ? (
          <p className="text-sm text-center py-2" style={{ color: 'var(--text-dim)' }}>無餐食資料 No meal data</p>
        ) : (
          <div className="space-y-5">
            {Object.entries(meals)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([day, mealDay]) => (
                <div key={day}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-dim)' }}>
                    第 {day} 天 · Day {day}
                  </p>
                  <div className="space-y-1.5">
                    {MEAL_LABELS.map(({ key, zh, emoji }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm" style={{ color: 'var(--text-mid)' }}>{emoji} {zh}</span>
                        <MealPill value={mealDay[key]} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
