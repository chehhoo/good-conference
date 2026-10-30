import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Loader2, User, LogIn, ChevronDown, ChevronUp,
  BedDouble, Bus, Home, QrCode, CalendarCheck,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePageTitle } from '../hooks/usePageTitle'
import { myApi, scheduleApi, conferenceApi, type FamilyMember, type MealDay, type CampSession } from '../api/client'
import { useAuth } from '../auth-context'
import { useLang } from '../lang-context'
import { InstallSettingsCard } from '../components/InstallBanner'

// ── Constants ──────────────────────────────────────────────────────────────────

const MEAL_KEYS: (keyof MealDay)[] = ['breakfast', 'lunch', 'dinner']
const MEAL_ICONS = ['🌅', '☀️', '🌙']
const MEAL_LABELS_ZH = ['早', '午', '晚'] as const
const MEAL_LABELS_EN = ['B', 'L', 'D'] as const

// Rough thresholds for "next meal" detection (hour of day)
const MEAL_THRESHOLDS = [10, 14, 21] // after these hours the slot is "past"

const LODGING_STATUS: Record<string, { zh: string; en: string; color: string; bg: string; Icon: React.ElementType }> = {
  STAY:          { zh: '住宿', en: 'Staying',       color: '#63B3ED', bg: 'rgba(99,179,237,0.15)', Icon: BedDouble },
  COMMUTE:       { zh: '通勤', en: 'Commuting',     color: 'var(--gold)', bg: 'var(--gold-dim)',   Icon: Bus },
  SELF_ARRANGED: { zh: '自行安排', en: 'Self-arranged', color: 'var(--text-dim)', bg: 'var(--border)', Icon: Home },
}

const AGE_LABELS_ZH: Record<string, string> = { AD: '成人', YA: '青年', JR: '少年', CH: '兒童', IN: '嬰幼兒' }
const AGE_LABELS_EN: Record<string, string> = { AD: 'Adult', YA: 'Young Adult', JR: 'Junior', CH: 'Child', IN: 'Infant' }
const GENDER_LABELS_ZH: Record<string, string> = { M: '男', F: '女', C: '兒' }
const GENDER_LABELS_EN: Record<string, string> = { M: 'Male', F: 'Female', C: 'Child' }

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Build a map of conference day number → calendar date string (YYYY-MM-DD) from sessions */
function buildDayDateMap(sessions: CampSession[]): Map<number, string> {
  const m = new Map<number, string>()
  for (const s of sessions) {
    if (s.day != null && !m.has(s.day)) {
      m.set(s.day, s.startTime.slice(0, 10))
    }
  }
  return m
}

/**
 * Given meal data + day→date map, return the next upcoming meal as
 * { day, slot, icon, labelZh, labelEn } or null if nothing upcoming.
 */
function nextUpcomingMeal(
  meals: FamilyMember['meals'],
  dayDateMap: Map<number, string>,
): { day: number; slot: keyof MealDay; icon: string; zh: string; en: string } | null {
  if (!meals) return null
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)
  const hour = now.getHours()

  const candidates: { day: number; slotIdx: number; dateStr: string }[] = []
  for (const [dayStr, row] of Object.entries(meals)) {
    const day = Number(dayStr)
    const dateStr = dayDateMap.get(day) ?? null
    if (!dateStr) continue
    MEAL_KEYS.forEach((k, i) => {
      if (row[k] !== true) return
      // A slot is "upcoming" if: future date, OR today and hour < threshold
      if (dateStr > todayStr || (dateStr === todayStr && hour < MEAL_THRESHOLDS[i])) {
        candidates.push({ day, slotIdx: i, dateStr })
      }
    })
  }
  if (candidates.length === 0) return null
  candidates.sort((a, b) => a.dateStr.localeCompare(b.dateStr) || a.slotIdx - b.slotIdx)
  const { day, slotIdx } = candidates[0]
  return {
    day, slot: MEAL_KEYS[slotIdx],
    icon: MEAL_ICONS[slotIdx],
    zh: MEAL_LABELS_ZH[slotIdx],
    en: MEAL_LABELS_EN[slotIdx],
  }
}

// ── Meal pills row ─────────────────────────────────────────────────────────────

function formatDayLabel(dayNum: string, dayDateMap: Map<number, string>, lang: string): string {
  const dateStr = dayDateMap.get(Number(dayNum))
  if (!dateStr) return lang === 'zh' ? `第${dayNum}天` : `Day ${dayNum}`
  const d = new Date(dateStr + 'T00:00:00')
  const locale = lang === 'zh' ? 'zh-TW' : 'en-US'
  return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) // e.g. "11月27日" / "Nov 27"
}

function MealPills({ meals, dayDateMap }: { meals: FamilyMember['meals']; dayDateMap: Map<number, string> }) {
  const { t, lang } = useLang()
  if (!meals) return <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{t('無膳食資料', 'No meal data')}</p>
  const days = Object.keys(meals).sort()
  const hasAny = days.some(d => MEAL_KEYS.some(k => meals[d][k] === true))
  if (!hasAny) return <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{t('無膳食安排', 'No meals ordered')}</p>

  return (
    <div className="space-y-1">
      {days.map(d => {
        const row = meals[d]
        const slots = MEAL_KEYS.map((k, i) => ({ key: k, icon: MEAL_ICONS[i], zh: MEAL_LABELS_ZH[i], en: MEAL_LABELS_EN[i], has: row[k] === true }))
        if (slots.every(s => !s.has)) return null
        const label = formatDayLabel(d, dayDateMap, lang)
        return (
          <div key={d} className="flex items-center gap-2">
            <span className="text-[11px] w-12 shrink-0" style={{ color: 'var(--text-dim)' }}>
              {label}
            </span>
            <div className="flex gap-1">
              {slots.map(s => s.has && (
                <span
                  key={s.key}
                  className="text-[11px] px-1.5 py-0.5 rounded font-semibold"
                  style={{ background: 'var(--green-dim)', color: 'var(--green)' }}
                >
                  {s.icon} {t(s.zh, s.en)}
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Lodging pill ───────────────────────────────────────────────────────────────

function LodgingPill({ lodging }: { lodging: FamilyMember['lodging'] }) {
  const { t } = useLang()
  if (!lodging?.status) return null
  const cfg = LODGING_STATUS[lodging.status]
  if (!cfg) return null
  const { Icon } = cfg
  const rooms = Object.entries(lodging.nights).filter(([, room]) => room != null)
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold"
        style={{ background: cfg.bg, color: cfg.color }}>
        <Icon size={11} />
        {t(cfg.zh, cfg.en)}
      </span>
      {rooms.map(([night, room]) => (
        <span key={night} className="text-xs px-2 py-0.5 rounded border"
          style={{ borderColor: 'var(--border)', color: 'var(--text-mid)' }}>
          {t(`夜${night}`, `Night ${night}`)}: {room}
        </span>
      ))}
      {rooms.length === 0 && lodging.status === 'STAY' && (
        <span className="text-xs" style={{ color: 'var(--text-dim)' }}>{t('房間待分配', 'Room TBD')}</span>
      )}
    </div>
  )
}

// ── Hero card (me) ─────────────────────────────────────────────────────────────

function HeroCard({
  member, uid, registrationCode, email, sessionCount, dayDateMap, navigate,
}: {
  member: FamilyMember
  uid: string | null
  registrationCode: number | null
  email: string | null
  sessionCount: number | null
  dayDateMap: Map<number, string>
  navigate: (path: string) => void
}) {
  const { t } = useLang()
  const displayName = member.chineseName || `${member.firstName} ${member.lastName}`
  const engName = member.chineseName ? `${member.firstName} ${member.lastName}` : null
  const churchName = member.church
    ? (member.church.nameChn ?? member.church.nameEng ?? null)
    : null
  const next = nextUpcomingMeal(member.meals, dayDateMap)

  return (
    <div className="rounded-2xl overflow-hidden border-2" style={{ borderColor: 'var(--accent)', background: 'var(--surface)' }}>
      {/* Accent band */}
      <div className="h-1.5" style={{ background: 'var(--accent)' }} />

      <div className="p-4 space-y-4">
        {/* Identity */}
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent-dim)' }}>
            <User size={22} style={{ color: 'var(--accent)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black leading-tight" style={{ color: 'var(--text)' }}>{displayName}</h2>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: 'var(--accent)', color: '#fff' }}>{t('我', 'Me')}</span>
            </div>
            {engName && <p className="text-sm" style={{ color: 'var(--text-dim)' }}>{engName}</p>}
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              {member.gender && (
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {t(GENDER_LABELS_ZH[member.gender] ?? member.gender, GENDER_LABELS_EN[member.gender] ?? member.gender)}
                </span>
              )}
              {member.ageCode && (
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  · {t(AGE_LABELS_ZH[member.ageCode] ?? member.ageCode, AGE_LABELS_EN[member.ageCode] ?? member.ageCode)}
                </span>
              )}
              {member.programName && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>
                  {t(member.programName, member.programNameEng ?? member.programName)}
                </span>
              )}
            </div>
            {/* Church, badge ID, email */}
            <div className="flex flex-col gap-1 mt-1.5">
              {(churchName || uid) && (
                <div className="flex items-center gap-3 flex-wrap">
                  {churchName && (
                    <span className="text-xs" style={{ color: 'var(--text-dim)' }}>⛪ {churchName}</span>
                  )}
                  {uid && (
                    <span className="text-xs font-mono" style={{ color: 'var(--text-dim)' }}>#{uid}</span>
                  )}
                </div>
              )}
              {email && (
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>✉️ {email}</span>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => navigate('/my-qr')}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-opacity active:opacity-70"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <QrCode size={16} />
            {t('我的證件', 'My Badge')}
          </button>
          <button
            onClick={() => navigate('/my-schedule')}
            className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-opacity active:opacity-70"
            style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            <CalendarCheck size={16} />
            {sessionCount != null
              ? t(`${sessionCount} 場`, `${sessionCount} sessions`)
              : t('我的行程', 'My Schedule')}
          </button>
        </div>

        {/* Registration code + login tip */}
        {registrationCode && (
          <div className="rounded-xl px-3 py-2.5 space-y-1" style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
              {t('報名編號', 'Registration Code')}
            </p>
            <p className="text-2xl font-black tracking-widest font-mono" style={{ color: 'var(--text)' }}>
              {registrationCode}
            </p>
            <p className="text-[11px] leading-snug" style={{ color: 'var(--text-dim)' }}>
              {t(
                '家庭成員可用此編號 + 英文名字（First Name）登入 app',
                'Family members can sign in with this code + their English first name',
              )}
            </p>
          </div>
        )}

        {/* Next meal callout */}
        {next && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            <span className="text-lg leading-none">{next.icon}</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
                {t('下一餐', 'Next Meal')}
              </p>
              <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {t(`第${next.day}天${next.zh === '早' ? '早餐' : next.zh === '午' ? '午餐' : '晚餐'}`,
                   `Day ${next.day} ${next.slot === 'breakfast' ? 'Breakfast' : next.slot === 'lunch' ? 'Lunch' : 'Dinner'}`)}
              </p>
            </div>
          </div>
        )}

        {/* Meals */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
            {t('膳食安排', 'Meals')}
          </p>
          <MealPills meals={member.meals} dayDateMap={dayDateMap} />
        </div>

        {/* Lodging */}
        {member.lodging?.status && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
              {t('住宿', 'Lodging')}
            </p>
            <LodgingPill lodging={member.lodging} />
          </div>
        )}
      </div>
    </div>
  )
}

// ── Family member row (compact, expandable) ────────────────────────────────────

function FamilyRow({ member, onSwitch, switching, canSwitch, dayDateMap }: {
  member: FamilyMember
  onSwitch?: (id: number) => void
  switching?: boolean
  canSwitch?: boolean
  dayDateMap: Map<number, string>
}) {
  const { t } = useLang()
  const [expanded, setExpanded] = useState(false)
  const displayName = member.chineseName || `${member.firstName} ${member.lastName}`
  const engName = member.chineseName ? `${member.firstName} ${member.lastName}` : null
  const hasMeals = !!member.meals && Object.values(member.meals).some(d => MEAL_KEYS.some(k => d[k] === true))
  const hasExtra = hasMeals || !!member.lodging?.status

  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--surface2)' }}>
          <User size={14} style={{ color: 'var(--text-dim)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{displayName}</span>
            {member.programName && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>
                {t(member.programName, member.programNameEng ?? member.programName)}
              </span>
            )}
          </div>
          {engName && <p className="text-xs" style={{ color: 'var(--text-dim)' }}>{engName}</p>}
          <div className="flex items-center gap-1.5 mt-0.5">
            {member.gender && <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>{t(GENDER_LABELS_ZH[member.gender] ?? member.gender, GENDER_LABELS_EN[member.gender] ?? member.gender)}</span>}
            {member.ageCode && <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>· {t(AGE_LABELS_ZH[member.ageCode] ?? member.ageCode, AGE_LABELS_EN[member.ageCode] ?? member.ageCode)}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canSwitch && onSwitch && (
            <button
              disabled={switching}
              onClick={() => onSwitch(member.id)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-opacity disabled:opacity-50"
              style={{ background: 'var(--surface2)', color: 'var(--text-mid)', border: '1px solid var(--border)' }}
            >
              {switching ? <Loader2 size={11} className="animate-spin" /> : <LogIn size={11} />}
              {t('切換', 'Switch')}
            </button>
          )}
          {hasExtra && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="p-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-dim)' }}
              aria-label={expanded ? t('收起', 'Collapse') : t('展開', 'Expand')}
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-3 pt-1 space-y-3 border-t" style={{ borderColor: 'var(--border)' }}>
          {hasMeals && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
                {t('膳食安排', 'Meals')}
              </p>
              <MealPills meals={member.meals} dayDateMap={dayDateMap} />
            </div>
          )}
          {member.lodging?.status && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-dim)' }}>
                {t('住宿', 'Lodging')}
              </p>
              <LodgingPill lodging={member.lodging} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MyInfo() {
  usePageTitle('我的資訊', 'My Info')
  const { person, token, login } = useAuth()
  const { t } = useLang()
  const personId = person?.id ?? null
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['my-family', personId],
    queryFn: myApi.family,
    staleTime: 60_000,
    enabled: !!token,
  })

  const { data: signups } = useQuery({
    queryKey: ['my-signups', personId],
    queryFn: myApi.mySignups,
    staleTime: 60_000,
    enabled: !!token,
  })

  // Full schedule gives us day→date even when the user has 0 signups
  const { data: allSessions } = useQuery({
    queryKey: ['schedule-all'],
    queryFn: scheduleApi.getAll,
    staleTime: 5 * 60_000,
    enabled: !!token,
  })

  const dayDateMap = buildDayDateMap(allSessions ?? signups ?? [])
  const sessionCount = signups?.filter(s => s.signedUp).length ?? null

  const switchMutation = useMutation({
    mutationFn: (id: number) => conferenceApi.switchMember(id),
    onSuccess: ({ token: newToken, person: newPerson }) => {
      login(newToken, newPerson)
      qc.clear()
      navigate('/', { replace: true })
    },
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
        <p>{t('無法載入資料', 'Unable to load info')}</p>
      </div>
    )
  }

  const me = data.members.find(m => m.isMe)
  const family = data.members.filter(m => !m.isMe)
  const uid = person?.uid ?? String(person?.id ?? '')

  return (
    <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">
      {me && (
        <HeroCard
          member={me}
          uid={uid}
          registrationCode={data.registrationCode}
          email={data.email}
          sessionCount={sessionCount}
          dayDateMap={dayDateMap}
          navigate={navigate}
        />
      )}

      {family.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest px-1" style={{ color: 'var(--text-dim)' }}>
            {t('家庭成員', 'Family Members')}
          </p>
          {family.map(m => (
            <FamilyRow
              key={m.id}
              member={m}
              onSwitch={id => switchMutation.mutate(id)}
              switching={switchMutation.isPending && switchMutation.variables === m.id}
              canSwitch={person?.canSwitch ?? false}
              dayDateMap={dayDateMap}
            />
          ))}
        </div>
      )}

      <InstallSettingsCard />
      {/* SmsOptIn hidden — AWS SMS support request pending; restore here with Settings label when approved */}

      <p className="text-center text-[10px] pb-1" style={{ color: 'var(--text-dim)' }}>v{__APP_VERSION__}</p>
    </div>
  )
}
