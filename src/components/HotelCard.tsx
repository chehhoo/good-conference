import { useState } from 'react'
import { ChevronDown, ChevronUp, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLang } from '../lang-context'

// ── Organizer config — fill these in before the conference ──────────────────
const HOTEL = {
  name: { zh: '文藝復興 Schaumburg 大會中心酒店', en: 'Renaissance Schaumburg Convention Center Hotel' },
  wifi: { name: '', password: '' },   // e.g. { name: 'RenaissanceGuest', password: 'welcome123' }
  phone: '',                           // e.g. '(847) 303-4100'
  checkIn:  '4:00 PM',
  checkOut: '12:00 PM',
  shuttle: '',                         // e.g. 'O\'Hare shuttle: 8AM, 12PM, 5PM daily'
}

const ROOMS: { zh: string; en: string; location: string; floor: string }[] = [
  { zh: '大會主場',   en: 'Main Session',    location: 'Schaumburg Ballroom',      floor: '1F' },
  { zh: '早午晚餐',   en: 'Meals',           location: 'Adventure Hall',           floor: '1F' },
  { zh: '工作坊',     en: 'Workshops',       location: 'Schaumburg / Utopia / Euphoria', floor: '1F–2F' },
  { zh: '恩典大會',   en: 'Grace Conf.',     location: 'Utopia Ballroom',          floor: '2F' },
  { zh: '佈道會',     en: 'Evangelistic',    location: 'Nirvana ABC',              floor: '2F' },
  { zh: '晚間禱告',   en: 'Prayer Vigil',    location: 'Innovation Room',          floor: '1F' },
]
// ───────────────────────────────────────────────────────────────────────────

type Tab = 'rooms' | 'hotel'

export function HotelCard() {
  const { t } = useLang()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('rooms')

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {/* Header — always visible, tap to expand */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-4 py-3"
      >
        <span className="text-xl select-none" aria-hidden>🏨</span>
        <div className="flex-1 text-left">
          <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
            {t('酒店資訊', 'Hotel Info')}
          </span>
          <span className="ml-2 text-xs" style={{ color: 'var(--text-dim)' }}>
            {t('場地 · 停車 · 住宿', 'Rooms · Parking · Stay')}
          </span>
        </div>
        {open
          ? <ChevronUp size={16} style={{ color: 'var(--text-dim)' }} />
          : <ChevronDown size={16} style={{ color: 'var(--text-dim)' }} />}
      </button>

      {open && (
        <div>
          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border)' }} />

          {/* Tab switcher */}
          <div className="flex gap-1 px-4 pt-3 pb-0">
            {(['rooms', 'hotel'] as Tab[]).map(id => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className="px-3 py-1 rounded-full text-xs font-bold transition-colors"
                style={tab === id
                  ? { background: 'var(--accent)', color: '#fff' }
                  : { background: 'var(--border)', color: 'var(--text-dim)' }
                }
              >
                {id === 'rooms' ? t('場地', 'Rooms') : t('住宿', 'Hotel')}
              </button>
            ))}
          </div>

          {/* Rooms tab */}
          {tab === 'rooms' && (
            <div className="px-4 py-3 space-y-2">
              {ROOMS.map(r => (
                <div key={r.en} className="flex items-center gap-2">
                  <span className="text-xs font-bold shrink-0 w-16 text-right tabular-nums"
                    style={{ color: 'var(--text-dim)' }}>
                    {t(r.zh, r.en)}
                  </span>
                  <span style={{ width: 1, height: 14, background: 'var(--border)', flexShrink: 0 }} />
                  <Link
                    to={`/map?room=${encodeURIComponent(r.location)}`}
                    className="flex items-center gap-1 text-xs font-semibold flex-1 min-w-0"
                    style={{ color: 'var(--text)' }}
                  >
                    <MapPin size={10} className="shrink-0" style={{ color: 'var(--accent)' }} />
                    <span className="truncate">{r.location}</span>
                    <span className="shrink-0 ml-auto text-xs px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--border)', color: 'var(--text-dim)' }}>
                      {r.floor}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* Hotel tab */}
          {tab === 'hotel' && (
            <div className="px-4 py-3 space-y-2.5">
              <HotelRow icon="🕓" label={t('入住', 'Check-in')}  value={HOTEL.checkIn} />
              <HotelRow icon="🕛" label={t('退房', 'Check-out')} value={HOTEL.checkOut} />
              <HotelRow icon="🚗" label={t('停車', 'Parking')}
                value={t(
                  '停車場 (限高 7\'6") · 有電梯連接大廳 · NE/NW/S 地面停車場',
                  'Garage (7\'6" max) · Bridge to lobby · NE/NW/S surface lots'
                )} />
              <HotelRow icon="🏊" label={t('健身房/泳池', 'Pool & Gym')} value={t('一樓', '1st floor')} />
              <HotelRow icon="🍽️" label={t('餐廳', 'Restaurant')}
                value="Schaumburg Public House · 2F" />
              {HOTEL.wifi.name && (
                <HotelRow icon="📶" label="WiFi"
                  value={`${HOTEL.wifi.name}  ·  ${HOTEL.wifi.password}`} />
              )}
              {HOTEL.phone && (
                <HotelRow icon="📞" label={t('前台', 'Front Desk')} value={HOTEL.phone} />
              )}
              {HOTEL.shuttle && (
                <HotelRow icon="🚌" label={t('接駁車', 'Shuttle')} value={HOTEL.shuttle} />
              )}
              {(!HOTEL.wifi.name || !HOTEL.phone) && (
                <p className="text-xs pt-1" style={{ color: 'var(--text-dim)' }}>
                  {t('WiFi / 前台電話資訊將於大會前更新', 'WiFi & front desk info will be updated before the conference.')}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function HotelRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-base select-none shrink-0 leading-tight" aria-hidden>{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="text-xs font-bold" style={{ color: 'var(--text-dim)' }}>{label}  </span>
        <span className="text-xs" style={{ color: 'var(--text)' }}>{value}</span>
      </div>
    </div>
  )
}
