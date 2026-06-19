import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './auth-context'
import Layout from './components/Layout'
import Schedule from './pages/Schedule'
import MySchedule from './pages/MySchedule'
import MyInfo from './pages/MyInfo'
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
                  <Route path="/" element={<Schedule />} />
                  <Route path="/my-schedule" element={<MySchedule />} />
                  <Route path="/my-info" element={<MyInfo />} />
                </Routes>
              </Layout>
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
