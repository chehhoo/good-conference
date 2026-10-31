import { useState, useCallback, useEffect } from 'react'
import { usePageTitle } from '../hooks/usePageTitle'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, MapPin, Maximize2, ChevronRight } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { scheduleApi, myApi, type CampSession, type MealDay, type MealScanRecord } from '../api/client'
import { useAuth } from '../auth-context'
import { useLang } from '../lang-context'
import BadgeOverlay from '../components/BadgeOverlay'
import { InstallBanner } from '../components/InstallBanner'
import SpeakerSheet from '../components/SpeakerSheet'

const MEAL_SLOTS: { key: keyof MealDay; zh: string; en: string; icon: string }[] = [
  { key: 'breakfast', zh: '早餐', en: 'Breakfast', icon: '🌅' },
  { key: 'lunch',     zh: '午餐', en: 'Lunch',     icon: '☀️' },
  { key: 'dinner',    zh: '晚餐', en: 'Dinner',    icon: '🌙' },
]

const TYPE_LABELS_ZH: Record<string, string> = {
  PLENARY:  '全體大會',
  WORSHIP:  '敬拜',
  WORKSHOP: '工作坊',
  GENERAL:  '分組',
  OTHER:    '其他',
}
const TYPE_LABELS_EN: Record<string, string> = {
  PLENARY:  'Plenary',
  WORSHIP:  'Worship',
  WORKSHOP: 'Workshop',
  GENERAL:  'Session',
  OTHER:    'Other',
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
function todayDay(sessions: CampSession[]): number | null {
  const today = new Date().toDateString()
  const match = sessions.find(s => new Date(s.startTime).toDateString() === today)
  return match?.day ?? null
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' })
}
function todayFull() {
  return new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
}

export default function Dashboard() {
  usePageTitle('今日總覽', 'Dashboard')
  const { person } = useAuth()
  const { t, primary, secondary } = useLang()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const personId = person?.id ?? null
  const displayName = person?.chineseName || (person ? `${person.firstName} ${person.lastName}` : '')
  const engName = person?.chineseName ? `${person.firstName} ${person.lastName}` : ''
  const uid = person?.uid || (person ? String(person.id) : null)
  const [badgeOpen, setBadgeOpen] = useState(false)
  const [nextSpeakerOpen, setNextSpeakerOpen] = useState(false)
  const openBadge = useCallback(() => setBadgeOpen(true), [])
  const closeBadge = useCallback(() => setBadgeOpen(false), [])

  const { data: sessions = [], isLoading: sessLoading } = useQuery<CampSession[]>({
    queryKey: ['schedule', personId],
    queryFn: scheduleApi.getAll,
  })
  const { data: family } = useQuery({
    queryKey: ['my-family', personId],
    queryFn: myApi.family,
    staleTime: 60_000,
  })
  const { data: scanRecords = [] } = useQuery<MealScanRecord[]>({
    queryKey: ['my-meal-scans', personId],
    queryFn: myApi.mealScans,
    staleTime: 30_000,
    retry: false,
  })

  const [pendingId, setPendingId] = useState<number | null>(null)
  const signup = useMutation({
    mutationFn: (id: number) => scheduleApi.signup(id),
    onMutate: (id) => setPendingId(id),
    onSettled: () => { setPendingId(null); qc.invalidateQueries({ queryKey: ['schedule', personId] }) },
  })
  const unsignup = useMutation({
    mutationFn: (id: number) => scheduleApi.unsignup(id),
    onMutate: (id) => setPendingId(id),
    onSettled: () => { setPendingId(null); qc.invalidateQueries({ queryKey: ['schedule', personId] }) },
  })

  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000)
    return () => clearInterval(id)
  }, [])

  const todayDayNum = todayDay(sessions)
  const todaySessions = todayDayNum != null
    ? sessions.filter(s => s.day === todayDayNum)
    : sessions.filter(s => s.day === Math.min(...sessions.map(s => s.day ?? 999).filter(d => d < 999)))

  const me = family?.members.find(m => m.isMe)

  const dayDateMap = new Map<number, string>()
  for (const s of sessions) {
    if (s.day != null && !dayDateMap.has(s.day)) dayDateMap.set(s.day, s.startTime)
  }

  // Live session: signed-up, currently in progress
  const liveSession = sessions.find(s =>
    s.signedUp &&
    new Date(s.startTime).getTime() <= now &&
    new Date(s.endTime).getTime() > now
  ) ?? null

  // Next session: first signed-up session starting in the future
  const nextSession = sessions
    .filter(s => s.signedUp && new Date(s.startTime).getTime() > now)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0] ?? null

  function minsUntil(iso: string) {
    return Math.max(0, Math.round((new Date(iso).getTime() - now) / 60000))
  }
  function untilLabel(iso: string) {
    const mins = minsUntil(iso)
    if (mins < 60) return t(`${mins} 分鐘後`, `${mins}m away`)
    if (mins < 24 * 60) return `${Math.floor(mins / 60)}h ${mins % 60}m`
    return t(`${Math.floor(mins / (24 * 60))} 天後`, `${Math.floor(mins / (24 * 60))}d away`)
  }
  function progressPct(startIso: string, endIso: string) {
    const start = new Date(startIso).getTime()
    const end = new Date(endIso).getTime()
    return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)))
  }

  // Today's meals (me only, today's day)
  const todayMeals = todayDayNum != null && me?.meals ? me.meals[String(todayDayNum)] ?? null : null

  // Conference starts in X days (pre-conference)
  const firstSessionTime = sessions.length > 0
    ? Math.min(...sessions.map(s => new Date(s.startTime).getTime()))
    : null
  const daysToConference = firstSessionTime != null && firstSessionTime > now
    ? Math.ceil((firstSessionTime - now) / (24 * 60 * 60 * 1000))
    : null

  return (
    <>
      {badgeOpen && uid && <BadgeOverlay uid={uid} displayName={displayName} onClose={closeBadge} />}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">

        {/* ── Badge card ── */}
        <div
          className="rounded-3xl p-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #C8341A 0%, #16264A 55%, #0B1629 100%)' }}
        >
          <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full pointer-events-none"
            style={{ background: 'rgba(239,160,32,0.1)' }} />
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(236,241,255,0.5)' }}>
              {person?.programName ? `${person.programName} · ATTENDEE` : 'ATTENDEE · 大會學員'}
            </div>
            <div className="text-right">
              {todayDayNum != null && (
                <div className="text-lg font-black tracking-wide leading-none mb-1" style={{ color: 'rgba(239,160,32,1)' }}>
                  {t(`第 ${todayDayNum} 天`, `Day ${todayDayNum}`)}
                </div>
              )}
              <div className="text-sm font-semibold" style={{ color: 'rgba(236,241,255,0.7)' }}>
                {todayFull()}
              </div>
            </div>
          </div>
          <div className="text-5xl font-black tracking-tight leading-none mb-1 text-white" style={{ textWrap: 'balance' }}>
            {displayName}
          </div>
          {engName && <div className="text-sm mb-0.5" style={{ color: 'rgba(236,241,255,0.6)' }}>{engName}</div>}
          {me?.church && (
            <div className="text-xs mb-4 font-medium" style={{ color: 'rgba(236,241,255,0.45)' }}>
              {me.church.nameChn ?? me.church.nameEng}
              {me.church.nameChn && me.church.nameEng && ` · ${me.church.nameEng}`}
            </div>
          )}
          {!me?.church && <div className="mb-4" />}
          {uid && (
            <button
              onClick={openBadge}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white w-full justify-center"
              style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.22)' }}
            >
              <Maximize2 size={14} />
              顯示大碼 · Show Full Badge
            </button>
          )}
        </div>

        {/* ── Install banner ── */}
        <InstallBanner />

        {/* ── LIVE NOW hero ── */}
        {liveSession && (
          <div className="rounded-3xl overflow-hidden border"
            style={{ background: 'var(--surface)', borderColor: 'var(--accent)', boxShadow: '0 0 0 1px var(--accent)' }}>
            {/* Progress bar */}
            <div className="h-1 w-full" style={{ background: 'var(--border)' }}>
              <div className="h-1 transition-all duration-1000" style={{
                width: `${progressPct(liveSession.startTime, liveSession.endTime)}%`,
                background: 'var(--accent)',
              }} />
            </div>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase px-2 py-0.5 rounded-full"
                  style={{ background: 'var(--accent)', color: '#fff' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
                  {t('正在進行', 'LIVE NOW')}
                </span>
                <span className="ml-auto text-xs font-bold tabular-nums" style={{ color: 'var(--text-dim)' }}>
                  {fmt(liveSession.startTime)} – {fmt(liveSession.endTime)}
                </span>
              </div>
              <div className="font-black leading-tight mb-1" style={{ color: 'var(--text)', fontSize: 18 }}>
                {primary(liveSession.title, liveSession.titleEng)}
              </div>
              {secondary(liveSession.title, liveSession.titleEng) && (
                <div className="text-sm mb-1" style={{ color: 'var(--text-dim)' }}>
                  {secondary(liveSession.title, liveSession.titleEng)}
                </div>
              )}
              {(liveSession.speaker || liveSession.speakerEng) && (
                <div className="text-sm mb-1" style={{ color: 'var(--text-mid)' }}>
                  {primary(liveSession.speaker, liveSession.speakerEng)}
                </div>
              )}
              {liveSession.location && (
                <Link
                  to={`/map?room=${encodeURIComponent(liveSession.location)}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold mt-0.5"
                  style={{ color: 'var(--accent)' }}
                >
                  <MapPin size={12} />{liveSession.location} →
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ── Next Up hero ── */}
        {!liveSession && nextSession && (() => {
          const mins = minsUntil(nextSession.startTime)
          const isSoon = mins <= 10
          return (
          <div className="rounded-3xl overflow-hidden border" style={{
            background: isSoon
              ? 'color-mix(in srgb, var(--gold) 8%, var(--surface))'
              : 'var(--surface)',
            borderColor: isSoon ? 'var(--gold)' : 'var(--border)',
            boxShadow: isSoon ? '0 0 0 1px var(--gold)' : 'none',
          }}>
            {/* Urgency bar when starting soon */}
            {isSoon && (
              <div className="h-1 w-full" style={{ background: 'var(--border)' }}>
                <div className="h-1 animate-pulse" style={{ width: '100%', background: 'var(--gold)' }} />
              </div>
            )}
            <div className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase"
                style={{ color: isSoon ? 'var(--gold)' : 'var(--text-dim)' }}>
                {isSoon && <span className="w-1.5 h-1.5 rounded-full inline-block animate-pulse" style={{ background: 'var(--gold)' }} />}
                {t('下一場', 'Next Up')}
              </span>
              <span className="ml-auto text-xs font-bold px-2.5 py-0.5 rounded-full"
                style={{
                  background: isSoon ? 'var(--gold)' : 'var(--gold-dim)',
                  color: isSoon ? '#000' : 'var(--gold)',
                }}>
                {isSoon
                  ? t(`${mins} 分鐘後開始！`, `Starting in ${mins}m!`)
                  : untilLabel(nextSession.startTime)}
              </span>
            </div>
            <div className="font-black leading-tight mb-1" style={{ color: 'var(--text)', fontSize: 18 }}>
              {primary(nextSession.title, nextSession.titleEng)}
            </div>
            {secondary(nextSession.title, nextSession.titleEng) && (
              <div className="text-sm mb-1" style={{ color: 'var(--text-dim)' }}>
                {secondary(nextSession.title, nextSession.titleEng)}
              </div>
            )}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
                {fmtDate(nextSession.startTime)} · {fmt(nextSession.startTime)} – {fmt(nextSession.endTime)}
              </span>
              {(nextSession.speaker || nextSession.speakerEng) && (
                nextSession.speakerId != null ? (
                  <button onClick={() => setNextSpeakerOpen(true)} className="text-sm hover:underline text-left" style={{ color: 'var(--text-mid)' }}>
                    {primary(nextSession.speaker, nextSession.speakerEng)}
                  </button>
                ) : (
                  <span className="text-sm" style={{ color: 'var(--text-mid)' }}>
                    {primary(nextSession.speaker, nextSession.speakerEng)}
                  </span>
                )
              )}
              {nextSession.location && (
                <Link
                  to={`/map?room=${encodeURIComponent(nextSession.location)}`}
                  className="inline-flex items-center gap-1 text-sm font-semibold"
                  style={{ color: 'var(--accent)' }}
                >
                  <MapPin size={12} />{nextSession.location}
                </Link>
              )}
            </div>
            {nextSpeakerOpen && nextSession.speakerId != null && (
              <SpeakerSheet speakerId={nextSession.speakerId} fallbackName={nextSession.speaker} onClose={() => setNextSpeakerOpen(false)} />
            )}
          </div>
          </div>
        )})()}

        {/* ── Pre-conference countdown ── */}
        {!liveSession && !nextSession && daysToConference != null && (
          <div className="rounded-3xl p-5 text-center border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="text-4xl font-black mb-1" style={{ color: 'var(--accent)' }}>{daysToConference}</div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-dim)' }}>
              {t('天後大會開始', 'days until the conference')}
            </div>
          </div>
        )}

        {/* ── Today's meals ── */}
        {todayDayNum != null && (() => {
          const noMealsToday = !MEAL_SLOTS.some(({ key }) => todayMeals?.[key])
          return (
          <div>
            <div className="flex items-center mb-2">
              <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
                {t('今日餐食', "Today's Meals")}
              </span>
            </div>
            {noMealsToday ? (
              <div className="rounded-2xl px-4 py-3 flex items-center gap-3 border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <span className="text-2xl leading-none">🍽️</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {t('今日未訂餐', 'No meals ordered today')}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                    {t('如有疑問，請聯繫大會服務台。', 'Contact the registration desk if you have questions.')}
                  </p>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-3 gap-2">
              {MEAL_SLOTS.map(({ key, zh, en, icon }) => {
                const has = todayMeals?.[key]
                const members = family?.members ?? []
                const ordered = has
                  ? members.filter(m => todayDayNum != null && m.meals?.[String(todayDayNum)]?.[key] === true).length
                  : 0
                const picked = has
                  ? scanRecords.filter(s => s.day === todayDayNum && s.slot === key).length
                  : 0
                const allPicked = ordered > 0 && picked >= ordered
                const somePicked = picked > 0 && !allPicked

                return (
                  <div key={key}
                    className="rounded-2xl p-3 flex flex-col items-center gap-1 border"
                    style={{
                      background: allPicked
                        ? 'color-mix(in srgb, var(--green) 10%, var(--surface))'
                        : 'var(--surface)',
                      borderColor: allPicked ? 'var(--green)' : 'var(--border)',
                      opacity: !has ? 0.35 : 1,
                    }}>
                    <span className="text-2xl leading-none">{icon}</span>
                    <span className="text-xs font-semibold mt-0.5" style={{ color: 'var(--text-mid)' }}>
                      {t(zh, en)}
                    </span>
                    {!has ? (
                      <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                        {t('未包含', 'Not included')}
                      </span>
                    ) : allPicked ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                        ✓ {t('已領取', 'Picked up')}
                      </span>
                    ) : somePicked ? (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums"
                        style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>
                        {picked}/{ordered}
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-dim)' }}>
                        {ordered} {t('份', 'meals')}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            )}
          </div>
        )})()}

        {/* ── Today's schedule ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
              {t('我的今日行程', "Today's Schedule")}
            </span>
            <button onClick={() => navigate('/schedule')}
              className="flex items-center gap-0.5 text-xs font-semibold"
              style={{ color: 'var(--accent)' }}>
              {t('全部', 'All')} <ChevronRight size={13} />
            </button>
          </div>

          {sessLoading && (
            <div className="flex justify-center py-8">
              <Loader2 size={24} className="animate-spin" style={{ color: 'var(--text-dim)' }} />
            </div>
          )}

          {!sessLoading && (() => {
            const myProgram = person?.programCode ?? null
            const myToday = [...todaySessions]
              .filter(s => s.sessionType !== 'OTHER' && (s.signedUp || s.sessionType === 'PLENARY'))
              .filter(s => s.signedUp || !myProgram || !s.programCode || s.programCode === myProgram)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))

            if (myToday.length === 0) return (
              <div className="rounded-3xl p-6 text-center border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="text-3xl mb-3">🗓️</div>
                <p className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>
                  {t('今日尚未報名任何場次', "No sessions signed up for today.")}
                </p>
                <p className="text-xs mb-4" style={{ color: 'var(--text-dim)' }}>
                  {t('前往行程頁面報名今日場次。', 'Head to the schedule to sign up for today\'s sessions.')}
                </p>
                <button
                  onClick={() => navigate('/schedule')}
                  className="px-5 py-2.5 rounded-2xl text-sm font-bold"
                  style={{ background: 'var(--accent)', color: '#fff' }}>
                  {t('瀏覽並報名場次', 'Browse Sessions')} →
                </button>
              </div>
            )

            return (
              <div>
                {myToday.map((s, i, arr) => {
                  const isLive = new Date(s.startTime).getTime() <= now && new Date(s.endTime).getTime() > now
                  return (
                    <DashSessionRow
                      key={s.id} session={s}
                      loading={pendingId === s.id}
                      onSignup={() => signup.mutate(s.id)}
                      onUnsignup={() => unsignup.mutate(s.id)}
                      isLast={i === arr.length - 1}
                      isLive={isLive}
                      now={now}
                    />
                  )
                })}
              </div>
            )
          })()}
        </div>
      </div>
    </>
  )
}

const GOING_TYPES = new Set(['WORKSHOP', 'GENERAL', 'PLENARY', 'WORSHIP'])

function DashSessionRow({ session: s, onSignup, onUnsignup, loading, isLast, isLive, now }: {
  session: CampSession
  onSignup: () => void
  onUnsignup: () => void
  loading: boolean
  isLast: boolean
  isLive: boolean
  now: number
}) {
  const [speakerOpen, setSpeakerOpen] = useState(false)
  const { t, primary } = useLang()
  const { person } = useAuth()
  const isOther = s.sessionType === 'OTHER'
  const canGo = GOING_TYPES.has(s.sessionType)
  const atCapacity = s.capacity != null && s.signupCount >= s.capacity
  const typeColor = TYPE_ACCENT[s.sessionType] ?? 'var(--text-dim)'
  const dotColor = isLive ? 'var(--accent)' : isOther ? 'var(--border2)' : typeColor

  const progressPct = isLive
    ? Math.min(100, Math.max(0, Math.round(
        ((now - new Date(s.startTime).getTime()) /
         (new Date(s.endTime).getTime() - new Date(s.startTime).getTime())) * 100
      )))
    : 0

  return (
    <div className="flex gap-0" style={{ opacity: isOther ? 0.65 : 1 }}>
      {/* Time + line */}
      <div className="flex flex-col items-center" style={{ width: 48, flexShrink: 0 }}>
        <span className="text-xs font-bold tabular-nums leading-none pt-0.5"
          style={{ color: isLive ? 'var(--accent)' : isOther ? 'var(--text-dim)' : typeColor }}>
          {fmt(s.startTime)}
        </span>
        {!isLast && (
          <div className="flex-1 w-px mt-1.5" style={{ background: 'var(--border)', minHeight: 16 }} />
        )}
      </div>

      {/* Dot — pulses when live */}
      <div className="flex flex-col items-center mt-0.5" style={{ width: 18, flexShrink: 0 }}>
        <div className={isLive ? 'animate-pulse' : ''} style={{
          width: isLive ? 9 : 7, height: isLive ? 9 : 7,
          borderRadius: '50%',
          background: dotColor,
          boxShadow: isLive ? `0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent)` : 'none',
        }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pb-4">
        <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
          {isLive && (
            <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              NOW
            </span>
          )}
          {TYPE_LABELS_ZH[s.sessionType] && !isOther && !isLive && (
            <span className="text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded"
              style={{ background: `color-mix(in srgb, ${typeColor} 18%, transparent)`, color: typeColor }}>
              {t(TYPE_LABELS_ZH[s.sessionType] ?? '', TYPE_LABELS_EN[s.sessionType] ?? '')}
            </span>
          )}
          {s.programCode && s.programCode !== person?.programCode && (s.programName || s.programNameEng) && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: 'var(--gold-dim)', color: 'var(--gold)' }}>
              {primary(s.programName, s.programNameEng)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold leading-snug"
            style={{ color: isOther ? 'var(--text-dim)' : 'var(--text)', fontSize: 14 }}>
            {primary(s.title, s.titleEng)}
          </span>
          {canGo && !atCapacity && (
            s.signedUp ? (
              <button disabled={loading} onClick={onUnsignup}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold transition-all shrink-0"
                style={{ background: 'var(--green)', color: '#fff' }}>
                🙋 {t('我去！', 'Going!')}
              </button>
            ) : (
              <button disabled={loading} onClick={onSignup}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold transition-all shrink-0"
                style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent)' }}>
                {t('想去？', 'Sign up?')}
              </button>
            )
          )}
          {canGo && atCapacity && (
            <span className="text-[11px] px-2 py-0.5 rounded-full shrink-0"
              style={{ background: 'var(--border)', color: 'var(--text-dim)' }}>{t('額滿', 'Full')}</span>
          )}
        </div>

        {/* Progress bar for live sessions */}
        {isLive && (
          <div className="mt-2 mb-1 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-1 rounded-full transition-all duration-1000"
              style={{ width: `${progressPct}%`, background: 'var(--accent)' }} />
          </div>
        )}

        {/* Meta: speaker + room */}
        {(s.speaker || s.speakerEng || s.location) && (
          <div className="flex flex-wrap gap-x-3 mt-0.5">
            {(s.speaker || s.speakerEng) && (
              s.speakerId != null ? (
                <button onClick={() => setSpeakerOpen(true)} className="text-xs hover:underline text-left" style={{ color: 'var(--text-dim)' }}>
                  {primary(s.speaker, s.speakerEng)}
                </button>
              ) : (
                <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {primary(s.speaker, s.speakerEng)}
                </span>
              )
            )}
            {speakerOpen && s.speakerId != null && (
              <SpeakerSheet speakerId={s.speakerId} fallbackName={s.speaker} onClose={() => setSpeakerOpen(false)} />
            )}
            {s.location && (
              <Link
                to={`/map?room=${encodeURIComponent(s.location)}`}
                className="flex items-center gap-1 text-xs font-medium hover:underline"
                style={{ color: 'var(--text-dim)' }}
              >
                <MapPin size={10} className="shrink-0" />{s.location}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
