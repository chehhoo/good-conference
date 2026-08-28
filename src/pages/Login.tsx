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

  const [contact, setContact] = useState('')
  const [channel, setChannel] = useState<'EMAIL' | 'SMS'>('EMAIL')
  const [masked, setMasked] = useState('')
  const [code, setCode] = useState('')

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
    <div className="min-h-screen flex flex-col items-center justify-center px-4"
      style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-sm">

        {/* Logo + title */}
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="Good Vessel" className="w-16 h-16 rounded-2xl mx-auto mb-4" />
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--text)' }}>大會入口</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-dim)' }}>Conference Portal</p>
          <p className="text-xs font-semibold mt-1 tracking-wide" style={{ color: 'var(--text-dim)' }}>
            {import.meta.env.VITE_CONFERENCE_NAME ?? '中國福音大會 2026'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-3xl p-6 space-y-4 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

          {/* ── OTP: enter contact ── */}
          {mode === 'otp-contact' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-mid)' }}>
                  電子郵件 Email
                </label>
                <input
                  type="text"
                  inputMode="email"
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  placeholder="例如：you@email.com"
                  required
                  autoFocus
                  className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none"
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              {error && (
                <p className="text-sm rounded-xl px-3 py-2"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Mail size={16} />}
                發送驗證碼 Send Code
              </button>
            </form>
          )}

          {/* ── OTP: enter code ── */}
          {mode === 'otp-code' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center text-sm rounded-2xl px-3 py-3"
                style={{ background: 'var(--surface2)', color: 'var(--text-mid)' }}>
                {channel === 'SMS'
                  ? <span className="flex items-center justify-center gap-1.5"><Phone size={14} /> 驗證碼已發送至 {masked}</span>
                  : <span className="flex items-center justify-center gap-1.5"><Mail size={14} /> 驗證碼已發送至 {masked}</span>
                }
                <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>Code sent to {masked}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-mid)' }}>
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
                  className="w-full px-4 py-3 rounded-2xl text-xl font-mono text-center tracking-[0.4em] focus:outline-none"
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              {error && (
                <p className="text-sm rounded-xl px-3 py-2"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full py-3 px-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                驗證 Verify
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setCode('')
                  setError('')
                  setLoading(true)
                  try {
                    const result = await otpApi.send(contact.trim())
                    setChannel(result.channel as 'EMAIL' | 'SMS')
                    setMasked(result.maskedDestination)
                  } catch {
                    setError('重新發送失敗，請稍後再試。')
                  } finally {
                    setLoading(false)
                  }
                }}
                className="w-full text-sm text-center py-2 rounded-xl transition-colors"
                style={{ color: 'var(--text-dim)' }}
              >
                重新發送 Resend code
              </button>
            </form>
          )}

          {/* ── Registration code ── */}
          {mode === 'reg-code' && (
            <form onSubmit={handleRegLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-mid)' }}>
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
                  className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none"
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-mid)' }}>
                  姓氏 Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="例如：Chen"
                  required
                  className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none"
                  style={{
                    background: 'var(--surface2)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                  }}
                />
              </div>

              {error && (
                <p className="text-sm rounded-xl px-3 py-2"
                  style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                登入 Sign In
              </button>
            </form>
          )}
        </div>

        {/* Mode toggles */}
        <div className="text-center mt-5 space-y-2">
          {mode !== 'otp-contact' && mode !== 'otp-code' && (
            <p>
              <button onClick={() => switchMode('otp-contact')}
                className="text-sm font-semibold"
                style={{ color: 'var(--accent)' }}>
                用電子郵件登入 Sign in with email
              </button>
            </p>
          )}
          {mode !== 'reg-code' && (
            <p>
              <button onClick={() => switchMode('reg-code')}
                className="text-sm"
                style={{ color: 'var(--text-dim)' }}>
                用報名號碼登入 Use registration code
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  )
}
