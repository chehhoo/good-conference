import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { LogOut, Sun, Moon, User } from 'lucide-react'
import { useAuth } from '../auth-context'

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

const NAV_ITEMS = [
  { to: '/',         label: '今日', Icon: HomeIcon, exact: true },
  { to: '/schedule', label: '行程', Icon: ScheduleIcon },
  { to: '/my-qr',   label: 'QR碼', isCenter: true },
  { to: '/meals',   label: '餐食', Icon: MealIcon },
  { to: '/map',     label: '地圖', Icon: MapIcon },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function Layout({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [theme, setTheme] = useState<'dark' | 'light'>(() =>
    (localStorage.getItem('gc_theme') as 'dark' | 'light') ?? 'dark'
  )

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('gc_theme', theme)
  }, [theme])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      {token && (
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-2.5 border-b"
          style={{ background: 'var(--nav)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5 min-w-0">
            <img src="/logo.svg" alt="Good Vessel" className="w-8 h-8 rounded-lg shrink-0" />
            <div className="min-w-0">
              <div className="text-[10px] font-bold tracking-widest uppercase leading-none mb-0.5"
                style={{ color: 'var(--text-dim)' }}>
                GOOD VESSEL · 好器皿
              </div>
              <div className="flex items-baseline gap-1.5 leading-none">
                <span className="text-sm font-black tracking-tight" style={{ color: 'var(--text)' }}>
                  {import.meta.env.VITE_CONFERENCE_NAME ?? '中國福音大會 2026'}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  v{__APP_VERSION__}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-dim)' }}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={() => navigate('/my-info')}
              className="p-2 rounded-lg transition-colors"
              style={{ color: location.pathname === '/my-info' ? 'var(--accent)' : 'var(--text-dim)' }}
              aria-label="我的資訊"
            >
              <User size={16} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              style={{ color: 'var(--text-dim)' }}
            >
              <LogOut size={14} />
              登出
            </button>
          </div>
        </header>
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
