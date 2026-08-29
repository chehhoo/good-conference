import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, MessageSquare, Check } from 'lucide-react'
import { myApi } from '../api/client'

/**
 * SMS opt-in for attendees.
 *
 * Most attendees arrive through a CSV import, which carries a phone number but
 * no consent — a number on a roster is not permission to message it. This is
 * where that consent can be given by the person themselves, after they have
 * signed in by email.
 *
 * The disclosure text below is not decorative. Carriers check for the brand,
 * message frequency, data rates, and the STOP/HELP keywords, and it must match
 * the wording registered with the carrier. Keep it in step with the
 * registration form in good-register if either changes.
 */
export function SmsOptIn() {
  const qc = useQueryClient()
  const [phone, setPhone] = useState('')
  const [checked, setChecked] = useState(false)
  const [error, setError] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['sms-consent'],
    queryFn: myApi.smsConsent,
  })

  const save = useMutation({
    mutationFn: (opts: { consent: boolean; phone?: string }) =>
      myApi.setSmsConsent(opts.consent, opts.phone),
    onSuccess: () => {
      setError('')
      setPhone('')
      setChecked(false)
      qc.invalidateQueries({ queryKey: ['sms-consent'] })
    },
    onError: (e: unknown) => {
      const err = e as { response?: { data?: { error?: string } } }
      setError(err.response?.data?.error ?? '無法儲存，請稍後再試。Could not save, please try again.')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-dim)' }}>
        <Loader2 size={14} className="animate-spin" /> 載入中…
      </div>
    )
  }

  const digits = phone.replace(/\D/g, '')
  const phoneUsable = digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))
  const canSubmit = checked && (phoneUsable || !!data?.mobilePhoneMasked)

  // Already opted in — show state and a way out, nothing more.
  if (data?.smsConsent) {
    return (
      <div className="rounded-2xl p-4" style={{ background: 'var(--surface2)' }}>
        <div className="flex items-center gap-2 mb-2">
          <Check size={16} style={{ color: 'var(--gold)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            已開啟簡訊登入 SMS sign-in enabled
          </span>
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
          驗證碼將發送至 {data.mobilePhoneMasked ?? '您的手機'}。
          <span className="block mt-1">
            Codes will be sent to {data.mobilePhoneMasked ?? 'your mobile'}. You can also reply STOP
            to any message to opt out.
          </span>
        </p>
        <button
          onClick={() => save.mutate({ consent: false })}
          disabled={save.isPending}
          className="text-xs font-semibold underline disabled:opacity-50"
          style={{ color: 'var(--text-mid)' }}
        >
          {save.isPending ? '處理中…' : '取消接收簡訊 Turn off SMS'}
        </button>
        {error && <p className="text-xs mt-2" style={{ color: '#F56565' }}>{error}</p>}
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-4" style={{ background: 'var(--surface2)' }}>
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={16} style={{ color: 'var(--accent)' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
          用手機接收登入驗證碼 Get sign-in codes by text
        </span>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-dim)' }}>
        您目前使用電子郵件接收驗證碼。若要改用簡訊，請填寫手機號碼並勾選下方同意項。此為選填。
        <span className="block mt-1">
          You currently receive codes by email. To use SMS instead, add your mobile number and check
          the box below. This is optional.
        </span>
      </p>

      <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text-mid)' }}>
        手機號碼 Mobile number {data?.mobilePhoneMasked && (
          <span className="font-normal" style={{ color: 'var(--text-dim)' }}>
            （目前 {data.mobilePhoneMasked}，留空即沿用）
          </span>
        )}
      </label>
      <input
        type="tel"
        inputMode="tel"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        placeholder="(555) 123-4567"
        className="w-full px-3 py-2 rounded-xl text-sm mb-3 focus:outline-none"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          color: 'var(--text)',
        }}
      />

      {/* Unchecked by default and separate from any other agreement. The four
          disclosures below are what carriers verify. */}
      <label className="flex items-start gap-2 text-xs leading-relaxed cursor-pointer mb-3"
             style={{ color: 'var(--text-dim)' }}>
        <input
          type="checkbox"
          className="mt-0.5 shrink-0"
          checked={checked}
          onChange={e => setChecked(e.target.checked)}
        />
        <span>
          勾選即表示您同意接收來自 <strong>Good Vessel</strong> 的一次性密碼及驗證碼簡訊。
          訊息頻率不定，可能產生訊息及數據費用。回覆 HELP 取得協助，回覆 STOP 取消接收。
          <span className="block mt-1">
            By checking, you consent to receive one-time passcodes and verification codes from{' '}
            <strong>Good Vessel</strong>. Message frequency may vary. Message and data rates may
            apply. Reply HELP for help or STOP to opt-out. Consent is optional.
          </span>
        </span>
      </label>

      <button
        onClick={() => save.mutate({ consent: true, phone: phoneUsable ? phone : undefined })}
        disabled={!canSubmit || save.isPending}
        className="w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-40"
        style={{ background: 'var(--accent)', color: '#0B1020' }}
      >
        {save.isPending ? '儲存中…' : '儲存 Save'}
      </button>

      {checked && !phoneUsable && !data?.mobilePhoneMasked && (
        <p className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
          請輸入 10 位數手機號碼。Enter a 10-digit mobile number.
        </p>
      )}
      {error && <p className="text-xs mt-2" style={{ color: '#F56565' }}>{error}</p>}
    </div>
  )
}
