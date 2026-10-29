import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { LogOut, Sun, Moon, Monitor, User, WifiOff } from 'lucide-react'
import { useAuth } from '../auth-context'
import { useLang } from '../lang-context'
import { NotificationBell } from './NotificationBell'

type ThemeChoice = 'dark' | 'light' | 'auto'

function applyTheme(choice: ThemeChoice) {
  if (choice === 'auto') {
    document.documentElement.removeAttribute('data-theme')
  } else {
    document.documentElement.setAttribute('data-theme', choice)
  }
}

function ThemePicker({ theme, setTheme }: { theme: ThemeChoice; setTheme: (t: ThemeChoice) => void }) {
  const { t } = useLang()
  const options: { value: ThemeChoice; icon: React.ReactNode; label: string }[] = [
    { value: 'light', icon: <Sun size={13} />,     label: t('亮', 'Light') },
    { value: 'auto',  icon: <Monitor size={13} />, label: t('自動', 'Auto') },
    { value: 'dark',  icon: <Moon size={13} />,    label: t('暗', 'Dark') },
  ]
  return (
    <div
      className="flex items-center rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--border)', background: 'var(--surface2)' }}
    >
      {options.map(({ value, icon, label }) => {
        const active = theme === value
        return (
          <button
            key={value}
            onClick={() => setTheme(value)}
            aria-label={label}
            className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold transition-colors"
            style={{
              background: active ? 'var(--accent)' : 'transparent',
              color:      active ? '#fff'          : 'var(--text-dim)',
            }}
          >
            {icon}
            <span className="hidden sm:inline">{label}</span>
          </button>
        )
      })}
    </div>
  )
}

// ── Nav icons ─────────────────────────────────────────────────────────────────

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="9" height="9" rx="1"/><rect x="13" y="3" width="9" height="9" rx="1"/>
      <rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/>
    </svg>
  )
}
function ScheduleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
function QrIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      <line x1="14" y1="14" x2="14" y2="14"/><line x1="17" y1="14" x2="17" y2="14"/><line x1="20" y1="14" x2="20" y2="14"/>
      <line x1="14" y1="17" x2="14" y2="17"/><line x1="17" y1="17" x2="17" y2="17"/><line x1="20" y1="17" x2="20" y2="17"/>
      <line x1="14" y1="20" x2="14" y2="20"/><line x1="17" y1="20" x2="17" y2="20"/><line x1="20" y1="20" x2="20" y2="20"/>
    </svg>
  )
}
function MealIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2"/><line x1="7" y1="2" x2="7" y2="11"/>
      <path d="M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h1a2 2 0 002-2z"/><line x1="18" y1="13" x2="18" y2="22"/>
      <line x1="7" y1="11" x2="7" y2="22"/>
    </svg>
  )
}
function MapIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  )
}

// ── Nav config ────────────────────────────────────────────────────────────────

// NAV_ITEMS are computed inside the component to use lang context

// ── Component ─────────────────────────────────────────────────────────────────

export default function Layout({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuth()
  const { t, lang, setLang } = useLang()
  const location = useLocation()
  const navigate = useNavigate()

  const NAV_ITEMS = [
    { to: '/',         label: t('今日', 'Today'),    Icon: HomeIcon, exact: true },
    { to: '/schedule', label: t('行程', 'Schedule'), Icon: ScheduleIcon },
    { to: '/my-qr',   label: 'QR',                  isCenter: true },
    { to: '/meals',   label: t('餐食', 'Meals'),    Icon: MealIcon },
    { to: '/map',     label: t('地圖', 'Map'),      Icon: MapIcon },
  ]
  const [theme, setThemeState] = useState<ThemeChoice>(() =>
    (localStorage.getItem('gc_theme') as ThemeChoice) ?? 'auto'
  )
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  function setTheme(choice: ThemeChoice) {
    setThemeState(choice)
    localStorage.setItem('gc_theme', choice)
    applyTheme(choice)
  }

  useEffect(() => {
    applyTheme(theme)
  }, [])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      {token && (
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-2.5 border-b gap-2"
          style={{ background: 'var(--nav)', borderColor: 'var(--border)' }}>
          {/* Brand block — grows to fill available space, never causes controls to shrink */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <img src="/logo.svg" alt="Good Vessel" className="w-8 h-8 rounded-lg shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-widest uppercase leading-none mb-0.5 whitespace-nowrap"
                style={{ color: 'var(--text-dim)' }}>
                GOOD VESSEL · 好器皿
              </div>
              <div className="flex items-baseline gap-1.5 leading-none min-w-0">
                <span className="text-sm font-black tracking-tight truncate" style={{ color: 'var(--text)' }}>
                  {import.meta.env.VITE_CONFERENCE_NAME ?? '中國福音大會 2026'}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  v{__APP_VERSION__}
                </span>
              </div>
            </div>
          </div>

          {/* Controls — never shrink, never wrap */}
          <div className="flex items-center gap-1.5 shrink-0">
            <NotificationBell />
            <div
              className="flex items-center rounded-lg overflow-hidden"
              style={{ border: '1px solid var(--border)', background: 'var(--surface2)' }}
            >
              {(['zh', 'en'] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className="px-2 py-1 text-[10px] font-bold transition-colors"
                  style={{
                    background: lang === l ? 'var(--accent)' : 'transparent',
                    color:      lang === l ? '#fff'          : 'var(--text-dim)',
                  }}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <ThemePicker theme={theme} setTheme={setTheme} />
            <button
              onClick={() => navigate('/my-info')}
              className="p-2 rounded-lg transition-colors"
              style={{ color: location.pathname === '/my-info' ? 'var(--accent)' : 'var(--text-dim)' }}
              aria-label={t('我的資訊', 'My Info')}
            >
              <User size={16} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-dim)' }}
              aria-label={t('登出', 'Log Out')}
            >
              <LogOut size={16} />
              <span className="hidden sm:inline text-xs font-semibold whitespace-nowrap">{t('登出', 'Log Out')}</span>
            </button>
          </div>
        </header>
      )}

      {!isOnline && (
        <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-semibold"
          style={{ background: 'var(--amber)', color: '#1a1200' }}>
          <WifiOff size={12} />
          離線模式 · Offline — 顯示已緩存資料 Showing cached data
        </div>
      )}

      <main className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>

      {token && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-50 border-t"
          style={{
            background: 'var(--nav)',
            borderColor: 'var(--border)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            overflow: 'visible',
          }}
        >
          <div className="flex">
            {NAV_ITEMS.map(({ to, label, Icon, exact, isCenter }) => {
              const isActive = exact
                ? location.pathname === '/'
                : location.pathname.startsWith(to)

              if (isCenter) {
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className="flex-1 flex flex-col items-center pb-1 relative"
                    style={{ marginTop: '-18px' }}
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-1"
                      style={{
                        background: 'var(--accent)',
                        boxShadow: `0 4px 20px rgba(200,52,26,${isActive ? '.6' : '.4'})`,
                        border: '3px solid var(--nav)',
                      }}
                    >
                      <QrIcon />
                    </div>
                    <span
                      className="text-[10px] font-semibold transition-colors duration-150"
                      style={{ color: isActive ? 'var(--accent)' : 'var(--text-dim)' }}
                    >
                      {label}
                    </span>
                  </NavLink>
                )
              }

              return (
                <NavLink
                  key={to}
                  to={to}
                  className="flex-1 flex flex-col items-center gap-1 pt-2 pb-1 relative"
                >
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-opacity duration-200"
                    style={{ background: 'var(--accent)', opacity: isActive ? 1 : 0 }}
                  />
                  <span
                    style={{ color: isActive ? 'var(--accent)' : 'var(--text-dim)' }}
                    className="transition-colors duration-150"
                  >
                    {Icon && <Icon />}
                  </span>
                  <span
                    className="text-[10px] font-semibold transition-colors duration-150"
                    style={{ color: isActive ? 'var(--accent)' : 'var(--text-dim)' }}
                  >
                    {label}
                  </span>
                </NavLink>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
