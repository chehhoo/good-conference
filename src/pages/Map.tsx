import { useState } from 'react'
import { MapPin, Navigation } from 'lucide-react'

const HOTEL_NAME = 'Renaissance Schaumburg Convention Center Hotel'
const HOTEL_ADDRESS = '1551 N Thoreau Dr, Schaumburg, IL 60173'
const MAPS_EMBED_URL = 'https://maps.google.com/maps?q=Renaissance+Schaumburg+Convention+Center+Hotel,+1551+N+Thoreau+Dr,+Schaumburg,+IL+60173&output=embed&z=16'
const DIRECTIONS_URL = 'https://maps.google.com/maps?daddr=1551+N+Thoreau+Dr,+Schaumburg,+IL+60173'

const FLOOR_PLANS = [
  {
    id: 'floor1',
    zh: '一樓會議室',
    en: 'Meeting Rooms — Floor 1',
    img: 'https://cdn.prod.website-files.com/5e8517632b93897386b44f9c/5e8c8d5b245505d24986f377_meeting-rooms-first-floor-sm.png',
  },
  {
    id: 'floor2',
    zh: '二樓會議室',
    en: 'Meeting Rooms — Floor 2',
    img: 'https://cdn.prod.website-files.com/5e8517632b93897386b44f9c/5e8c8e98f1f3222484334b2e_meeting-rooms-second-floor-sm.png',
  },
  {
    id: 'exhibit',
    zh: '展覽廳',
    en: 'Exhibit Hall',
    img: 'https://cdn.prod.website-files.com/5e8517632b93897386b44f9c/5e8e53f0eccc38c88f40a022_exhibit-hall-sm.png',
  },
  {
    id: 'ballroom',
    zh: '宴會廳',
    en: 'Schaumburg Ballroom',
    img: 'https://cdn.prod.website-files.com/5e8517632b93897386b44f9c/5e8c8b0a0b8aea771cf1c32b_schaumburg-ballroom-sm.png',
  },
]

export default function Map() {
  const [planId, setPlanId] = useState('floor1')

  const activePlan = FLOOR_PLANS.find(p => p.id === planId)!

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
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
        <span className="text-[10px] font-bold tracking-widest uppercase" style={{ color: 'var(--text-dim)' }}>
          室內地圖 · Floor Plan
        </span>
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      {/* Floor plan selector */}
      <div className="grid grid-cols-2 gap-2 mb-3">
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
            <div className="text-xs font-bold leading-snug">{p.zh}</div>
            <div className="text-[10px] opacity-70 leading-snug">{p.en}</div>
          </button>
        ))}
      </div>

      {/* Floor plan image */}
      <div className="rounded-3xl border overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <img
          key={activePlan.id}
          src={activePlan.img}
          alt={activePlan.en}
          className="w-full block"
          style={{ imageRendering: 'auto' }}
        />
        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-bold" style={{ color: 'var(--text)' }}>{activePlan.zh}</p>
          <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-dim)' }}>{activePlan.en}</p>
        </div>
      </div>
    </div>
  )
}
