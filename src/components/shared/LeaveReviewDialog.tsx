'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2, PenLine, Star } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import LoginDialog from '@/components/LoginDialog'
import { cn } from '@/lib/utils'
import { REVIEW_CONFIG, REVIEW_MAX_TEXT as MAX_TEXT, type ReviewKind } from '@/lib/reviews'

// app parity: components/LeaveReviewModal.jsx — one aspect per step; the
// last step submits the whole review.
interface Props {
  kind: ReviewKind
  entityId: string
  entityName: string
  className?: string
}

export function LeaveReviewDialog({ kind, entityId, entityName, className }: Props) {
  const router = useRouter()
  const steps = REVIEW_CONFIG[kind].steps
  // Fetched client-side so the detail pages don't have to read auth cookies.
  const [viewer, setViewer] = useState({ loggedIn: false, reviewed: false })

  const loadViewer = useCallback(() => {
    fetch(`/api/reviews/${kind}?entityId=${encodeURIComponent(entityId)}`)
      .then(res => (res.ok ? res.json() : null))
      .then((data: { loggedIn?: boolean; reviewed?: boolean } | null) => {
        if (data) setViewer({ loggedIn: !!data.loggedIn, reviewed: !!data.reviewed })
      })
      .catch(() => {})
  }, [kind, entityId])

  useEffect(() => {
    loadViewer()
    window.addEventListener('pp:auth', loadViewer)
    return () => window.removeEventListener('pp:auth', loadViewer)
  }, [loadViewer])

  const [open, setOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [hover, setHover] = useState(0)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<null | { approved: boolean }>(null)

  const current = steps[step]
  const currentRating = ratings[current.key] ?? 0
  const isLast = step === steps.length - 1

  function start() {
    if (!viewer.loggedIn) { setLoginOpen(true); return }
    setStep(0)
    setRatings({})
    setHover(0)
    setText('')
    setError('')
    setDone(null)
    setOpen(true)
  }

  function close() {
    if (submitting) return
    setOpen(false)
    if (done) { loadViewer(); router.refresh() }
  }

  async function next() {
    if (!currentRating || submitting) return
    if (!isLast) { setStep(step + 1); setHover(0); return }

    setSubmitting(true)
    setError('')
    const res = await fetch(`/api/reviews/${kind}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityId, ratings, text }),
    })
    const data = (await res.json().catch(() => ({}))) as { error?: string; approved?: boolean }
    setSubmitting(false)
    if (!res.ok) { setError(data.error ?? 'Could not submit your review. Please try again.'); return }
    setDone({ approved: data.approved === true })
  }

  if (viewer.reviewed && !open) {
    return (
      <p className={cn('inline-flex items-center gap-1.5 text-[13px] font-semibold text-green-700', className)}>
        <CheckCircle2 className="h-4 w-4" /> You’ve reviewed this place
      </p>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        className={cn(
          'inline-flex h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-brand px-5 text-[14px] font-semibold text-brand transition-colors hover:bg-brand-tint',
          className,
        )}
      >
        <PenLine className="h-4 w-4" /> Write a review
      </button>

      <LoginDialog hideTrigger open={loginOpen} onOpenChange={setLoginOpen} />

      <Dialog open={open} onOpenChange={o => (o ? setOpen(true) : close())}>
        <DialogContent className="gap-0 rounded-[27px] bg-white p-6 font-(family-name:--font-dm-sans) sm:max-w-[440px]">
          {done ? (
            <div className="flex flex-col items-center py-4 text-center">
              <CheckCircle2 className="h-14 w-14 text-green-600" />
              <DialogTitle className="mt-4 text-[20px] font-bold text-[#1A1325]">Thanks for your review!</DialogTitle>
              <DialogDescription className="mt-2 text-[14px] leading-5 text-[#7A7086]">
                {done.approved
                  ? `Your review of ${entityName} is now live.`
                  : `Your review of ${entityName} was submitted and will appear once it's approved.`}
              </DialogDescription>
              <button
                type="button"
                onClick={close}
                className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-dark"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              <div className="text-center">
                <DialogTitle className="text-[20px] font-bold text-[#1A1325]">Leave a review</DialogTitle>
                <DialogDescription className="mt-1 text-[14px] text-[#7A7086]">{entityName}</DialogDescription>
              </div>

              <div className="mt-5 flex justify-center gap-1.5" aria-hidden>
                {steps.map((s, i) => (
                  <span key={s.key} className={cn('h-1 w-8 rounded-full', i <= step ? 'bg-brand' : 'bg-[#E5E5EA]')} />
                ))}
              </div>

              <p className="mt-6 text-center text-[17px] font-semibold text-[#252427]">How was the {current.label}?</p>
              <div
                role="radiogroup"
                aria-label={`${current.label} rating`}
                className="mt-4 flex justify-center gap-2"
                onMouseLeave={() => setHover(0)}
              >
                {[1, 2, 3, 4, 5].map(n => {
                  const active = n <= (hover || currentRating)
                  return (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={currentRating === n}
                      aria-label={`${n} star${n > 1 ? 's' : ''}`}
                      onMouseEnter={() => setHover(n)}
                      onClick={() => setRatings(r => ({ ...r, [current.key]: n }))}
                      className="rounded-full p-1 transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                    >
                      <Star
                        strokeWidth={1.5}
                        className={cn('h-10 w-10', active ? 'fill-brand text-brand' : 'fill-transparent text-[#D5D5D5]')}
                      />
                    </button>
                  )
                })}
              </div>

              {step === 0 && (
                <div className="mt-5">
                  <textarea
                    value={text}
                    onChange={e => setText(e.target.value.slice(0, MAX_TEXT))}
                    rows={4}
                    aria-label="Your review"
                    placeholder="Share your experience..."
                    className="w-full resize-none rounded-2xl border border-[#E5E5EA] p-3.5 text-[14px] text-[#1A1325] outline-none placeholder:text-[#8E8E93] focus:border-brand"
                  />
                  <p className="mt-1 text-right text-[11px] text-[#8E8E93]">{text.length}/{MAX_TEXT}</p>
                </div>
              )}

              {error && <p className="mt-4 text-center text-[13px] font-semibold text-[#E23B3B]">{error}</p>}

              <div className="mt-6 flex gap-3">
                {step > 0 && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => { setStep(step - 1); setHover(0); setError('') }}
                    className="flex h-12 flex-1 items-center justify-center rounded-full border-[1.5px] border-gray-300 text-[15px] font-semibold text-[#2C2D32] transition-colors hover:bg-gray-50 disabled:opacity-60"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  disabled={!currentRating || submitting}
                  onClick={next}
                  className="flex h-12 flex-[2] items-center justify-center gap-2 rounded-full bg-brand text-[15px] font-semibold text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:bg-[#D5D5D5]"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isLast ? 'Submit Review' : 'Continue'}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
