import { useQuery } from '@tanstack/react-query'
import { Utensils } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { myApi, scheduleApi, type MealDay, type MealScanRecord, type FamilyMember } from '../api/client'
import { useAuth } from '../auth-context'

const MEAL_SLOTS: { key: keyof MealDay; zh: string; en: string; emoji: string }[] = [
  { key: 'breakfast', zh: '早餐', en: 'Breakfast', emoji: '🌅' },
  { key: 'lunch',     zh: '午餐', en: 'Lunch',     emoji: '☀️' },
  { key: 'dinner',   zh: '晚餐', en: 'Dinner',    emoji: '🌙' },
]

function fmtDayHeader(iso: string, day: number) {
  const date = new Date(iso)
  const dateStr = date.toLocaleDateString('zh-TW', { month: 'numeric', day: 'numeric', weekday: 'short' })
  return `${dateStr} · DAY ${day}`
}

function memberShortName(m: FamilyMember) {
  if (m.chineseName) return m.chineseName
  return m.firstName || `${m.firstName} ${m.lastName}`.trim()
}

function fmtTime(iso: string) {
  return iso.slice(11, 16)
}

// Always show all 3 meal slot columns so attendees can see — for unordered slots
function daySlots(_day: number, _members: FamilyMember[]) {
  return MEAL_SLOTS
}

function MealDot({
  value, scannedAt,
}: {
  value: boolean | null   // null = not offered, false = offered not ordered, true = ordered
  scannedAt: string | null
}) {
  if (value === null) {
    // Not offered by the conference on this day
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px]"
        style={{ color: 'var(--border2)' }}>✕</span>
    )
  }
  if (value === false) {
    // Offered but attendee did not order
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold"
        style={{ background: 'var(--border)', color: 'var(--text-dim)' }}>—</span>
    )
  }
  if (scannedAt) {
    return (
      <span title={`已取 ${fmtTime(scannedAt)}`}
        className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold"
        style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
        ✓
      </span>
    )
  }
  // Ordered, not yet picked up
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold"
      style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>
      ●
    </span>
  )
}

function DayCard({
  day, dateIso, members, scansBySlot,
}: {
  day: number
  dateIso: string | null
  members: FamilyMember[]
  scansBySlot: Map<string, MealScanRecord[]>
}) {
  const slots = daySlots(day, members)


  // Count totals for summary badge
  let totalOrdered = 0
  let totalScanned = 0
  for (const { key } of slots) {
    for (const m of members) {
      if (m.meals?.[String(day)]?.[key] === true) {
        totalOrdered++
        const scans = scansBySlot.get(`${day}:${key}`) ?? []
        if (scans.some(s => s.personId === m.id)) totalScanned++
      }
    }
  }
  const allDone = totalOrdered > 0 && totalScanned === totalOrdered
  const someDone = totalScanned > 0

  return (
    <div className="rounded-3xl border overflow-hidden"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

      {/* Day header */}
      <div className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
          {dateIso ? fmtDayHeader(dateIso, day) : `DAY ${day}`}
        </p>
        <span className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{
            background: allDone ? 'var(--green-dim)' : someDone ? 'var(--gold-dim)' : 'var(--border)',
            color:      allDone ? 'var(--green)'     : someDone ? 'var(--gold)'     : 'var(--text-dim)',
          }}>
          {totalScanned}/{totalOrdered} 已取 Picked up
        </span>
      </div>

      {/* Column headers: meal slots */}
      <div className="px-4 pt-3 pb-1">
        <div className="grid items-center" style={{ gridTemplateColumns: `1fr repeat(${slots.length}, 2.5rem) 2rem` }}>
          <span /> {/* name column */}
          {slots.map(s => (
            <div key={s.key} className="text-center">
              <div className="text-base leading-none">{s.emoji}</div>
              <div className="text-[10px] mt-0.5 font-semibold leading-tight" style={{ color: 'var(--text-dim)' }}>{s.zh}</div>
              <div className="text-[9px] leading-tight" style={{ color: 'var(--text-dim)' }}>{s.en}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-member rows */}
      <div className="px-4 space-y-1">
        {members.map(m => {
          const memberTotal = slots.filter(({ key }) => m.meals?.[String(day)]?.[key] === true).length
          return (
            <div key={m.id} className="grid items-center py-1.5 border-t"
              style={{
                gridTemplateColumns: `1fr repeat(${slots.length}, 2.5rem) 2rem`,
                borderColor: 'var(--border2)',
              }}>
              {/* Name */}
              <div className="flex items-center gap-1.5 min-w-0 pr-2">
                {m.isMe && (
                  <span className="text-[9px] px-1 py-0.5 rounded font-bold shrink-0"
                    style={{ background: 'var(--accent)', color: '#fff' }}>我</span>
                )}
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                    {memberShortName(m)}
                  </div>
                  {m.chineseName && (m.firstName || m.lastName) && (
                    <div className="text-[10px] truncate leading-tight" style={{ color: 'var(--text-dim)' }}>
                      {`${m.firstName ?? ''} ${m.lastName ?? ''}`.trim()}
                    </div>
                  )}
                </div>
              </div>
              {/* Dot per slot */}
              {slots.map(({ key }) => {
                const raw = m.meals?.[String(day)]?.[key]
                const value: boolean | null = raw === undefined ? null : raw
                const scans = scansBySlot.get(`${day}:${key}`) ?? []
                const scan = scans.find(s => s.personId === m.id)
                return (
                  <div key={key} className="flex justify-center">
                    <MealDot value={value} scannedAt={scan?.scannedAt ?? null} />
                  </div>
                )
              })}
              {/* Per-person subtotal */}
              <div className="text-right text-xs font-bold tabular-nums"
                style={{ color: memberTotal > 0 ? 'var(--text-mid)' : 'var(--border2)' }}>
                {memberTotal > 0 ? `×${memberTotal}` : ''}
              </div>
            </div>
          )
        })}
      </div>

      {/* Slot subtotal row — only shown when at least one meal is ordered */}
      {totalOrdered > 0 && (
        <div className="px-4">
          <div className="grid items-center py-1.5 border-t"
            style={{ gridTemplateColumns: `1fr repeat(${slots.length}, 2.5rem) 2rem`, borderColor: 'var(--border)' }}>
            <span className="text-[10px] font-bold" style={{ color: 'var(--text-dim)' }}>小計 Sub</span>
            {slots.map(({ key }) => {
              const count = members.filter(m => m.meals?.[String(day)]?.[key] === true).length
              return (
                <div key={key} className="text-center text-xs font-bold tabular-nums"
                  style={{ color: count > 0 ? 'var(--text-mid)' : 'var(--border2)' }}>
                  {count > 0 ? count : '—'}
                </div>
              )
            })}
            <span />
          </div>
        </div>
      )}

      {/* Family total footer — only shown when at least one meal is ordered */}
      {totalOrdered > 0 && (
        <div className="mx-4 mb-3 pt-2 mt-1 border-t flex items-center justify-between"
          style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs font-bold" style={{ color: 'var(--text-dim)' }}>合計 Total</span>
          <span className="text-sm font-black tabular-nums" style={{ color: 'var(--text)' }}>
            {totalOrdered} 餐
          </span>
        </div>
      )}
      {totalOrdered === 0 && <div className="mb-3" />}
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

  const { data: sessions = [] } = useQuery({
    queryKey: ['schedule', personId],
    queryFn: scheduleApi.getAll,
    staleTime: 5 * 60_000,
  })

  const dayDateMap = new Map<number, string>()
  for (const s of sessions) {
    if (s.day != null && !dayDateMap.has(s.day)) dayDateMap.set(s.day, s.startTime)
  }

  const members = family?.members ?? []

  const scansBySlot = new Map<string, MealScanRecord[]>()
  for (const s of scanRecords) {
    const k = `${s.day}:${s.slot}`
    const arr = scansBySlot.get(k) ?? []
    arr.push(s)
    scansBySlot.set(k, arr)
  }

  // Include all days that appear in any member's meals data so attendees
  // can see their full meal plan, including days/slots where nothing was ordered
  const allDays = [...new Set(
    members.flatMap(m => Object.keys(m.meals ?? {})).map(Number)
  )].sort((a, b) => a - b)

  const totalOrdered = scanRecords.length > 0 ? scanRecords.length : null

  return (
    <div className="max-w-sm mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'var(--gold-dim)' }}>
          <Utensils size={17} style={{ color: 'var(--gold)' }} />
        </div>
        <div>
          <h1 className="text-base font-black" style={{ color: 'var(--text)' }}>家庭餐食</h1>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Family Meal Pickup</p>
        </div>
        {totalOrdered != null && (
          <span className="ml-auto text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
            {totalOrdered} 筆已取
          </span>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-5 px-1 flex-wrap">
        <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-dim)' }}>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full"
            style={{ background: 'var(--gold-dim)', color: 'var(--gold)', fontSize: 10 }}>●</span>
          已訂 Ordered
        </span>
        <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-dim)' }}>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full"
            style={{ background: 'var(--green-dim)', color: 'var(--green)', fontSize: 10 }}>✓</span>
          已取 Picked up
        </span>
        <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-dim)' }}>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold shrink-0"
            style={{ background: 'var(--border)', color: 'var(--text-dim)' }}>—</span>
          未訂 Not ordered
        </span>
        <span className="flex items-center gap-1 text-[11px]" style={{ color: 'var(--text-dim)' }}>
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px]"
            style={{ color: 'var(--border2)' }}>✕</span>
          不供應 N/A
        </span>
        <span className="w-full text-[11px]" style={{ color: 'var(--text-dim)' }}>
          一人可代取全家 · Any family member may pick up for the whole family
        </span>
      </div>

      {allDays.length === 0 ? (
        <div className="text-center py-16 px-4">
          <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>未訂餐 No meals ordered</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
            如需用餐，請洽報到處工作人員。<br />
            To add meals, please ask at the registration desk.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {allDays.map(day => (
            <DayCard key={day} day={day} dateIso={dayDateMap.get(day) ?? null} members={members} scansBySlot={scansBySlot} />
          ))}
        </div>
      )}
    </div>
  )
}
