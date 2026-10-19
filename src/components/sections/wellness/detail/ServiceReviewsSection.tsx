import { Star } from 'lucide-react'
import type { ServiceReview } from '@/lib/types/stores'
import { LeaveReviewDialog } from '@/components/shared/LeaveReviewDialog'

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
  if (days < 1) return 'Today'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

interface Props {
  reviews: ServiceReview[]
  summary: { avg: number; count: number }
  storeId: string
  storeName: string
}

function avgOf(reviews: ServiceReview[], key: 'service_rating' | 'ambience_rating'): number | null {
  const vals = reviews.map(r => r[key]).filter((v): v is number => v != null)
  return vals.length ? Math.round((vals.reduce((a, b) => a + Number(b), 0) / vals.length) * 10) / 10 : null
}

/** app parity: components/ServiceReviewsSection.jsx — rating summary + review cards, on `store_reviews`. */
export function ServiceReviewsSection({ reviews, summary, storeId, storeName }: Props) {
  const serviceAvg = avgOf(reviews, 'service_rating')
  const ambienceAvg = avgOf(reviews, 'ambience_rating')
  const leaveReview = <LeaveReviewDialog kind='store' entityId={storeId} entityName={storeName} />

  return (
    <section id='reviews' className='scroll-mt-14 pt-8'>
      <div className='mb-4 flex flex-wrap items-center justify-between gap-3'>
        <h2 className='text-[20px] font-bold text-gray-900'>Reviews</h2>
        {reviews.length > 0 && leaveReview}
      </div>

      {reviews.length === 0 ? (
        <div className='flex flex-col items-center rounded-2xl border border-dashed border-gray-200 px-4 py-8 text-center'>
          <p className='text-[14px] font-semibold text-gray-800'>No reviews yet</p>
          <p className='mt-1 mb-4 text-[12px] text-gray-500'>Be the first to share your experience at {storeName}.</p>
          {leaveReview}
        </div>
      ) : (
        <>
          <div className='inline-flex divide-x divide-gray-200 rounded-2xl border border-gray-200 bg-gray-50'>
            <div className='flex flex-col items-center px-6 py-3'>
              <span className='inline-flex items-center gap-1 rounded-lg bg-green-700 px-2 py-0.5 text-[14px] font-bold text-white'>
                {summary.avg.toFixed(1)} <Star className='h-3 w-3 fill-white' />
              </span>
              <span className='mt-1 text-[12px] text-gray-500'>{summary.count.toLocaleString()} ratings</span>
            </div>
            {serviceAvg != null && (
              <div className='flex flex-col items-center px-6 py-3'>
                <span className='text-[16px] font-bold text-gray-900'>{serviceAvg.toFixed(1)}</span>
                <span className='mt-0.5 text-[12px] text-gray-500'>Service</span>
              </div>
            )}
            {ambienceAvg != null && (
              <div className='flex flex-col items-center px-6 py-3'>
                <span className='text-[16px] font-bold text-gray-900'>{ambienceAvg.toFixed(1)}</span>
                <span className='mt-0.5 text-[12px] text-gray-500'>Ambience</span>
              </div>
            )}
          </div>

          <div className='scrollbar-hide -mx-4 mt-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0'>
            {reviews.slice(0, 10).map(r => (
              <div key={r.id} className='w-72 shrink-0 rounded-2xl border border-gray-200 bg-white p-4'>
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2.5'>
                    <div className='flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200'>
                      <span className='text-[13px] font-bold text-gray-600'>
                        {(r.username_snapshot ?? 'A').trim().charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className='text-[13px] leading-tight font-bold text-gray-900'>{r.username_snapshot ?? 'Anonymous'}</p>
                      <p className='text-[11px] text-gray-400'>{timeAgo(r.created_at)}</p>
                    </div>
                  </div>
                  <span className='inline-flex shrink-0 items-center gap-1 rounded-lg bg-green-700 px-2 py-0.5 text-[12px] font-bold text-white'>
                    {Number(r.rating).toFixed(1)} <Star className='h-2.5 w-2.5 fill-white' />
                  </span>
                </div>
                {r.review_text && (
                  <p className='mt-3 line-clamp-4 text-[13px] leading-relaxed text-gray-600'>{r.review_text}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
