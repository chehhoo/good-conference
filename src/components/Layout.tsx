import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { LogOut, Sun, Moon } from 'lucide-react'
import { useAuth } from '../auth-context'

const NAV_ITEMS = [
  { to: '/schedule',     label: '行程',    Icon: () => <ScheduleIcon /> },
  { to: '/my-schedule',  label: '我的行程', Icon: () => <BookmarkIcon /> },
  { to: '/',             label: '今日',    Icon: () => <HomeIcon />, exact: true },
  { to: '/my-qr',        label: '我的QR',  Icon: () => <QrIcon />   },
  { to: '/my-info',      label: '我的資訊', Icon: () => <PersonIcon /> },
]

function ScheduleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  )
}
function BookmarkIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
    </svg>
  )
}
function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="9" height="9" rx="1"/><rect x="13" y="3" width="9" height="9" rx="1"/><rect x="2" y="13" width="9" height="9" rx="1"/><rect x="13" y="13" width="9" height="9" rx="1"/>
    </svg>
  )
}
function QrIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      <line x1="14" y1="14" x2="14" y2="14"/><line x1="17" y1="14" x2="17" y2="14"/><line x1="20" y1="14" x2="20" y2="14"/>
      <line x1="14" y1="17" x2="14" y2="17"/><line x1="17" y1="17" x2="17" y2="17"/><line x1="20" y1="17" x2="20" y2="17"/>
      <line x1="14" y1="20" x2="14" y2="20"/><line x1="17" y1="20" x2="17" y2="20"/><line x1="20" y1="20" x2="20" y2="20"/>
    </svg>
  )
}
function PersonIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { token, person, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('gc_theme') as 'dark' | 'light') ?? 'dark'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('gc_theme', theme)
  }, [theme])

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const displayName = person?.chineseName || (person ? `${person.firstName} ${person.lastName}` : '')

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>
      {token && (
        <header className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b" style={{ background: 'var(--nav)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Good Vessel" className="w-7 h-7 rounded-lg" />
            <span className="text-sm font-semibold" style={{ color: 'var(--text-mid)' }}>{displayName}</span>
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
          className="fixed bottom-0 left-0 right-0 flex z-50 border-t pb-[env(safe-area-inset-bottom)]"
          style={{ background: 'var(--nav)', borderColor: 'var(--border)' }}
        >
          {NAV_ITEMS.map(({ to, label, Icon, exact }) => {
            const isActive = exact
              ? location.pathname === '/'
              : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className="flex-1 flex flex-col items-center gap-1 pt-2 pb-1 relative"
              >
                {/* active dot */}
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-opacity duration-200"
                  style={{ background: 'var(--accent)', opacity: isActive ? 1 : 0 }}
                />
                <span style={{ color: isActive ? 'var(--accent)' : 'var(--text-dim)' }} className="transition-colors duration-150">
                  <Icon />
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
        </nav>
      )}
    </div>
  )
}
