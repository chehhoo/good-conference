import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { isAxiosError } from 'axios'
import { Loader2, Mail, Phone, KeyRound } from 'lucide-react'
import { conferenceApi, otpApi } from '../api/client'
import { useAuth } from '../auth-context'

type Mode = 'otp-contact' | 'otp-code' | 'reg-code'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [mode, setMode] = useState<Mode>('otp-contact')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // OTP flow state
  const [contact, setContact] = useState('')
  const [channel, setChannel] = useState<'EMAIL' | 'SMS'>('EMAIL')
  const [masked, setMasked] = useState('')
  const [code, setCode] = useState('')

  // Registration-code flow state
  const [regCode, setRegCode] = useState('')
  const [lastName, setLastName] = useState('')

  async function handleSendOtp(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await otpApi.send(contact.trim())
      setChannel(result.channel as 'EMAIL' | 'SMS')
      setMasked(result.maskedDestination)
      setMode('otp-code')
    } catch (err) {
      const msg = isAxiosError(err) ? err.response?.data?.message ?? err.response?.data?.error : undefined
      setError(msg ?? '找不到此帳號，請確認輸入。')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, person } = await otpApi.verify(contact.trim(), code.trim())
      login(token, person)
      navigate('/', { replace: true })
    } catch (err) {
      const msg = isAxiosError(err) ? err.response?.data?.message ?? err.response?.data?.error : undefined
      setError(msg ?? '驗證碼錯誤，請再試一次。')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegLogin(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token, person } = await conferenceApi.login(regCode.trim(), lastName.trim())
      login(token, person)
      navigate('/', { replace: true })
    } catch (err) {
      const msg = isAxiosError(err) ? err.response?.data?.error : undefined
      setError(msg ?? '登入失敗，請確認報名號碼和姓氏。')
    } finally {
      setLoading(false)
    }
  }

  function switchMode(next: Mode) {
    setError('')
    setMode(next)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-900 mb-4">
            <span className="text-white text-2xl font-bold">GV</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">大會入口</h1>
          <p className="text-gray-500 text-sm mt-1">Conference Portal</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">

          {/* ── Step 1: enter phone or email ─────────────────────── */}
          {mode === 'otp-contact' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話或電子郵件 Phone or Email
                </label>
                <input
                  type="text"
                  inputMode="email"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder="例如：(555) 123-4567 或 you@email.com"
                  required
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-brand-900 text-white font-medium text-sm hover:bg-brand-800 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                發送驗證碼 Send Code
              </button>
            </form>
          )}

          {/* ── Step 2: enter OTP ────────────────────────────────── */}
          {mode === 'otp-code' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center text-sm text-gray-600 bg-blue-50 rounded-lg px-3 py-3">
                {channel === 'SMS'
                  ? <span className="flex items-center justify-center gap-1.5"><Phone size={14} /> 驗證碼已發送至 {masked}</span>
                  : <span className="flex items-center justify-center gap-1.5"><Mail size={14} /> 驗證碼已發送至 {masked}</span>
                }
                <p className="text-xs text-gray-400 mt-1">Code sent to {masked}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  驗證碼 Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="6 位數字"
                  required
                  autoFocus
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-center tracking-widest text-lg font-mono focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-2.5 px-4 rounded-lg bg-brand-900 text-white font-medium text-sm hover:bg-brand-800 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                驗證 Verify
              </button>

              <button
                type="button"
                onClick={() => { setCode(''); setError(''); setMode('otp-contact') }}
                className="w-full text-sm text-gray-500 hover:text-gray-700 text-center"
              >
                重新發送 Resend code
              </button>
            </form>
          )}

          {/* ── Registration code fallback ───────────────────────── */}
          {mode === 'reg-code' && (
            <form onSubmit={handleRegLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  報名號碼 Registration Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={regCode}
                  onChange={e => setRegCode(e.target.value)}
                  placeholder="例如：10001"
                  required
                  autoFocus
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

              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-brand-900 text-white font-medium text-sm hover:bg-brand-800 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                登入 Sign In
              </button>
            </form>
          )}
        </div>

        {/* Mode toggle */}
        <div className="text-center mt-4 text-xs text-gray-400 space-y-1">
          {mode !== 'otp-contact' && mode !== 'otp-code' && (
            <p>
              <button onClick={() => switchMode('otp-contact')} className="text-brand-700 hover:underline">
                用電話或電子郵件登入 Sign in with phone or email
              </button>
            </p>
          )}
          {mode !== 'reg-code' && (
            <p>
              <button onClick={() => switchMode('reg-code')} className="hover:underline">
                用報名號碼登入 Use registration code
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
