'use client'

import { useState } from 'react'
import { MessageSquareText, Star, ThumbsUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LeaveReviewDialog } from '@/components/shared/LeaveReviewDialog'
import { DetailSection } from './DetailSection'

export type DetailReview = {
  id: string
  rating: number | string
  review_text: string | null
  username_snapshot: string | null
  created_at: string
  liked_tags?: string[] | null
  food_rating?: number | null
  service_rating?: number | null
  ambience_rating?: number | null
}

const ASPECTS = [
  { key: 'food_rating', label: 'Food' },
  { key: 'service_rating', label: 'Service' },
  { key: 'ambience_rating', label: 'Ambience' },
] as const

const PREVIEW = 4

function average(reviews: DetailReview[], key: (typeof ASPECTS)[number]['key']): number | null {
  const vals = reviews.map(r => r[key]).filter((v): v is number => v != null).map(Number)
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
}

function reviewDate(iso: string) {
  const t = Date.parse(iso)
  return Number.isFinite(t)
    ? new Date(t).toLocaleDateString('en-GB', { timeZone: 'Indian/Mauritius', day: 'numeric', month: 'short', year: 'numeric' })
    : ''
}

function Stars({ value, size = 'size-4' }: { value: number; size?: string }) {
  return (
    <span className='flex gap-0.5' aria-hidden='true'>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={cn(size, i <= Math.round(value) ? 'fill-[#1F8A3B] text-[#1F8A3B]' : 'fill-gray-200 text-gray-200')} />
      ))}
    </span>
  )
}

function ReviewCard({ review }: { review: DetailReview }) {
  const [open, setOpen] = useState(false)
  const name = review.username_snapshot?.trim() || 'PassPrivé member'
  const text = review.review_text?.trim()
  const rating = Number(review.rating)
  return (
    <article className='flex w-full flex-col rounded-2xl border border-gray-100 bg-white p-4.5 shadow-[0_2px_12px_rgba(0,0,0,0.04)]'>
      <div className='flex items-center gap-3'>
        <span className='flex size-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-[#FFE3D6] to-[#FFC9B0] text-[14px] font-bold text-[#B33A00]'>
          {name.charAt(0).toUpperCase()}
        </span>
        <div className='min-w-0 flex-1'>
          <p className='truncate text-[14px] font-bold text-gray-900'>{name}</p>
          <p className='text-[12px] text-gray-400'>{reviewDate(review.created_at)}</p>
        </div>
        <span className='inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#1F8A3B] px-2 py-0.5 text-[12.5px] font-bold text-white'>
          {rating.toFixed(1)} <Star className='size-3 fill-white' />
        </span>
      </div>
      {text && (
        <>
          <p className={cn('mt-3 text-[13.5px] leading-6 text-gray-600', !open && 'line-clamp-3')}>{text}</p>
          {text.length > 140 && (
            <button type='button' onClick={() => setOpen(v => !v)} className='mt-1 self-start text-[12.5px] font-semibold text-gray-900 hover:underline'>
              {open ? 'Show less' : 'Read more'}
            </button>
          )}
        </>
      )}
      {(review.liked_tags ?? []).length > 0 && (
        <div className='mt-3 flex flex-wrap items-center gap-1.5'>
          <ThumbsUp className='size-3.5 text-[#1BA94C]' />
          {review.liked_tags!.map(tag => (
            <span key={tag} className='rounded-full bg-[#F0FAF3] px-2 py-0.5 text-[11px] font-medium text-[#167C3B]'>
              {tag}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

/**
 * Ratings & reviews — app parity: FigmaReviewsPreview / ServiceReviewsSection.
 * The overall rating with per-aspect bars beside the latest reviews; "Show
 * all" opens the rest in place.
 */
export function DetailReviews({
  kind,
  entityId,
  entityName,
  reviews,
  summary,
}: {
  kind: 'restaurant' | 'store'
  entityId: string
  entityName: string
  reviews: DetailReview[]
  summary: { avg: number; count: number }
}) {
  const [all, setAll] = useState(false)
  const leaveReview = <LeaveReviewDialog kind={kind} entityId={entityId} entityName={entityName} />

  if (!reviews.length) {
    return (
      <DetailSection id='reviews' title='Ratings & reviews'>
        <div className='flex flex-col items-start gap-4 rounded-3xl border border-dashed border-gray-200 bg-[#FCFCFD] p-5 sm:flex-row sm:items-center'>
          <span className='flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-tint'>
            <MessageSquareText className='size-5 text-brand' />
          </span>
          <div className='min-w-0 flex-1'>
            <p className='text-[15px] font-bold text-gray-900'>No reviews yet</p>
            <p className='mt-0.5 text-[13px] text-gray-500'>Been here? Be the first to share your experience at {entityName}.</p>
          </div>
          <div className='shrink-0'>{leaveReview}</div>
        </div>
      </DetailSection>
    )
  }

  const aspects = ASPECTS.map(a => ({ ...a, value: average(reviews, a.key) })).filter(a => a.value != null)

  return (
    <DetailSection id='reviews' title='Ratings & reviews' action={leaveReview}>
      <div className='grid grid-cols-1 gap-5 lg:grid-cols-[17rem_minmax(0,1fr)]'>
        <div className='flex min-w-0 gap-5 rounded-3xl bg-[#F6FBF7] p-5 lg:flex-col lg:gap-0 lg:self-start'>
          <div className='shrink-0'>
          <div className='flex items-end gap-2'>
            <span className='text-[48px] leading-none font-bold tracking-[-1.5px] text-[#141414]'>{summary.avg.toFixed(1)}</span>
            <span className='mb-1 text-[14px] font-medium text-gray-500'>/ 5</span>
          </div>
          <div className='mt-2'><Stars value={summary.avg} /></div>
          <p className='mt-2 text-[12.5px] text-gray-600'>
            {summary.count.toLocaleString('en-US')} {summary.count === 1 ? 'rating' : 'ratings'}
          </p>
          </div>
          {aspects.length > 0 && (
            <dl className='flex min-w-0 flex-1 flex-col justify-center space-y-2.5 border-l border-[#E3F1E7] pl-5 lg:mt-5 lg:border-t lg:border-l-0 lg:pt-4 lg:pl-0'>
              {aspects.map(a => (
                <div key={a.key} className='grid grid-cols-[4rem_1fr_1.75rem] items-center gap-2 text-[12.5px] lg:grid-cols-[4.5rem_1fr_2rem] lg:text-[13px]'>
                  <dt className='text-gray-600'>{a.label}</dt>
                  <dd className='h-1.5 overflow-hidden rounded-full bg-[#DCEFE2]'>
                    <span className='block h-full rounded-full bg-[#1F8A3B]' style={{ width: `${((a.value ?? 0) / 5) * 100}%` }} />
                  </dd>
                  <dd className='text-right font-semibold text-gray-900 tabular-nums'>{a.value!.toFixed(1)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className='min-w-0'>
          {/* phones swipe through every review; from tablet a grid with "Show all" */}
          <div className='scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0'>
            {reviews.map((r, i) => (
              <div key={r.id} className={cn('flex w-[85%] shrink-0 snap-start md:w-auto', !all && i >= PREVIEW && 'md:hidden')}>
                <ReviewCard review={r} />
              </div>
            ))}
          </div>
          {reviews.length > 1 && (
            <p className='mt-2 text-center text-[12px] text-gray-400 md:hidden'>Swipe for more reviews</p>
          )}
          {reviews.length > PREVIEW && (
            <button
              type='button'
              onClick={() => setAll(v => !v)}
              className='mt-4 hidden rounded-full border border-gray-200 px-5 py-2.5 text-[13px] font-semibold text-gray-800 transition-colors hover:border-gray-300 hover:bg-gray-50 md:inline-block'
            >
              {all ? 'Show fewer reviews' : `Show all ${reviews.length} reviews`}
            </button>
          )}
        </div>
      </div>
    </DetailSection>
  )
}
