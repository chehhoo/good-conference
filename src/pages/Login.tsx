import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Loader2 } from 'lucide-react'
import { conferenceApi } from '../api/client'
import { useAuth } from '../auth-context'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [code, setCode] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, person } = await conferenceApi.login(code.trim(), lastName.trim())
      login(token, person)
      navigate('/', { replace: true })
    } catch (err) {
      const msg = isAxiosError(err) ? err.response?.data?.error : undefined
      setError(msg ?? '登入失敗，請確認報名號碼和姓氏。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-900 mb-4">
            <span className="text-white text-2xl font-bold">GV</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">大會入口</h1>
          <p className="text-gray-500 text-sm mt-1">Conference Portal</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              報名號碼 Registration Code
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="例如：10001"
              required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓氏 Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="例如：Chen"
              required
              className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-lg bg-brand-900 text-white font-medium text-sm hover:bg-brand-800 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            登入 Sign In
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          報名號碼可在確認信中找到
          <br />
          Your registration code is in your confirmation email
        </p>
      </div>
    </div>
  )
}
