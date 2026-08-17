import { useQuery } from '@tanstack/react-query'
import QRCode from 'react-qr-code'
import { QrCode, Utensils } from 'lucide-react'
import { myApi, type MealDay } from '../api/client'
import { useAuth } from '../auth-context'

const MEAL_LABELS: { key: keyof MealDay; zh: string; en: string }[] = [
  { key: 'breakfast', zh: '早餐', en: 'Breakfast' },
  { key: 'lunch',     zh: '午餐', en: 'Lunch'     },
  { key: 'dinner',    zh: '晚餐', en: 'Dinner'    },
]

function MealPill({ value }: { value: boolean | null }) {
  if (value === true)  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">✓ 有</span>
  if (value === false) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">無</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-400">—</span>
}

export default function MyQR() {
  const { person } = useAuth()
  const personId = person?.id ?? null
  const displayName = person?.chineseName || (person ? `${person.firstName} ${person.lastName}` : '')
  // Match good-scan's fallback: use uid if set, otherwise person id string
  const uid = person?.uid || (person ? String(person.id) : null)

  const { data: family } = useQuery({
    queryKey: ['my-family', personId],
    queryFn: myApi.family,
    staleTime: 60_000,
  })

  // Find "me" in the family response and extract meal plan
  const me = family?.members.find(m => m.isMe)
  const meals = me?.meals ?? {}

  return (
    <div className="max-w-sm mx-auto px-4 py-8 flex flex-col items-center gap-6">

      {/* QR code card */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <QrCode size={16} />
          <span>入場 QR · Check-in Code</span>
        </div>

        {uid && (
          <div className="p-3 bg-white rounded-xl border border-gray-100">
            <QRCode value={uid} size={220} />
          </div>
        )}

        <div className="text-center">
          <p className="text-lg font-bold text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-400 mt-0.5">出示此碼給工作人員掃描 · Show to staff</p>
        </div>
      </div>

      {/* Meal status card */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
          <Utensils size={15} />
          <span>餐食計劃 · Meal Plan</span>
        </div>

        {Object.keys(meals).length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-2">無餐食資料 No meal data</p>
        ) : (
          <div className="space-y-4">
            {Object.entries(meals)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([day, mealDay]) => (
                <div key={day}>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">第 {day} 天 · Day {day}</p>
                  <div className="space-y-1.5">
                    {MEAL_LABELS.map(({ key, zh, en }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{zh} <span className="text-gray-400 text-xs">{en}</span></span>
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
