import { useQuery } from '@tanstack/react-query'
import { Utensils } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { myApi, type MealDay, type MealScanRecord, type FamilyMember } from '../api/client'
import { useAuth } from '../auth-context'

const MEAL_SLOTS: { key: keyof MealDay; zh: string; en: string; emoji: string }[] = [
  { key: 'breakfast', zh: '早餐', en: 'Breakfast', emoji: '🌅' },
  { key: 'lunch',     zh: '午餐', en: 'Lunch',     emoji: '☀️' },
  { key: 'dinner',   zh: '晚餐', en: 'Dinner',    emoji: '🌙' },
]

function fmtTime(iso: string) {
  return iso.slice(11, 16)
}

function memberDisplayName(m: FamilyMember) {
  const eng = `${m.firstName} ${m.lastName}`.trim()
  if (m.chineseName && eng) return `${m.chineseName} ${eng}`
  return m.chineseName || eng
}

function FamilyMealSlot({
  emoji, zh, en, entitled, scans,
}: {
  emoji: string
  zh: string
  en: string
  entitled: FamilyMember[]
  scans: MealScanRecord[]
}) {
  if (entitled.length === 0) return null

  const taken = [...scans]
    .sort((a, b) => a.scannedAt.localeCompare(b.scannedAt))
    .map(s => ({ scan: s, member: entitled.find(m => m.id === s.personId) }))
    .filter(r => r.member)

  const allTaken = taken.length === entitled.length

  return (
    <div className="flex items-start gap-3 py-3 border-b last:border-0" style={{ borderColor: 'var(--border2)' }}>
      <span className="text-base w-6 shrink-0 mt-0.5">{emoji}</span>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          {zh}{' '}
          <span className="font-normal text-xs" style={{ color: 'var(--text-dim)' }}>{en}</span>
        </span>
        {taken.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {taken.map(({ scan, member }) => (
              <div key={scan.personId} className="flex items-center gap-1.5 text-xs">
                <span className="font-semibold" style={{ color: 'var(--green)' }}>
                  {memberDisplayName(member!)}
                </span>
                <span style={{ color: 'var(--text-dim)' }}>· {fmtTime(scan.scannedAt)}</span>
              </div>
            ))}
          </div>
        )}
        {taken.length === 0 && (
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>尚未取餐 Not picked up</p>
        )}
      </div>
      <span
        className="text-xs font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5"
        style={{
          background: allTaken ? 'var(--green-dim)' : taken.length > 0 ? 'var(--gold-dim)' : 'var(--border)',
          color:      allTaken ? 'var(--green)'     : taken.length > 0 ? 'var(--gold)'     : 'var(--text-dim)',
        }}
      >
        {taken.length}/{entitled.length}
      </span>
    </div>
  )
}

export default function Meals() {
  usePageTitle('餐食狀態', 'Meal Status')
  const { person } = useAuth()
  const personId = person?.id ?? null

  const { data: family } = useQuery({
    queryKey: ['my-family', personId],
    queryFn: myApi.family,
    staleTime: 60_000,
  })

  const { data: scanRecords = [] } = useQuery({
    queryKey: ['my-meal-scans', personId],
    queryFn: myApi.mealScans,
    staleTime: 30_000,
    retry: false,
  })

  const members = family?.members ?? []

  const scansBySlot = new Map<string, MealScanRecord[]>()
  for (const s of scanRecords) {
    const k = `${s.day}:${s.slot}`
    const arr = scansBySlot.get(k) ?? []
    arr.push(s)
    scansBySlot.set(k, arr)
  }

  const allDays = [...new Set(
    members.flatMap(m => Object.keys(m.meals ?? {})).map(Number)
  )].sort((a, b) => a - b)

  return (
    <div className="max-w-sm mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--gold-dim)' }}>
          <Utensils size={17} style={{ color: 'var(--gold)' }} />
        </div>
        <div>
          <h1 className="text-base font-black" style={{ color: 'var(--text)' }}>家庭餐食</h1>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Family Meal Pickup</p>
        </div>
        {scanRecords.length > 0 && (
          <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
            {scanRecords.length} 筆已取
          </span>
        )}
      </div>

      {allDays.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm" style={{ color: 'var(--text-dim)' }}>無餐食資料 No meal data</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allDays.map(day => (
            <div key={day} className="rounded-3xl p-4 border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: 'var(--text-dim)' }}>
                第 {day} 天 · Day {day}
              </p>
              {MEAL_SLOTS.map(({ key, zh, en, emoji }) => {
                const entitled = members.filter(m => m.meals?.[String(day)]?.[key] === true)
                const scans = scansBySlot.get(`${day}:${key}`) ?? []
                return (
                  <FamilyMealSlot
                    key={key}
                    emoji={emoji}
                    zh={zh}
                    en={en}
                    entitled={entitled}
                    scans={scans}
                  />
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
