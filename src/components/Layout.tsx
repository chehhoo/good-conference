import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { CalendarDays, BookMarked, User, LogOut } from 'lucide-react'
import { useAuth } from '../auth-context'

const NAV_ITEMS = [
  { to: '/',            label: '行程',    labelEng: 'Schedule',    Icon: CalendarDays },
  { to: '/my-schedule', label: '我的行程', labelEng: 'My Schedule', Icon: BookMarked  },
  { to: '/my-info',     label: '我的資訊', labelEng: 'My Info',     Icon: User         },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const { token, person, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const displayName = person?.chineseName || (person ? `${person.firstName} ${person.lastName}` : '')

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {token && (
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200 flex items-center justify-between px-4 py-2.5">
          <span className="text-sm font-medium text-gray-700">{displayName}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-600 transition-colors py-1 px-2 rounded-lg hover:bg-red-50"
          >
            <LogOut size={14} />
            登出
          </button>
        </header>
      )}

      <main className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))]">
        {children}
      </main>

      {token && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50 pb-[env(safe-area-inset-bottom)]">
          {NAV_ITEMS.map(({ to, label, labelEng, Icon }) => {
            const isActive = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to)
            return (
              <NavLink
                key={to}
                to={to}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className="font-medium">{label}</span>
                <span className="hidden sm:block text-[10px] text-gray-400 leading-none">{labelEng}</span>
              </NavLink>
            )
          })}
        </nav>
      )}
    </div>
  )
}
