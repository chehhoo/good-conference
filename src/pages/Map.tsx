import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { MapPin, Navigation, ChevronDown } from 'lucide-react'
import { usePageTitle } from '../hooks/usePageTitle'
import { useLang } from '../lang-context'

const HOTEL_NAME = 'Renaissance Schaumburg Convention Center Hotel'
const HOTEL_ADDRESS = '1551 N Thoreau Dr, Schaumburg, IL 60173'
const MAPS_EMBED_URL = 'https://maps.google.com/maps?q=Renaissance+Schaumburg+Convention+Center+Hotel,+1551+N+Thoreau+Dr,+Schaumburg,+IL+60173&output=embed&z=16'
const DIRECTIONS_URL = 'https://maps.google.com/maps?daddr=1551+N+Thoreau+Dr,+Schaumburg,+IL+60173'

const FLOOR_PLANS = [
  {
    id: 'hotel',
    zh: '酒店地圖',
    en: 'Hotel Map',
    img: '/maps/hotel-0.png',
    keywords: [
      'schaumburg', 'innovation', 'inspiration', 'creation', 'journey',
      'utopia', 'nirvana', 'euphoria', 'serenity', 'prosperity', 'epiphany',
      'public house', 'rendezvous', 'gather', 'connection', 'imagination',
      'perfection', 'knowledge', 'business', 'reception',
    ],
  },
  {
    id: 'convention',
    zh: '會議中心',
    en: 'Convention Center',
    img: '/maps/hotel-1.png',
    keywords: [
      'adventure hall', 'discovery hall', 'exploration hall',
      'adventure', 'discovery', 'exploration', 'exhibit', 'show office',
    ],
  },
  {
    id: 'parking',
    zh: '停車場',
    en: 'Parking',
    img: '/maps/parking-0.png',
    keywords: ['parking', 'garage', 'lot', 'northwest', 'northeast', 'south parking'],
  },
]

// x/y are % positions from top-left of their respective map image.
// Schaumburg Ballroom grid (1F, hotel-0.png):
//   Columns: left=h/g/f/e (x≈46), right=d/c/b/a (x≈58), east/west divider (x≈52)
//   Rows top→bottom: row1(h,d)=y≈27, row2(g,c)=y≈30, row3(f,b)=y≈33, row4(e,a)=y≈36
// Nirvana Ballroom sections (2F): a=top(y≈84), b=mid(y≈87), c=bot(y≈90)
// Utopia Ballroom sections (2F): d=top(y≈62), c=y≈65, b=y≈68, a=bot(y≈71)
const ALL_ROOMS: {
  name: string; zh: string; floor: string; tab: string
  x: number; y: number
}[] = [
  // ── Convention Center (hotel-1.png) ──
  { name: 'Adventure Hall',         zh: '探險廳',         floor: '1F', tab: 'convention', x: 48, y: 28 },
  { name: 'Discovery Hall',         zh: '發現廳',         floor: '1F', tab: 'convention', x: 42, y: 52 },
  { name: 'Exploration Hall',       zh: '探索廳',         floor: '1F', tab: 'convention', x: 42, y: 73 },
  // ── Hotel 1F — Schaumburg Ballroom sub-sections ──
  { name: 'Schaumburg Ballroom',    zh: '肖姆堡宴會廳',   floor: '1F', tab: 'hotel',      x: 52, y: 31 },
  { name: 'Schaumburg A',           zh: '肖姆堡 A',       floor: '1F', tab: 'hotel',      x: 58, y: 36 },
  { name: 'Schaumburg B',           zh: '肖姆堡 B',       floor: '1F', tab: 'hotel',      x: 58, y: 33 },
  { name: 'Schaumburg C',           zh: '肖姆堡 C',       floor: '1F', tab: 'hotel',      x: 58, y: 30 },
  { name: 'Schaumburg D',           zh: '肖姆堡 D',       floor: '1F', tab: 'hotel',      x: 58, y: 27 },
  { name: 'Schaumburg E',           zh: '肖姆堡 E',       floor: '1F', tab: 'hotel',      x: 46, y: 36 },
  { name: 'Schaumburg F',           zh: '肖姆堡 F',       floor: '1F', tab: 'hotel',      x: 46, y: 33 },
  { name: 'Schaumburg G',           zh: '肖姆堡 G',       floor: '1F', tab: 'hotel',      x: 46, y: 30 },
  { name: 'Schaumburg H',           zh: '肖姆堡 H',       floor: '1F', tab: 'hotel',      x: 46, y: 27 },
  { name: 'Schaumburg East',        zh: '肖姆堡東廳',     floor: '1F', tab: 'hotel',      x: 55, y: 29 },
  { name: 'Schaumburg West',        zh: '肖姆堡西廳',     floor: '1F', tab: 'hotel',      x: 49, y: 29 },
  // ── Hotel 1F — other rooms ──
  { name: 'Innovation Room',        zh: '創新室',         floor: '1F', tab: 'hotel',      x: 63, y: 43 },
  { name: 'Inspiration',            zh: '靈感廳',         floor: '1F', tab: 'hotel',      x: 60, y: 40 },
  // ── Hotel 2F — Utopia sub-sections ──
  { name: 'Utopia Ballroom',        zh: '烏托邦宴會廳',   floor: '2F', tab: 'hotel',      x: 22, y: 65 },
  { name: 'Utopia A',               zh: '烏托邦 A',       floor: '2F', tab: 'hotel',      x: 29, y: 70 },
  { name: 'Utopia B',               zh: '烏托邦 B',       floor: '2F', tab: 'hotel',      x: 29, y: 67 },
  { name: 'Utopia C',               zh: '烏托邦 C',       floor: '2F', tab: 'hotel',      x: 29, y: 64 },
  { name: 'Utopia D',               zh: '烏托邦 D',       floor: '2F', tab: 'hotel',      x: 29, y: 62 },
  // ── Hotel 2F — Nirvana sub-sections ──
  { name: 'Nirvana ABC',            zh: '涅槃廳 ABC',     floor: '2F', tab: 'hotel',      x: 22, y: 87 },
  { name: 'Nirvana A',              zh: '涅槃廳 A',       floor: '2F', tab: 'hotel',      x: 29, y: 84 },
  { name: 'Nirvana B',              zh: '涅槃廳 B',       floor: '2F', tab: 'hotel',      x: 29, y: 87 },
  { name: 'Nirvana C',              zh: '涅槃廳 C',       floor: '2F', tab: 'hotel',      x: 29, y: 90 },
  // ── Hotel 2F — other rooms ──
  { name: 'Euphoria',               zh: '歡樂廳',         floor: '2F', tab: 'hotel',      x: 26, y: 71 },
  { name: 'Serenity',               zh: '靜謐廳',         floor: '2F', tab: 'hotel',      x: 26, y: 75 },
  { name: 'Prosperity',             zh: '繁榮廳',         floor: '2F', tab: 'hotel',      x: 26, y: 79 },
  { name: 'Epiphany',               zh: '頓悟廳',         floor: '2F', tab: 'hotel',      x: 26, y: 82 },
]

const MATCH_ORDER = ['convention', 'parking', 'hotel']

function floorPlanForRoom(room: string): string | null {
  const lower = room.toLowerCase()
  for (const id of MATCH_ORDER) {
    const plan = FLOOR_PLANS.find(p => p.id === id)!
    if (plan.keywords.some(k => lower.includes(k))) return id
  }
  return null
}

export default function Map() {
  usePageTitle('場地地圖', 'Venue Map')
  const [searchParams] = useSearchParams()
  const [planId, setPlanId] = useState('hotel')
  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const { t, primary, secondary } = useLang()

  useEffect(() => {
    const room = searchParams.get('room')
    if (room) {
      const matched = floorPlanForRoom(room)
      setPlanId(matched ?? 'hotel')
      const exact = ALL_ROOMS.find(r => r.name.toLowerCase() === room.toLowerCase())
      const partial = ALL_ROOMS.find(r =>
        r.name.toLowerCase().includes(room.toLowerCase()) ||
        room.toLowerCase().includes(r.name.toLowerCase())
      )
      setSelectedRoom(exact?.name ?? partial?.name ?? '')
    }
  }, [searchParams])

  function handleRoomSelect(name: string) {
    setSelectedRoom(name)
    if (!name) return
    const room = ALL_ROOMS.find(r => r.name === name)
    if (room) setPlanId(room.tab)
  }

  const activePlan = FLOOR_PLANS.find(p => p.id === planId)!
  const pinRoom = ALL_ROOMS.find(r => r.name === selectedRoom && r.tab === planId)

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(99,179,237,0.15)' }}>
          <MapPin size={17} style={{ color: '#63B3ED' }} />
        </div>
        <div>
          <h1 className="text-base font-black" style={{ color: 'var(--text)' }}>
            {t('場地地圖', 'Venue Map')}
          </h1>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            {t('Venue Map', '場地地圖')}
          </p>
        </div>
      </div>

      {/* Google Maps embed */}
      <div className="rounded-3xl overflow-hidden border mb-3" style={{ borderColor: 'var(--border)' }}>
        <iframe
          title="Venue location"
          src={MAPS_EMBED_URL}
          width="100%"
          height="220"
          style={{ border: 0, display: 'block' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        <div className="flex items-center justify-between px-4 py-3"
          style={{ background: 'var(--surface)' }}>
          <div className="min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{HOTEL_NAME}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{HOTEL_ADDRESS}</p>
          </div>
          <a
            href={DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold ml-3 shrink-0"
            style={{ background: 'var(--accent)', color: '#fff' }}
          >
            <Navigation size={12} />
            {t('導航', 'Directions')}
          </a>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
          室內地圖 · Floor Plan
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      {/* Room finder dropdown */}
      <div className="relative mb-3">
        <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-dim)' }} />
        <select
          value={selectedRoom}
          onChange={e => handleRoomSelect(e.target.value)}
          className="w-full appearance-none rounded-xl pl-8 pr-8 py-2.5 text-xs font-semibold border"
          style={{
            background: 'var(--surface)',
            color: selectedRoom ? 'var(--text)' : 'var(--text-dim)',
            borderColor: selectedRoom ? 'var(--accent)' : 'var(--border)',
            outline: 'none',
          }}
        >
          <option value="">{t('選擇場地 …', 'Find a room …')} / {t('Find a room …', '選擇場地 …')}</option>
          {ALL_ROOMS.map(r => (
            <option key={r.name} value={r.name}>
              {r.name} · {r.zh} · {r.floor}
            </option>
          ))}
        </select>
        <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--text-dim)' }} />
      </div>

      {/* Floor plan tab selector */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        {FLOOR_PLANS.map(p => (
          <button
            key={p.id}
            onClick={() => setPlanId(p.id)}
            className="py-2 px-3 rounded-xl text-left transition-all border"
            style={{
              background: planId === p.id ? 'var(--accent)' : 'var(--surface)',
              color: planId === p.id ? '#fff' : 'var(--text-dim)',
              borderColor: planId === p.id ? 'transparent' : 'var(--border)',
            }}
          >
            <div className="text-xs font-bold leading-snug">{primary(p.zh, p.en)}</div>
            <div className="text-[10px] opacity-70 leading-snug">{secondary(p.zh, p.en)}</div>
          </button>
        ))}
      </div>

      {/* Floor plan image with pin overlay */}
      <div className="rounded-3xl border overflow-hidden"
        style={{ background: '#fff', borderColor: 'var(--border)' }}>
        <div className="relative">
          <img
            key={activePlan.id}
            src={activePlan.img}
            alt={activePlan.en}
            className="w-full block"
            style={{ imageRendering: 'auto' }}
          />

          {/* Coordinate pin — rendered only when a room on this tab is selected */}
          {pinRoom && (
            <div
              className="absolute"
              style={{
                left: `${pinRoom.x}%`,
                top: `${pinRoom.y}%`,
                transform: 'translate(-50%, -100%)',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              {/* Pulsing halo */}
              <span
                className="absolute rounded-full"
                style={{
                  width: 28, height: 28,
                  left: '50%', top: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(200,52,26,0.5)',
                  opacity: 0.3,
                  animation: 'map-pulse 1.6s ease-out infinite',
                }}
              />
              {/* Pin bubble */}
              <div
                className="relative flex flex-col items-center"
                style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}
              >
                <div
                  className="rounded-xl px-2 py-1 flex items-center gap-1"
                  style={{ background: 'rgba(200,52,26,0.45)', whiteSpace: 'nowrap', backdropFilter: 'blur(4px)' }}
                >
                  <MapPin size={10} color="#fff" />
                  <span className="text-[10px] font-bold text-white">{pinRoom.name}</span>
                  <span className="text-[9px] text-white opacity-75">·</span>
                  <span className="text-[10px] font-bold text-white">{pinRoom.zh}</span>
                  <span
                    className="text-[9px] rounded px-1 font-bold ml-0.5"
                    style={{ background: 'rgba(0,0,0,0.25)', color: '#fff' }}
                  >{pinRoom.floor}</span>
                </div>
                {/* Stem */}
                <div style={{
                  width: 0, height: 0,
                  borderLeft: '5px solid transparent',
                  borderRight: '5px solid transparent',
                  borderTop: '6px solid rgba(200,52,26,0.45)',
                }} />
                {/* Dot at tip */}
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: 'rgba(200,52,26,0.45)',
                  marginTop: -1,
                }} />
              </div>
            </div>
          )}
        </div>

        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>
            {primary(activePlan.zh, activePlan.en)}
            <span className="ml-2 font-normal" style={{ color: 'var(--text-dim)' }}>
              {secondary(activePlan.zh, activePlan.en)}
            </span>
          </p>
          {selectedRoom && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <MapPin size={10} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span className="text-[11px]" style={{ color: 'var(--text)' }}>
                {selectedRoom}
              </span>
              <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>
                · {ALL_ROOMS.find(r => r.name === selectedRoom)?.zh}
              </span>
              {ALL_ROOMS.find(r => r.name === selectedRoom)?.tab !== planId && (
                <span className="text-[10px] ml-1" style={{ color: 'var(--text-dim)' }}>
                  {t('（請切換地圖標籤）', '(switch map tab above)')}
                </span>
              )}
              <button
                onClick={() => setSelectedRoom('')}
                className="ml-auto text-[10px]"
                style={{ color: 'var(--text-dim)' }}
              >✕</button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes map-pulse {
          0%   { transform: translate(-50%,-50%) scale(1);   opacity: 0.4; }
          70%  { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
          100% { transform: translate(-50%,-50%) scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
