import { Star, Info, ThumbsUp } from 'lucide-react'
import type { Review, ReviewSummary } from '@/lib/types/dining'

function ratingAvg(reviews: Review[], key: 'food_rating' | 'service_rating' | 'ambience_rating'): number | null {
  const vals = reviews.map(r => r[key]).filter((v): v is number => v != null)
  if (!vals.length) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'Today'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

interface Props {
  reviews: Review[]
  reviewSummary: ReviewSummary
}

export function RestaurantReviewsSection({ reviews, reviewSummary }: Props) {
  if (reviews.length === 0) return null

  const foodAvg = ratingAvg(reviews, 'food_rating')
  const serviceAvg = ratingAvg(reviews, 'service_rating')
  const ambienceAvg = ratingAvg(reviews, 'ambience_rating')

  return (
    <section className='mt-8 border-t border-gray-100 pt-6'>
      <h2 className='text-[22px] font-bold text-gray-900 mb-5'>Ratings &amp; reviews</h2>

      <div className='rounded-3xl bg-gray-50 border border-gray-200 p-6 md:p-8'>
        <div className='text-center'>
          <div className='flex items-center justify-center gap-2'>
            <span className='text-[52px] font-bold text-green-700 leading-none'>{reviewSummary.avg}</span>
            <Star className='w-9 h-9 fill-green-700 text-green-700' />
          </div>
          <p className='text-[16px] font-bold text-gray-900 mt-3'>
            Based on {reviewSummary.count.toLocaleString()} ratings
          </p>
          <div className='flex items-center justify-center gap-1 mt-1'>
            <span className='text-[13px] text-gray-400'>how are ratings calculated?</span>
            <Info className='w-4 h-4 text-gray-400' />
          </div>
        </div>

        {(foodAvg != null || serviceAvg != null || ambienceAvg != null) && (
          <div className='flex justify-center mt-6'>
            <div className='inline-flex rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden divide-x divide-gray-200'>
              {foodAvg != null && (
                <div className='flex flex-col items-center px-8 py-3.5'>
                  <span className='text-[17px] font-bold text-gray-900'>{foodAvg}</span>
                  <span className='text-[13px] text-gray-500 mt-0.5'>Food</span>
                </div>
              )}
              {serviceAvg != null && (
                <div className='flex flex-col items-center px-8 py-3.5'>
                  <span className='text-[17px] font-bold text-gray-900'>{serviceAvg}</span>
                  <span className='text-[13px] text-gray-500 mt-0.5'>Service</span>
                </div>
              )}
              {ambienceAvg != null && (
                <div className='flex flex-col items-center px-8 py-3.5'>
                  <span className='text-[17px] font-bold text-gray-900'>{ambienceAvg}</span>
                  <span className='text-[13px] text-gray-500 mt-0.5'>Ambience</span>
                </div>
              )}
            </div>
          </div>
        )}

        <p className='text-center text-[22px] font-bold text-gray-900 mt-7 mb-5'>
          {reviewSummary.count.toLocaleString()} reviews
        </p>

        <div className='flex gap-4 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-1'>
          {reviews.map(review => (
            <div key={review.id} className='shrink-0 w-72 bg-white border border-gray-100 rounded-2xl p-4'>
              <div className='flex items-center justify-between gap-2'>
                <div className='flex items-center gap-2.5'>
                  <div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0'>
                    <span className='text-[14px] font-bold text-gray-600'>
                      {(review.username_snapshot ?? 'A')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className='text-[14px] font-bold text-gray-900 leading-tight'>
                      {review.username_snapshot ?? 'Anonymous'}
                    </p>
                    <p className='text-[12px] text-gray-400'>{timeAgo(review.created_at)}</p>
                  </div>
                </div>
                <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-green-700 text-white text-[13px] font-bold shrink-0'>
                  {review.rating}
                  <Star className='w-3 h-3 fill-white' />
                </span>
              </div>

              {review.review_text && (
                <p className='mt-3 text-[13px] text-gray-600 leading-relaxed line-clamp-3'>
                  {review.review_text}
                </p>
              )}
              {review.review_text && review.review_text.length > 120 && (
                <button type='button' className='text-[13px] font-bold text-gray-800 mt-1'>
                  Read more
                </button>
              )}

              {(review.liked_tags ?? []).length > 0 && (
                <div className='flex flex-wrap gap-1.5 mt-2.5'>
                  <ThumbsUp className='w-3 h-3 text-green-500 shrink-0 mt-0.5' />
                  {review.liked_tags!.map(tag => (
                    <span
                      key={tag}
                      className='px-1.5 py-0.5 rounded-full bg-green-50 border border-green-100 text-[10px] font-medium text-green-700'
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
