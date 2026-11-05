'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, Search, Star } from 'lucide-react'
import { timeAgo, topTags, visibleReviews, type ReviewRow, type ReviewSort } from '@/lib/allReviews'
import { cn } from '@/lib/utils'
import { DESIGN_UNIT, TYPE_SCALE, t, tMin } from './designUnit'

const PAGE = 20
const SORTS: ReviewSort[] = ['Latest', 'High Rating']

function Stars({ value, size, on, off }: { value: number; size: string; on: string; off: string }) {
  return (
    <span className='flex items-center' style={{ gap: t(3) }} role='img' aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map(n => {
        const lit = n <= Math.round(value)
        return <Star key={n} strokeWidth={1.5} style={{ width: size, height: size, color: lit ? on : off, fill: lit ? on : 'transparent' }} />
      })}
    </span>
  )
}

function ReviewCard({ review }: { review: ReviewRow }) {
  const when = timeAgo(review.createdAt)
  return (
    <article className='bg-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.08)]' style={{ padding: `${tMin(28, 14)} ${tMin(32, 14)}`, borderRadius: t(18) }}>
      <div className='flex items-center justify-between' style={{ gap: tMin(14, 8) }}>
        <div className='flex min-w-0 items-center' style={{ gap: tMin(16, 10) }}>
          <span className='relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#FFD9C7] font-bold text-[#B33A00]' style={{ width: tMin(60, 38), height: tMin(60, 38), fontSize: tMin(20, 15) }}>
            {review.name.charAt(0).toUpperCase()}
            {review.avatar && (
              // eslint-disable-next-line @next/next/no-img-element -- member photos come from any host; the initial shows if one fails
              <img src={review.avatar} alt='' referrerPolicy='no-referrer' onError={e => { e.currentTarget.style.display = 'none' }} className='absolute inset-0 size-full object-cover' />
            )}
          </span>
          <span className='min-w-0'>
            <span className='block truncate font-semibold text-[#252427]' style={{ fontSize: tMin(16, 14) }}>{review.name}</span>
            {when && <span className='block text-[#8E8E93]' style={{ marginTop: t(2), fontSize: tMin(14, 12) }}>{when}</span>}
          </span>
        </div>
        <span className='flex shrink-0 items-center rounded-full bg-[#FFF1EB] font-semibold text-[#252427]' style={{ gap: tMin(8, 5), padding: `${tMin(5, 4)} ${tMin(12, 8)}`, fontSize: tMin(14, 12) }}>
          <Stars value={review.rating} size={tMin(15, 11)} on='#7A2E12' off='#D9C6BE' />
          {Number(review.rating.toFixed(1))}
        </span>
      </div>
      {review.text && <p className='wrap-break-word whitespace-pre-line text-[#5B5A5A]' style={{ marginTop: tMin(20, 12), fontSize: tMin(15, 13), lineHeight: 1.55 }}>{review.text}</p>}
    </article>
  )
}

/** Figma "All reviews": the score, sort, tag chips and search over every review. */
export function AllReviewsClient({ backHref, name, average, reviews }: { backHref: string; name: string; average: number; reviews: ReviewRow[] }) {
  const [sort, setSort] = useState<ReviewSort>('Latest')
  const [sortOpen, setSortOpen] = useState(false)
  const [tag, setTag] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [shown, setShown] = useState(PAGE)

  const tags = useMemo(() => topTags(reviews), [reviews])
  const list = useMemo(() => visibleReviews(reviews, { sort, tag, query }), [reviews, sort, tag, query])
  const chip = (active: boolean) => cn('flex shrink-0 items-center rounded-full border font-medium whitespace-nowrap', active ? 'border-[#ff4800] bg-[#FFF1EB] text-[#ff4800]' : 'border-[#d5d5d5] bg-white text-[#2C2D32] hover:bg-gray-50')
  const chipSize = { height: tMin(36, 30), padding: `0 ${tMin(16, 11)}`, gap: 4, fontSize: tMin(14, 12) }

  return (
    <main
      className={cn('min-h-screen bg-white pb-16 font-(family-name:--font-dm-sans) max-md:[--t:0.7px] md:mx-[calc(50%-50vw)] md:-mt-9.5 md:w-screen', TYPE_SCALE)}
      style={{ ['--u' as string]: DESIGN_UNIT }}
    >
      <div className='mx-auto max-w-7xl px-4 md:px-8' style={{ paddingTop: tMin(52, 18) }}>
        <Link href={backHref} className='inline-flex items-center font-bold text-[#1A1A1A] hover:text-[#ff4800]' style={{ gap: tMin(14, 8), fontSize: tMin(24, 18) }}>
          <ArrowLeft style={{ width: tMin(24, 18), height: tMin(24, 18) }} /> All reviews
        </Link>
        <p className='truncate text-[#8E8E93]' style={{ marginTop: t(4), fontSize: tMin(14, 13) }}>{name}</p>

        <div className='flex items-center' style={{ marginTop: tMin(28, 16), gap: tMin(48, 20) }}>
          <span className='font-bold text-[#2C2D32]' style={{ fontSize: tMin(80, 46), lineHeight: 1 }}>{average.toFixed(1)}</span>
          <span>
            <Stars value={average} size={tMin(20, 15)} on='#5B5A5A' off='#CFCFCF' />
            <span className='block text-[#8E8E93]' style={{ marginTop: tMin(8, 4), fontSize: tMin(14, 12) }}>{reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}</span>
          </span>
        </div>

        <div className='flex flex-wrap items-center justify-between' style={{ marginTop: tMin(36, 18), gap: tMin(14, 10) }}>
          <div className='flex flex-wrap items-center' style={{ gap: tMin(10, 7) }}>
            <div className='relative'>
              <button type='button' onClick={() => setSortOpen(v => !v)} aria-expanded={sortOpen} className={chip(sort !== 'Latest')} style={chipSize}>
                Sort By <ChevronDown className={cn('transition-transform', sortOpen && 'rotate-180')} style={{ width: tMin(14, 12), height: tMin(14, 12) }} />
              </button>
              {sortOpen && (
                <ul className='absolute top-full left-0 z-20 mt-1 w-40 overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg'>
                  {SORTS.map(option => (
                    <li key={option}>
                      <button
                        type='button'
                        onClick={() => { setSort(option); setSortOpen(false) }}
                        className={cn('w-full px-3 py-2 text-left text-[13px] hover:bg-gray-50', sort === option && 'font-bold text-[#ff4800]')}
                      >
                        {option}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {tags.map(item => (
              <button key={item} type='button' aria-pressed={tag === item} onClick={() => { setTag(tag === item ? null : item); setShown(PAGE) }} className={chip(tag === item)} style={chipSize}>
                {item}
              </button>
            ))}
          </div>
          <label className='flex items-center rounded-full border border-[#d5d5d5] bg-white max-sm:w-full' style={{ width: undefined, minWidth: tMin(320, 200), height: tMin(44, 36), padding: `0 ${tMin(16, 12)}`, gap: tMin(10, 8) }}>
            <Search className='shrink-0 text-[#2C2D32]' style={{ width: tMin(20, 15), height: tMin(20, 15) }} />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); setShown(PAGE) }}
              placeholder='Search reviews'
              aria-label='Search reviews'
              className='min-w-0 flex-1 bg-transparent text-[#252427] outline-none placeholder:text-[#8E8E93]'
              style={{ fontSize: tMin(14, 13) }}
            />
          </label>
        </div>

        {list.length === 0 ? (
          <p className='text-center text-[#8E8E93]' style={{ padding: `${tMin(60, 36)} 0`, fontSize: tMin(15, 14) }}>
            {reviews.length ? 'No reviews match your search.' : 'No reviews yet.'}
          </p>
        ) : (
          <div className='flex flex-col' style={{ marginTop: tMin(36, 18), gap: tMin(24, 12) }}>
            {list.slice(0, shown).map(review => <ReviewCard key={review.id} review={review} />)}
          </div>
        )}

        {list.length > shown && (
          <div className='flex justify-center' style={{ marginTop: tMin(28, 16) }}>
            <button type='button' onClick={() => setShown(n => n + PAGE)} className={chip(false)} style={chipSize}>Show more reviews</button>
          </div>
        )}
      </div>
    </main>
  )
}
