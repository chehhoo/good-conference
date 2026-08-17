import { useState } from 'react'
import { MapPin, Navigation } from 'lucide-react'

const HOTEL_NAME = 'Renaissance Schaumburg Convention Center Hotel'
const HOTEL_ADDRESS = '1551 N Thoreau Dr, Schaumburg, IL 60173'
const MAPS_EMBED_URL = 'https://maps.google.com/maps?q=Renaissance+Schaumburg+Convention+Center+Hotel,+1551+N+Thoreau+Dr,+Schaumburg,+IL+60173&output=embed&z=16'
const DIRECTIONS_URL = 'https://maps.google.com/maps?daddr=1551+N+Thoreau+Dr,+Schaumburg,+IL+60173'

type Floor = 1 | 2 | 3

interface Room {
  id: string
  zh: string
  en: string
  type: 'plenary' | 'worship' | 'workshop' | 'dining' | 'service' | 'corridor'
  // SVG rect: x y width height (all 0-100 percentage)
  x: number; y: number; w: number; h: number
  sessions?: string   // session types held here
}

const FLOORS: Record<Floor, { zh: string; en: string; rooms: Room[] }> = {
  1: {
    zh: '一樓', en: 'Floor 1',
    rooms: [
      { id: 'lobby',    zh: '大廳',   en: 'Lobby',         type: 'service',  x: 0,  y: 0,  w: 100, h: 18 },
      { id: 'reg',      zh: '報名處', en: 'Registration',   type: 'service',  x: 0,  y: 18, w: 30,  h: 20 },
      { id: 'info',     zh: '服務台', en: 'Info Desk',      type: 'service',  x: 32, y: 18, w: 36,  h: 20 },
      { id: 'restroom', zh: '洗手間', en: 'Restrooms',      type: 'service',  x: 70, y: 18, w: 30,  h: 20 },
      { id: 'corridor1',zh: '',       en: '',               type: 'corridor', x: 0,  y: 40, w: 100, h: 8  },
      { id: 'dining',   zh: '餐廳',   en: 'Dining Hall',    type: 'dining',   x: 0,  y: 50, w: 55,  h: 50, sessions: '三餐 · All Meals' },
      { id: 'chapel',   zh: '禮拜堂', en: 'Chapel',         type: 'worship',  x: 58, y: 50, w: 42,  h: 50, sessions: '敬拜 · Worship' },
    ],
  },
  2: {
    zh: '二樓', en: 'Floor 2',
    rooms: [
      { id: 'ballroom', zh: '大宴會廳', en: 'Grand Ballroom', type: 'plenary',  x: 0,  y: 0,  w: 100, h: 45, sessions: '全體大會 · Plenary' },
      { id: 'corridor2',zh: '',         en: '',               type: 'corridor', x: 0,  y: 47, w: 100, h: 6  },
      { id: 'wa',       zh: '工作坊 A', en: 'Workshop A',     type: 'workshop', x: 0,  y: 55, w: 30,  h: 45, sessions: '工作坊 A' },
      { id: 'wb',       zh: '工作坊 B', en: 'Workshop B',     type: 'workshop', x: 35, y: 55, w: 30,  h: 45, sessions: '工作坊 B' },
      { id: 'wc',       zh: '工作坊 C', en: 'Workshop C',     type: 'workshop', x: 70, y: 55, w: 30,  h: 45, sessions: '工作坊 C' },
    ],
  },
  3: {
    zh: '三樓', en: 'Floor 3',
    rooms: [
      { id: 'seminar1', zh: '研討室 1', en: 'Seminar 1', type: 'workshop', x: 0,  y: 0,  w: 46, h: 45, sessions: '分組討論 A' },
      { id: 'seminar2', zh: '研討室 2', en: 'Seminar 2', type: 'workshop', x: 54, y: 0,  w: 46, h: 45, sessions: '分組討論 B' },
      { id: 'corridor3',zh: '',          en: '',          type: 'corridor', x: 0,  y: 47, w: 100, h: 6 },
      { id: 'quiet',    zh: '安靜室',   en: 'Quiet Room', type: 'service',  x: 0,  y: 55, w: 46, h: 45 },
      { id: 'prayer',   zh: '禱告室',   en: 'Prayer Room', type: 'worship', x: 54, y: 55, w: 46, h: 45 },
    ],
  },
}

const ROOM_COLORS: Record<Room['type'], { fill: string; stroke: string; text: string; label: string; labelEn: string }> = {
  plenary:  { fill: 'rgba(200,52,26,0.22)',   stroke: 'rgba(200,52,26,0.55)',   text: '#ff9a80', label: '全體大會', labelEn: 'Plenary' },
  worship:  { fill: 'rgba(239,160,32,0.18)',  stroke: 'rgba(239,160,32,0.45)',  text: '#ffd070', label: '敬拜',     labelEn: 'Worship' },
  workshop: { fill: 'rgba(99,179,237,0.18)',  stroke: 'rgba(99,179,237,0.45)',  text: '#90cdf4', label: '工作坊',   labelEn: 'Workshop' },
  dining:   { fill: 'rgba(34,197,94,0.18)',   stroke: 'rgba(34,197,94,0.45)',   text: '#86efac', label: '餐廳',     labelEn: 'Dining' },
  service:  { fill: 'rgba(148,163,184,0.12)', stroke: 'rgba(148,163,184,0.3)',  text: '#94a3b8', label: '服務',     labelEn: 'Service' },
  corridor: { fill: 'rgba(255,255,255,0.03)', stroke: 'transparent',             text: 'rgba(255,255,255,0.15)', label: '走廊', labelEn: 'Corridor' },
}

const LEGEND_TYPES: Room['type'][] = ['plenary', 'worship', 'workshop', 'dining', 'service']

export default function Map() {
  const [floor, setFloor] = useState<Floor>(2)
  const [selected, setSelected] = useState<string | null>(null)

  const floorData = FLOORS[floor]
  const selectedRoom = floorData.rooms.find(r => r.id === selected)

  return (
    <div className="max-w-lg mx-auto px-4 py-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(99,179,237,0.15)' }}>
          <MapPin size={17} style={{ color: '#63B3ED' }} />
        </div>
        <div>
          <h1 className="text-base font-black" style={{ color: 'var(--text)' }}>場地地圖</h1>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Venue Map</p>
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
            導航 Directions
          </a>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
          室內地圖 · Floor Plan
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      {/* Floor selector */}
      <div className="flex gap-2 mb-4">
        {([1, 2, 3] as Floor[]).map(f => (
          <button
            key={f}
            onClick={() => { setFloor(f); setSelected(null) }}
            className="flex-1 py-2 rounded-xl text-sm font-bold transition-all border"
            style={{
              background: floor === f ? 'var(--accent)' : 'var(--surface)',
              color: floor === f ? '#fff' : 'var(--text-dim)',
              borderColor: floor === f ? 'transparent' : 'var(--border)',
            }}
          >
            {FLOORS[f].zh}
            <span className="block text-[10px] font-normal opacity-70">{FLOORS[f].en}</span>
          </button>
        ))}
      </div>

      {/* Map SVG */}
      <div className="rounded-3xl border overflow-hidden mb-3"
        style={{ background: '#0a1525', borderColor: 'var(--border)' }}>
        <svg viewBox="0 0 100 100" className="w-full" style={{ aspectRatio: '1/1' }}>
          {floorData.rooms.map(room => {
            const colors = ROOM_COLORS[room.type]
            const isSelected = selected === room.id
            const isCorr = room.type === 'corridor'
            return (
              <g key={room.id} onClick={() => !isCorr && setSelected(isSelected ? null : room.id)}
                style={{ cursor: isCorr ? 'default' : 'pointer' }}>
                <rect
                  x={room.x + 0.5} y={room.y + 0.5}
                  width={room.w - 1} height={room.h - 1}
                  rx="2"
                  fill={isSelected ? colors.stroke : colors.fill}
                  stroke={isSelected ? colors.text : colors.stroke}
                  strokeWidth={isSelected ? '0.8' : '0.5'}
                />
                {!isCorr && room.w > 15 && room.h > 10 && (
                  <>
                    <text
                      x={room.x + room.w / 2}
                      y={room.y + room.h / 2 - (room.en ? 1.5 : 0)}
                      textAnchor="middle" dominantBaseline="middle"
                      fontSize={Math.min(room.w, room.h) > 30 ? 5.5 : 4}
                      fontWeight="700"
                      fill={colors.text}
                    >
                      {room.zh}
                    </text>
                    {room.en && (
                      <text
                        x={room.x + room.w / 2}
                        y={room.y + room.h / 2 + (Math.min(room.w, room.h) > 30 ? 6 : 4.5)}
                        textAnchor="middle" dominantBaseline="middle"
                        fontSize={Math.min(room.w, room.h) > 30 ? 3.5 : 3}
                        fill={colors.text}
                        opacity="0.7"
                      >
                        {room.en}
                      </text>
                    )}
                  </>
                )}
                {isCorr && (
                  <text x="50" y={room.y + room.h / 2} textAnchor="middle" dominantBaseline="middle"
                    fontSize="2.5" fill="rgba(255,255,255,0.12)" letterSpacing="0.5">
                    走廊 · CORRIDOR
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Selected room detail */}
      {selectedRoom && selectedRoom.type !== 'corridor' && (
        <div className="rounded-2xl p-4 mb-3 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-base font-black" style={{ color: 'var(--text)' }}>
                {selectedRoom.zh}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{selectedRoom.en}</div>
              {selectedRoom.sessions && (
                <div className="mt-2 text-xs font-semibold px-2.5 py-1 rounded-lg inline-block"
                  style={{
                    background: ROOM_COLORS[selectedRoom.type].fill,
                    color: ROOM_COLORS[selectedRoom.type].text,
                  }}>
                  {selectedRoom.sessions}
                </div>
              )}
            </div>
            <button onClick={() => setSelected(null)}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'var(--border)', color: 'var(--text-dim)' }}>
              關閉
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {LEGEND_TYPES.map(type => {
          const c = ROOM_COLORS[type]
          return (
            <div key={type} className="flex items-center gap-1.5 text-xs">
              <span className="w-3 h-3 rounded" style={{ background: c.fill, border: `1px solid ${c.stroke}` }} />
              <span style={{ color: 'var(--text-dim)' }}>{c.label} {c.labelEn}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
