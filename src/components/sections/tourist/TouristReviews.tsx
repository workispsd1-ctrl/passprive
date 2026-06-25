'use client';

import { Star, ThumbsUp } from 'lucide-react';
import type { TouristPlaceReview } from '@/lib/types/touristPlaces';

interface Props {
  reviews: TouristPlaceReview[];
  reviewSummary: {
    avg: number;
    count: number;
    guideAvg?: number | null;
    safetyAvg?: number | null;
    cleanlinessAvg?: number | null;
    valueAvg?: number | null;
    crowdAvg?: number | null;
  };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Today';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function TouristReviews({ reviews, reviewSummary }: Props) {
  if (reviews.length === 0) return null;

  return (
    <section className="mt-8 border-t border-gray-100 pt-6">
      <h2 className="text-[22px] font-bold text-gray-900 mb-5">Ratings &amp; reviews</h2>

      <div className="rounded-3xl bg-gray-50 border border-gray-200 p-6 md:p-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-[52px] font-bold text-brand leading-none">
              {reviewSummary.avg}
            </span>
            <Star className="w-9 h-9 fill-brand text-brand" />
          </div>
          <p className="text-[16px] font-bold text-gray-900 mt-3">
            Based on {reviewSummary.count.toLocaleString()} ratings
          </p>
        </div>

        {(reviewSummary.guideAvg != null ||
          reviewSummary.safetyAvg != null ||
          reviewSummary.cleanlinessAvg != null ||
          reviewSummary.valueAvg != null ||
          reviewSummary.crowdAvg != null) && (
          <div className="flex justify-center mt-6">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 rounded-2xl bg-gray-100 border border-gray-200 p-4 w-full">
              {reviewSummary.guideAvg != null && (
                <div className="flex flex-col items-center">
                  <span className="text-[15px] font-bold text-gray-900">{reviewSummary.guideAvg}</span>
                  <span className="text-[11px] text-gray-500 mt-0.5 text-center">Guide</span>
                </div>
              )}
              {reviewSummary.safetyAvg != null && (
                <div className="flex flex-col items-center">
                  <span className="text-[15px] font-bold text-gray-900">{reviewSummary.safetyAvg}</span>
                  <span className="text-[11px] text-gray-500 mt-0.5 text-center">Safety</span>
                </div>
              )}
              {reviewSummary.cleanlinessAvg != null && (
                <div className="flex flex-col items-center">
                  <span className="text-[15px] font-bold text-gray-900">{reviewSummary.cleanlinessAvg}</span>
                  <span className="text-[11px] text-gray-500 mt-0.5 text-center">Cleanliness</span>
                </div>
              )}
              {reviewSummary.valueAvg != null && (
                <div className="flex flex-col items-center">
                  <span className="text-[15px] font-bold text-gray-900">{reviewSummary.valueAvg}</span>
                  <span className="text-[11px] text-gray-500 mt-0.5 text-center">Value</span>
                </div>
              )}
              {reviewSummary.crowdAvg != null && (
                <div className="flex flex-col items-center">
                  <span className="text-[15px] font-bold text-gray-900">{reviewSummary.crowdAvg}</span>
                  <span className="text-[11px] text-gray-500 mt-0.5 text-center">Crowd</span>
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-[20px] font-bold text-gray-900 mt-7 mb-5">
          {reviewSummary.count.toLocaleString()} reviews
        </p>

        <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-1">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="shrink-0 w-72 bg-white border border-gray-100 rounded-2xl p-4 hover:border-brand/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                    <span className="text-[14px] font-bold text-gray-600">
                      {(review.username_snapshot ?? 'A')[0].toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-gray-900 leading-tight">
                      {review.username_snapshot ?? 'Anonymous'}
                    </p>
                    <p className="text-[12px] text-gray-400">
                      {timeAgo(review.created_at)}
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand text-white text-[13px] font-bold shrink-0">
                  {review.rating}
                  <Star className="w-3 h-3 fill-white" />
                </span>
              </div>

              {review.review_text && (
                <p className="mt-3 text-[13px] text-gray-600 leading-relaxed line-clamp-3">
                  {review.review_text}
                </p>
              )}

              {(review.liked_tags ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  <ThumbsUp className="w-3 h-3 text-green-500 shrink-0 mt-0.5" />
                  {review.liked_tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded-full bg-green-50 border border-green-100 text-[10px] font-medium text-green-700"
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
  );
}
