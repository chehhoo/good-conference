import { useEffect, useRef } from 'react'
import QRCode from 'react-qr-code'
import { X } from 'lucide-react'

interface Props {
  url: string
  onClose: () => void
}

export default function ShareModal({ url, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xs p-6 flex flex-col items-center gap-4">
        <div className="w-full flex items-center justify-between">
          <div>
            <p className="font-semibold text-gray-900 text-base">分享大會</p>
            <p className="text-xs text-gray-400">Share Conference App</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
          <QRCode value={url} size={200} />
        </div>

        <p className="text-xs text-gray-400 text-center break-all">{url}</p>

        <p className="text-xs text-gray-500 text-center">
          掃描 QR code 即可打開大會行程
          <br />
          <span className="text-gray-400">Scan to open the conference schedule</span>
        </p>
      </div>
    </div>
  )
}
