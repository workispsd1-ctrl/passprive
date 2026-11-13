'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { TYPE_SCALE, t, tMin } from '@/components/sections/dining/designUnit'
import { CheckCircle2, ChevronRight, Image as ImageIcon, Loader2, PenLine, Star, X } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import LoginDialog from '@/components/LoginDialog'
import { cn } from '@/lib/utils'
import { REVIEW_MAX_TEXT as MAX_TEXT, overallRating, reviewSteps, usesAspectRatings, type ReviewAspect, type ReviewKind } from '@/lib/reviews'
import { REVIEW_PHOTO_MAX, shrinkPhoto } from '@/lib/reviewPhotos'
import { ReviewImagePicker } from './ReviewImagePicker'

// Figma "Leave a review" card (text and images) with the app's three aspect ratings
// (LeaveReviewModal: Food / Service / Ambience, relabelled per kind); tourist places rate once.
interface Props {
  kind: ReviewKind
  entityId: string
  entityName: string
  className?: string
  /** 'field' — the restaurant page's "Leave a review" pill (pencil, label, chevron) */
  /** 'add-image' — the photos section's pill; opens straight on Add image(s), as part of a review */
  variant?: 'button' | 'field' | 'figma' | 'add-image'
  /** what the three ratings are called — wellness stores are kind 'store' with their own labels */
  aspect?: ReviewAspect
}

export function LeaveReviewDialog({ kind, entityId, entityName, className, variant = 'button', aspect }: Props) {
  // tourist places: one overall rating, sent as `rating`
  const steps = usesAspectRatings(kind) ? reviewSteps(kind, aspect) : [{ key: 'rating', label: '', column: null }]
  const router = useRouter()
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
  const [view, setView] = useState<'form' | 'images'>('form')
  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [hover, setHover] = useState<{ key: string; n: number } | null>(null)
  const allRated = steps.every(step => (ratings[step.key] ?? 0) > 0)
  const anyRated = steps.some(step => (ratings[step.key] ?? 0) > 0)
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState<{ file: File; url: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState<null | { approved: boolean; photosSaved: boolean }>(null)

  function clearPhotos() {
    setPhotos(list => {
      list.forEach(p => URL.revokeObjectURL(p.url))
      return []
    })
  }

  function start(first: 'form' | 'images' = 'form') {
    if (!viewer.loggedIn) { setLoginOpen(true); return }
    setView(first)
    setRatings({})
    setHover(null)
    setText('')
    clearPhotos()
    setError('')
    setDone(null)
    setOpen(true)
  }

  function close() {
    if (submitting) return
    setOpen(false)
    if (done) { loadViewer(); router.refresh() }
  }

  function addPhotos(files: File[]) {
    setPhotos(list => [...list, ...files.map(file => ({ file, url: URL.createObjectURL(file) }))].slice(0, REVIEW_PHOTO_MAX))
    setView('form')
  }

  function removePhoto(url: string) {
    URL.revokeObjectURL(url)
    setPhotos(list => list.filter(p => p.url !== url))
  }

  async function submit() {
    if (!allRated || submitting) return
    setSubmitting(true)
    setError('')
    const form = new FormData()
    form.set('entityId', entityId)
    for (const step of steps) form.set(step.key, String(ratings[step.key]))
    form.set('text', text)
    for (const photo of await Promise.all(photos.map(p => shrinkPhoto(p.file)))) form.append('photos', photo)
    const res = await fetch(`/api/reviews/${kind}`, { method: 'POST', body: form }).catch(() => null)
    const data = (await res?.json().catch(() => ({}))) as { error?: string; approved?: boolean; photosSaved?: boolean } | undefined
    setSubmitting(false)
    if (!res?.ok) { setError(data?.error ?? 'Could not submit your review. Please try again.'); return }
    setDone({ approved: data?.approved === true, photosSaved: data?.photosSaved !== false })
  }

  if (viewer.reviewed && !open) {
    if (variant === 'add-image') return null
    return (
      <p className={cn('inline-flex items-center gap-1.5 text-[13px] font-semibold text-green-700', className)}>
        <CheckCircle2 className="h-4 w-4" /> You’ve reviewed this place
      </p>
    )
  }

  return (
    <>
      {variant === 'add-image' ? (
        <button
          type="button"
          onClick={() => start('images')}
          // css.txt "Group 2085664820": 300×43.75, 1.25 #E5E5E5, radius 24.62, 14.22/20 regular
          className={cn('flex items-center justify-between border-solid border-[#e5e5e5] bg-white text-[#252427] hover:bg-gray-50', className)}
          style={{ width: tMin(300, 180), height: tMin(43.75, 34), borderWidth: 1.25, borderRadius: t(24.62), padding: `0 ${tMin(12, 10)} 0 ${tMin(17.5, 12)}`, gap: 8, fontSize: tMin(14.22, 12), lineHeight: tMin(20, 16) }}
        >
          <span className="flex items-center" style={{ gap: tMin(9.5, 8) }}>
            <ImageIcon className="shrink-0 text-[#6B686D]" strokeWidth={1.5} style={{ width: tMin(21, 14), height: tMin(21, 14) }} /> Add image
          </span>
          <ChevronRight className="shrink-0 text-[#666]" style={{ width: tMin(18, 14), height: tMin(18, 14) }} />
        </button>
      ) : variant === 'figma' ? (
        // desktop restaurant page — Figma "Leave a review" pill, in design units
        <button
          type="button"
          onClick={() => start()}
          // css.txt "Group 2085664795": 320×44, 1.25 #E5E5E5, radius 24.62; the 30.73×30 #E5E5E5 pencil disc; 14.22/20 regular
          className={cn('flex items-center border-solid border-[#e5e5e5] bg-white text-left text-[#252427] transition-colors hover:border-[#cfcfcf]', className)}
          style={{ width: tMin(320, 200), height: tMin(44, 36), borderWidth: 1.25, borderRadius: t(24.62), paddingLeft: tMin(8.75, 4), paddingRight: tMin(17, 12), gap: tMin(11.5, 8), fontSize: tMin(14.22, 12), lineHeight: tMin(20, 16) }}
        >
          <span className="flex shrink-0 items-center justify-center rounded-full bg-[#e5e5e5]" style={{ width: tMin(30.73, 26), height: tMin(30, 25) }}>
            <Image src="/assets/merchant-detail/pencil.svg" alt="" width={24} height={24} style={{ width: tMin(16, 13), height: tMin(16, 13) }} />
          </span>
          <span className="flex-1">Leave a review</span>
          {/* the frame's vector is a "<" turned 180° */}
          <Image src="/assets/merchant-detail/chevron-right.svg" alt="" width={12} height={24} className="rotate-180" style={{ width: tMin(7, 6), height: tMin(14, 12) }} />
        </button>
      ) : variant === 'field' ? (
        <button
          type="button"
          onClick={() => start()}
          className={cn(
            'flex h-12 items-center gap-3 rounded-full border border-[#E2E2E2] bg-white pr-4 pl-1.5 text-left text-[14px] text-[#5B5A5A] transition-colors hover:border-[#C9C9C9]',
            className,
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#EDEDED]">
            <PenLine className="h-4 w-4 text-[#5B5A5A]" />
          </span>
          <span className="flex-1">Leave a review</span>
          <ChevronRight className="h-4.5 w-4.5 text-[#5B5A5A]" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => start()}
          className={cn(
            'inline-flex h-11 items-center justify-center gap-2 rounded-full border-[1.5px] border-brand px-5 text-[14px] font-semibold text-brand transition-colors hover:bg-brand-tint',
            className,
          )}
        >
          <PenLine className="h-4 w-4" /> Write a review
        </button>
      )}

      <LoginDialog hideTrigger open={loginOpen} onOpenChange={setLoginOpen} />

      <Dialog open={open} onOpenChange={o => (o ? setOpen(true) : close())}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            'grid-cols-[minmax(0,1fr)] gap-0 bg-white font-(family-name:--font-dm-sans) ring-0 [--t:0.8px]',
            TYPE_SCALE,
            view === 'images' && !done
              ? 'shadow-[0_12px_32px_rgba(0,0,0,0.102)] sm:max-w-[max(320px,calc(480*var(--t)))]'
              : 'shadow-[0_4px_12px_rgba(0,0,0,0.08)] sm:max-w-[max(360px,calc(560*var(--t)))]',
          )}
          // the spec's px are for a 1920 screen; `--t` scales them with the breakpoint
          style={
            view === 'images' && !done
              ? { borderRadius: t(24), padding: t(32) }
              : { borderRadius: t(24), padding: `${t(32)} ${t(40)} ${t(40)}` }
          }
        >
          {done ? (
            <div className="flex flex-col items-center py-4 text-center">
              <CheckCircle2 className="h-14 w-14 text-green-600" />
              <DialogTitle className="mt-4 text-[20px] font-bold text-[#1A1325]">Thanks for your review!</DialogTitle>
              <DialogDescription className="mt-2 text-[14px] leading-5 text-[#7A7086]">
                {done.approved
                  ? `Your review of ${entityName} is now live.`
                  : `Your review of ${entityName} was submitted and will appear once it's approved.`}
                {!done.photosSaved && ' We couldn’t save your images, so it went without them.'}
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
            view === 'images' ? (
              <ReviewImagePicker
                remaining={REVIEW_PHOTO_MAX - photos.length}
                onAdd={addPhotos}
                onCancel={() => setView('form')}
              />
            ) : (
            <>
              <div className="flex items-start justify-between gap-3" style={{ minHeight: t(60) }}>
                <div className="flex min-w-0 flex-col" style={{ gap: t(4) }}>
                  <DialogTitle className="font-bold text-[#1D1B20]" style={{ fontSize: tMin(24, 17), lineHeight: 1.33 }}>Leave a review</DialogTitle>
                  <DialogDescription className="font-medium wrap-break-word text-[#8E8E93]" style={{ fontSize: tMin(16, 13), lineHeight: 1.5 }}>{entityName}</DialogDescription>
                </div>
                <button type="button" onClick={close} aria-label="Close" className="flex shrink-0 items-center justify-center rounded-full text-[#404045] hover:bg-gray-100" style={{ width: tMin(32, 24), height: tMin(32, 24) }}>
                  <X className="size-full" strokeWidth={1.5} />
                </button>
              </div>

              {/* app parity: LeaveReviewModal — one star row per aspect; the overall is their average */}
              <div className="flex flex-col" style={{ marginTop: t(24), gap: t(16) }}>
                {steps.map(step => {
                  const value = ratings[step.key] ?? 0
                  const shown = hover?.key === step.key ? hover.n : value
                  return (
                    <div key={step.key} className="flex flex-col items-center" style={{ gap: t(8) }}>
                      {step.label && (
                        <p className="font-semibold text-[#1D1B20]" style={{ fontSize: tMin(16, 13), lineHeight: 1.5 }}>How was the {step.label}?</p>
                      )}
                      <div
                        role="radiogroup"
                        aria-label={step.label ? `${step.label} rating` : 'Your rating'}
                        className="flex justify-center"
                        style={{ gap: t(12) }}
                        onMouseLeave={() => setHover(null)}
                      >
                        {[1, 2, 3, 4, 5].map(n => {
                          const active = n <= shown
                          return (
                            <button
                              key={n}
                              type="button"
                              role="radio"
                              aria-checked={value === n}
                              aria-label={`${n} star${n > 1 ? 's' : ''}`}
                              onMouseEnter={() => setHover({ key: step.key, n })}
                              onClick={() => setRatings(r => ({ ...r, [step.key]: n }))}
                              className="rounded-full transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:outline-none"
                              style={{ width: tMin(32, 24), height: tMin(32, 24) }}
                            >
                              <Star
                                strokeWidth={1.5}
                                className={cn('size-full', active ? 'fill-[#FFB400] text-[#FFB400]' : value ? 'text-[#D5D5D5]' : 'text-[#605D64]')}
                              />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
                {steps.length > 1 && allRated && (
                  <p className="text-center font-medium text-[#5B5A5A]" style={{ fontSize: tMin(14, 12) }}>
                    Overall rating: <span className="font-bold text-[#1D1B20]">{overallRating(steps.map(st => ratings[st.key]))}</span> / 5
                  </p>
                )}
              </div>

              <textarea
                value={text}
                onChange={e => setText(e.target.value.slice(0, MAX_TEXT))}
                aria-label="Your review"
                placeholder="Share your experience..."
                className="w-full resize-none border border-[#D5D5D5] bg-white font-medium text-[#1D1B20] outline-none placeholder:text-[#8E8E93] focus:border-brand"
                style={{ marginTop: t(24), height: t(160), borderRadius: t(24), padding: t(16), fontSize: tMin(14, 12), lineHeight: 1.43 }}
              />

              <div className="flex flex-wrap items-center" style={{ marginTop: t(24), minHeight: tMin(38, 30), gap: t(8) }}>
                {photos.length < REVIEW_PHOTO_MAX && (
                  <button
                    type="button"
                    onClick={() => setView('images')}
                    className="flex items-center border border-[#E5E5E5] bg-[#F5F5F5] font-medium whitespace-nowrap text-[#252427] hover:bg-[#EFEFEF]"
                    style={{ width: tMin(150, 122), height: tMin(38, 30), gap: tMin(12, 8), borderRadius: t(24), paddingInline: tMin(16, 10), fontSize: tMin(14, 12) }}
                  >
                    <ImageIcon className="shrink-0 text-[#6B686D]" strokeWidth={2} style={{ width: tMin(18, 14), height: tMin(18, 14) }} /> Add image(s)
                  </button>
                )}
                {photos.map(photo => (
                  <span key={photo.url} className="relative overflow-hidden rounded-xl bg-gray-100" style={{ width: tMin(38, 30), height: tMin(38, 30) }}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- a local preview of the member's own file */}
                    <img src={photo.url} alt="Your added image" className="size-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePhoto(photo.url)}
                      aria-label="Remove image"
                      className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                    >
                      <X className="size-2.5" />
                    </button>
                  </span>
                ))}
              </div>

              {error && <p role="alert" className="mt-4 text-[13px] font-semibold text-[#E23B3B]">{error}</p>}

              <div className="flex justify-end" style={{ marginTop: t(24), gap: tMin(16, 10) }}>
                {anyRated && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={close}
                    className="flex items-center justify-center border border-[#1D1B20] font-semibold tracking-[-0.02em] text-[#1D1B20] hover:bg-gray-50 disabled:opacity-60"
                    style={{ width: tMin(120, 84), height: tMin(48, 36), borderRadius: t(27), fontSize: tMin(16, 13) }}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="button"
                  disabled={!allRated || submitting}
                  onClick={submit}
                  className="flex items-center justify-center gap-2 bg-[#FF4800] font-semibold tracking-[-0.02em] text-white hover:bg-brand-dark disabled:bg-[#D5D5D5]"
                  style={{ width: tMin(180, 124), height: tMin(48, 36), borderRadius: t(27), fontSize: tMin(16, 13) }}
                >
                  {submitting && <Loader2 className="size-4 animate-spin" />}
                  Submit review
                </button>
              </div>
            </>
            )
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
