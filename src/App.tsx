import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth-context'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Schedule from './pages/Schedule'
import MyInfo from './pages/MyInfo'
import MyQR from './pages/MyQR'
import Meals from './pages/Meals'
import Map from './pages/Map'
import Login from './pages/Login'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/my-qr" element={<MyQR />} />
                  <Route path="/meals" element={<Meals />} />
                  <Route path="/map" element={<Map />} />
                  <Route path="/my-info" element={<MyInfo />} />
                  {/* legacy redirect */}
                  <Route path="/my-schedule" element={<Navigate to="/schedule" replace />} />
                </Routes>
              </Layout>
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
