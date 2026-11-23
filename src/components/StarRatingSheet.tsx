import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Star, X } from 'lucide-react'
import { scheduleApi } from '../api/client'
import { useLang } from '../lang-context'

interface Props {
  sessionId: number
  sessionTitle: string
  initialRating?: number
  onClose: () => void
  onRated?: (rating: number) => void
}

export function StarRatingSheet({ sessionId, sessionTitle, initialRating, onClose, onRated }: Props) {
  const { t } = useLang()
  const [hovered, setHovered] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const [chosen, setChosen] = useState(initialRating ?? 0)

  const mutation = useMutation({
    mutationFn: (rating: number) => scheduleApi.rate(sessionId, rating),
    onSuccess: (_, rating) => {
      setChosen(rating)
      setSubmitted(true)
      onRated?.(rating)
      setTimeout(onClose, 1200)
    },
  })

  const display = hovered || chosen

  const labels: Record<number, [string, string]> = {
    1: ['很差', 'Poor'],
    2: ['普通', 'Fair'],
    3: ['還好', 'Good'],
    4: ['很好', 'Great'],
    5: ['非常好！', 'Excellent!'],
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[70]"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed left-0 right-0 bottom-0 z-[80] rounded-t-3xl px-6 pt-5 pb-10"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
      >
        {/* Handle + close */}
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-1 rounded-full mx-auto" style={{ background: 'var(--border)' }} />
          <button onClick={onClose} style={{ color: 'var(--text-dim)' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs font-bold uppercase tracking-widest mb-1 text-center" style={{ color: 'var(--text-dim)' }}>
          {t('評分此場次', 'Rate this session')}
        </p>
        <p className="text-sm font-bold text-center mb-6 leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>
          {sessionTitle}
        </p>

        {submitted ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="flex gap-1">
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={28} fill={i <= chosen ? 'var(--gold)' : 'none'} color={i <= chosen ? 'var(--gold)' : 'var(--border)'} />
              ))}
            </div>
            <p className="text-sm font-bold" style={{ color: 'var(--green)' }}>
              {t('感謝您的評分！', 'Thanks for rating!')}
            </p>
          </div>
        ) : (
          <>
            {/* Stars */}
            <div className="flex justify-center gap-3 mb-3">
              {[1,2,3,4,5].map(i => (
                <button
                  key={i}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(0)}
                  onClick={() => mutation.mutate(i)}
                  disabled={mutation.isPending}
                  aria-label={`${i} star`}
                  className="transition-transform active:scale-95 disabled:opacity-50"
                  style={{ transform: hovered >= i ? 'scale(1.15)' : 'scale(1)' }}
                >
                  <Star
                    size={36}
                    fill={display >= i ? 'var(--gold)' : 'none'}
                    color={display >= i ? 'var(--gold)' : 'var(--border)'}
                    strokeWidth={1.5}
                  />
                </button>
              ))}
            </div>

            {/* Label */}
            <p className="text-center text-sm font-semibold h-5" style={{ color: 'var(--gold)' }}>
              {display > 0 ? t(labels[display][0], labels[display][1]) : ''}
            </p>

            {mutation.isError && (
              <p className="text-center text-xs mt-3" style={{ color: 'var(--accent)' }}>
                {t('提交失敗，請再試', 'Submit failed, please retry')}
              </p>
            )}
          </>
        )}
      </div>
    </>
  )
}
