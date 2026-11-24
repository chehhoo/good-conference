import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Star, X } from 'lucide-react'
import { scheduleApi } from '../api/client'
import { useLang } from '../lang-context'

interface Props {
  sessionId: number
  sessionTitle: string
  initialRating?: number
  initialComment?: string
  onClose: () => void
  onRated?: (rating: number | null, comment?: string) => void
}

export function StarRatingSheet({ sessionId, sessionTitle, initialRating, initialComment, onClose, onRated }: Props) {
  const { t } = useLang()
  const [hovered, setHovered] = useState(0)
  const [chosen, setChosen] = useState(initialRating ?? 0)
  const [comment, setComment] = useState(initialComment ?? '')
  const [apiError, setApiError] = useState<string | null>(null)

  const rateMutation = useMutation({
    mutationFn: ({ rating, comment }: { rating: number; comment: string }) =>
      scheduleApi.rate(sessionId, rating, comment),
    onSuccess: (_, { rating, comment }) => {
      setChosen(rating)
      onRated?.(rating, comment)
      setTimeout(onClose, 800)
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setApiError(msg ?? t('提交失敗，請再試', 'Submit failed, please retry'))
    },
  })

  const unrateMutation = useMutation({
    mutationFn: () => scheduleApi.unrate(sessionId),
    onSuccess: () => {
      onRated?.(null)
      onClose()
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setApiError(msg ?? t('提交失敗，請再試', 'Submit failed, please retry'))
    },
  })

  const isPending = rateMutation.isPending || unrateMutation.isPending
  const display = hovered || chosen

  const labels: Record<number, [string, string]> = {
    1: ['很差', 'Poor'],
    2: ['普通', 'Fair'],
    3: ['還好', 'Good'],
    4: ['很好', 'Great'],
    5: ['非常好！', 'Excellent!'],
  }

  function handleSubmit() {
    if (!chosen || isPending) return
    setApiError(null)
    rateMutation.mutate({ rating: chosen, comment })
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[70]"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />
      <div
        className="fixed left-0 right-0 bottom-0 z-[80] rounded-t-3xl px-6 pt-5 pb-10"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-1 rounded-full mx-auto" style={{ background: 'var(--border)' }} />
          <button onClick={onClose} style={{ color: 'var(--text-dim)' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs font-bold uppercase tracking-widest mb-1 text-center" style={{ color: 'var(--text-dim)' }}>
          {t('評分此場次', 'Rate this session')}
        </p>
        <p className="text-sm font-bold text-center mb-5 leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>
          {sessionTitle}
        </p>

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-2">
          {[1,2,3,4,5].map(i => (
            <button
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => { setChosen(i); setApiError(null) }}
              disabled={isPending}
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

        <p className="text-center text-sm font-semibold h-5 mb-4" style={{ color: 'var(--gold)' }}>
          {display > 0 ? t(labels[display][0], labels[display][1]) : ''}
        </p>

        {/* Optional comment */}
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value.slice(0, 500))}
          placeholder={t('留下評語（選填）', 'Leave a comment (optional)')}
          rows={2}
          className="w-full rounded-xl px-3 py-2.5 text-sm resize-none mb-4"
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            outline: 'none',
          }}
        />

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={!chosen || isPending}
          className="w-full py-3 rounded-xl text-sm font-bold disabled:opacity-40 mb-3"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          {isPending ? '...' : t('送出評分', 'Submit Rating')}
        </button>

        {/* Remove rating */}
        {initialRating && (
          <button
            onClick={() => { setApiError(null); unrateMutation.mutate() }}
            disabled={isPending}
            className="w-full py-2 text-xs font-bold disabled:opacity-40"
            style={{ color: 'var(--text-dim)' }}
          >
            {t('移除評分', 'Remove my rating')}
          </button>
        )}

        {apiError && (
          <p className="text-center text-xs mt-3" style={{ color: 'var(--accent)' }}>
            {apiError}
          </p>
        )}
      </div>
    </>
  )
}
