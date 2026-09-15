import { useState, useCallback } from 'react'
import { usePageTitle } from '../hooks/usePageTitle'
import QRCode from 'react-qr-code'
import { QrCode, Maximize2 } from 'lucide-react'
import { useAuth } from '../auth-context'
import BadgeOverlay from '../components/BadgeOverlay'

export default function MyQR() {
  usePageTitle('我的 QR 碼', 'My QR Code')
  const { person } = useAuth()
  const displayName = person?.chineseName || (person ? `${person.firstName} ${person.lastName}` : '')
  const uid = person?.uid || (person ? String(person.id) : null)
  const [badgeOpen, setBadgeOpen] = useState(false)
  const openBadge = useCallback(() => setBadgeOpen(true), [])
  const closeBadge = useCallback(() => setBadgeOpen(false), [])

  return (
    <>
      {badgeOpen && uid && <BadgeOverlay uid={uid} displayName={displayName} onClose={closeBadge} />}

      <div className="max-w-sm mx-auto px-4 py-6 flex flex-col items-center gap-5">
        <div className="w-full rounded-3xl p-6 flex flex-col items-center gap-4 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide uppercase"
            style={{ color: 'var(--text-dim)' }}>
            <QrCode size={14} />
            入場 QR · Check-in Code
          </div>

          {uid ? (
            <div className="p-3 bg-white rounded-2xl">
              <QRCode value={uid} size={220} />
            </div>
          ) : (
            <div className="w-[220px] h-[220px] rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--surface2)' }}>
              <span className="text-sm text-center px-4" style={{ color: 'var(--text-dim)' }}>尚未分配 QR 碼</span>
            </div>
          )}

          <div className="text-center">
            <p className="text-lg font-black" style={{ color: 'var(--text)' }}>{displayName}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>出示此碼給工作人員掃描 · Show to staff</p>
          </div>

          {uid && (
            <button
              onClick={openBadge}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold w-full justify-center"
              style={{ background: 'var(--accent)', color: '#fff' }}>
              <Maximize2 size={15} />
              顯示大碼 · Show Full Badge
            </button>
          )}
        </div>

        <p className="text-xs text-center px-4" style={{ color: 'var(--text-dim)' }}>
          工作人員會掃描此碼為您報到或取餐。<br />
          Staff will scan this code for check-in and meal pickup.
        </p>
      </div>
    </>
  )
}
