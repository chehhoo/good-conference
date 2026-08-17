import { useQuery } from '@tanstack/react-query'
import QRCode from 'react-qr-code'
import { Loader2, QrCode, Utensils } from 'lucide-react'
import { myApi, type MealStatus } from '../api/client'
import { useAuth } from '../auth-context'

const MEAL_LABELS: { key: keyof Pick<MealStatus, 'breakfast' | 'lunch' | 'dinner'>; zh: string; en: string }[] = [
  { key: 'breakfast', zh: '早餐', en: 'Breakfast' },
  { key: 'lunch',     zh: '午餐', en: 'Lunch'     },
  { key: 'dinner',    zh: '晚餐', en: 'Dinner'    },
]

function MealPill({ scanned }: { scanned: boolean | null }) {
  if (scanned === true)  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">✓ 已領</span>
  if (scanned === false) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">未領</span>
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-400">—</span>
}

export default function MyQR() {
  const { person } = useAuth()
  const personId = person?.id ?? null
  const displayName = person?.chineseName || (person ? `${person.firstName} ${person.lastName}` : '')

  const { data: qrValue, isLoading: qrLoading, isError: qrError } = useQuery({
    queryKey: ['my-qr', personId],
    queryFn: myApi.qr,
    staleTime: Infinity,
  })

  const { data: meals = [] } = useQuery({
    queryKey: ['my-meals', personId],
    queryFn: myApi.meals,
    staleTime: 60_000,
  })

  // Show the highest-numbered day that has any non-null meal data (conference "today")
  const latestDay = meals.reduce<MealStatus | null>((best, m) => {
    const hasData = m.breakfast !== null || m.lunch !== null || m.dinner !== null
    if (!hasData) return best
    if (!best || m.day > best.day) return m
    return best
  }, null)

  return (
    <div className="max-w-sm mx-auto px-4 py-8 flex flex-col items-center gap-6">

      {/* QR code card */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-gray-500 text-sm">
          <QrCode size={16} />
          <span>入場 QR · Check-in Code</span>
        </div>

        {qrLoading && (
          <div className="h-56 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-gray-400" />
          </div>
        )}

        {qrError && (
          <div className="h-56 flex flex-col items-center justify-center gap-2 text-center">
            <QrCode size={48} className="text-gray-300" />
            <p className="text-sm text-red-500">無法載入 QR 碼</p>
            <p className="text-xs text-gray-400">Could not load QR code</p>
          </div>
        )}

        {qrValue && (
          <div className="p-3 bg-white rounded-xl border border-gray-100">
            <QRCode value={qrValue} size={220} />
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
          <span>
            {latestDay ? `第 ${latestDay.day} 天餐食 · Day ${latestDay.day} Meals` : '餐食狀況 · Meal Status'}
          </span>
        </div>

        {meals.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-2">無餐食資料 No meal data</p>
        ) : latestDay ? (
          <div className="space-y-2">
            {MEAL_LABELS.map(({ key, zh, en }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm text-gray-700">{zh} <span className="text-gray-400 text-xs">{en}</span></span>
                <MealPill scanned={latestDay[key]} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">尚無掃描記錄 No scans yet</p>
        )}

        {meals.length > 1 && (
          <details className="mt-4">
            <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
              查看所有天數 All days
            </summary>
            <div className="mt-3 space-y-4">
              {meals.map(m => (
                <div key={m.day}>
                  <p className="text-xs font-semibold text-gray-500 mb-1.5">第 {m.day} 天 · Day {m.day}</p>
                  <div className="space-y-1.5">
                    {MEAL_LABELS.map(({ key, zh, en }) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{zh} <span className="text-gray-400 text-xs">{en}</span></span>
                        <MealPill scanned={m[key]} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

    </div>
  )
}
