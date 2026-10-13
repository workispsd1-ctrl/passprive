'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, MessageSquareText, Star, Trash2 } from 'lucide-react'

export interface UserReview {
  id: string
  rating: number
  text: string
  food: number | null
  service: number | null
  ambience: number | null
  approved: boolean
  createdAt: string
  restaurant: { name: string; href: string; area: string; image: string | null } | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function YourReviewsClient({ reviews }: { reviews: UserReview[] }) {
  const router = useRouter()
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [removed, setRemoved] = useState<string[]>([])
  const [error, setError] = useState('')

  const visible = reviews.filter(r => !removed.includes(r.id))

  async function remove(id: string) {
    setDeletingId(id)
    setError('')
    const res = await fetch(`/api/reviews/restaurant/${id}`, { method: 'DELETE' })
    const data = (await res.json().catch(() => ({}))) as { error?: string }
    setDeletingId(null)
    setConfirmId(null)
    if (!res.ok) { setError(data.error ?? 'Could not delete the review. Please try again.'); return }
    setRemoved(ids => [...ids, id])
    router.refresh()
  }

  if (visible.length === 0) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-tint">
          <MessageSquareText className="h-7 w-7 text-brand" />
        </div>
        <p className="mt-4 text-[18px] font-bold text-gray-900">No reviews yet</p>
        <p className="mt-1 text-[14px] text-gray-500">Reviews you leave for restaurants will show up here.</p>
        <Link
          href="/dining"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-full bg-brand px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-dark"
        >
          Explore restaurants
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-600">{error}</p>}

      <ul className="grid gap-4 md:grid-cols-2">
        {visible.map(review => {
          const subRatings = [
            ['Food', review.food],
            ['Service', review.service],
            ['Ambience', review.ambience],
          ].filter((x): x is [string, number] => x[1] != null)

          return (
            <li key={review.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  {review.restaurant?.image && (
                    <Image src={review.restaurant.image} alt="" fill className="object-cover" sizes="56px" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {review.restaurant ? (
                    <Link href={review.restaurant.href} className="block truncate text-[15px] font-bold text-gray-900 hover:text-brand">
                      {review.restaurant.name}
                    </Link>
                  ) : (
                    <p className="truncate text-[15px] font-bold text-gray-900">Restaurant</p>
                  )}
                  {review.restaurant?.area && <p className="truncate text-[12px] text-gray-500">{review.restaurant.area}</p>}
                  <p className="mt-0.5 text-[12px] text-gray-400">{formatDate(review.createdAt)}</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-green-700 px-2.5 py-1 text-[13px] font-bold text-white">
                  {review.rating.toFixed(1)} <Star className="h-3 w-3 fill-white" />
                </span>
              </div>

              {subRatings.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {subRatings.map(([label, value]) => (
                    <span key={label} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-[12px] font-medium text-gray-700">
                      {label} {value} <Star className="h-3 w-3 fill-brand text-brand" />
                    </span>
                  ))}
                </div>
              )}

              {review.text && <p className="mt-3 text-[13px] leading-relaxed text-gray-600">{review.text}</p>}

              <div className="mt-4 flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${review.approved ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {review.approved ? 'Published' : 'Awaiting approval'}
                </span>

                {confirmId === review.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-gray-500">Delete this review?</span>
                    <button
                      type="button"
                      disabled={deletingId === review.id}
                      onClick={() => setConfirmId(null)}
                      className="rounded-full border border-gray-300 px-3 py-1.5 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      Keep
                    </button>
                    <button
                      type="button"
                      disabled={deletingId === review.id}
                      onClick={() => remove(review.id)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                      {deletingId === review.id && <Loader2 className="h-3 w-3 animate-spin" />} Delete
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmId(review.id)}
                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-500 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
