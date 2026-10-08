import { cn } from '@/lib/utils'

/**
 * Loading skeletons that mirror the real components' frames — same widths,
 * aspect ratios, corner radii, white surfaces and drop shadows — so a page
 * keeps its shape while it loads instead of flashing generic grey boxes.
 * Keep each one in step with the component named in its comment.
 */

/** A pulsing placeholder block. */
export function Bone({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-gray-200/80', className)} />
}

/** Text-line placeholder. */
function Line({ className }: { className?: string }) {
  return <Bone className={cn('h-3 rounded-full', className)} />
}

/** home/HScroll — section title + horizontal rail with the same paddings. */
export function RailSkeleton({
  titleWidth = 'w-44',
  subtitle = false,
  count = 5,
  gap = 'gap-4',
  className,
  children,
}: {
  titleWidth?: string | null
  subtitle?: boolean
  count?: number
  gap?: string
  className?: string
  children: (i: number) => React.ReactNode
}) {
  return (
    <section className={cn('py-6 md:py-8', className)} aria-hidden>
      <div className='mx-auto w-full max-w-7xl'>
        {titleWidth && (
          <div className='mb-4 px-4 md:px-8'>
            <Bone className={cn('h-5 rounded-full', titleWidth)} />
            {subtitle && <Line className='mt-2 w-64' />}
          </div>
        )}
        <div className={cn('flex overflow-hidden px-4 pt-3 pb-8 md:px-8', gap)}>
          {Array.from({ length: count }, (_, i) => children(i))}
        </div>
      </div>
    </section>
  )
}

/** home/MerchantCard + dining/DiningMerchantCard (photo card, 300px, soft shadow). */
export function MerchantCardSkeleton() {
  return (
    <div className='w-75 shrink-0 overflow-hidden rounded-[18px] border border-white bg-white shadow-[0px_4.8px_20.4px_0px_rgba(0,0,0,0.1)] 2xl:w-95'>
      <div className='mx-2 mt-1.75 overflow-hidden rounded-[15px]'>
        <Bone className='aspect-87/100 rounded-[15px]' />
      </div>
      <div className='space-y-2 px-5.25 pt-3 pb-4'>
        <Line className='h-3.5 w-3/5' />
        <Line className='w-4/5' />
        <Line className='w-2/5' />
      </div>
    </div>
  )
}

/** NowTrending / TopBrandCircles / SpaNearYou — round avatar + two captions. */
export function CircleCardSkeleton({ size = 'w-52 2xl:w-72' }: { size?: string }) {
  return (
    <div className={cn('flex shrink-0 flex-col items-center', size)}>
      <Bone className='aspect-square w-full rounded-full' />
      <Line className='mt-4 h-3.5 w-2/3' />
      <Line className='mt-2 w-1/2' />
    </div>
  )
}

/** StoresNearYou / DiscoverTopBrands — tall 420:548 poster card. */
export function PosterCardSkeleton({ size = 'w-80 2xl:w-105' }: { size?: string }) {
  return <Bone className={cn('aspect-420/548 shrink-0 rounded-[20px]', size)} />
}

/** MoodCategories / store CategoryBar — image tile + label. */
export function TileSkeleton() {
  return (
    <div className='w-32.75 shrink-0 2xl:w-45.75'>
      <Bone className='h-34.5 w-full rounded-[17px] 2xl:h-47.5 2xl:rounded-[24px]' />
      <Line className='mx-auto mt-3 w-2/3' />
    </div>
  )
}

/** BankOffersSection — 256:196 offer card. */
export function OfferCardSkeleton() {
  return <Bone className='aspect-256/196 w-64 shrink-0 rounded-2xl' />
}

/** tourist CuratedCard / CompactPlaceCard — padded white card with photo. */
export function PlaceCardSkeleton() {
  return (
    <div className='flex w-62.5 shrink-0 flex-col rounded-[18px] bg-white p-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)]'>
      <Bone className='h-44 rounded-xl' />
      <div className='space-y-2 px-1.5 pt-3 pb-2'>
        <Line className='h-3.5 w-3/4' />
        <Line className='w-1/2' />
      </div>
    </div>
  )
}

/** Tourist "Browse by Category" — small white tile with icon area. */
export function CategoryChipSkeleton() {
  return (
    <div className='flex w-28 shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] md:w-32'>
      <Bone className='h-24 rounded-none md:h-28' />
      <div className='p-2.5'>
        <Line className='mx-auto w-2/3' />
      </div>
    </div>
  )
}

/** Full-width promo / banner strip inside the content column. */
export function BannerSkeleton({ aspect = 'aspect-[12/1]', className }: { aspect?: string; className?: string }) {
  return (
    <div className={cn('mx-auto max-w-7xl px-4 py-4 md:px-8', className)} aria-hidden>
      <Bone className={cn('w-full rounded-2xl', aspect)} />
    </div>
  )
}

/**
 * Detail pages (dining / stores / wellness / tourist) — PhotoGalleryClient's
 * 3fr|1fr|1fr photo grid, title block, action pills, content sections and,
 * when `sidebar`, the sticky booking card.
 */
export function DetailPageSkeleton({ sidebar = true }: { sidebar?: boolean }) {
  return (
    <main className='min-h-screen bg-white pb-20 md:pb-0' aria-busy='true'>
      {/* phone: single hero photo */}
      <Bone className='h-64 rounded-none md:hidden' />
      {/* desktop: PhotoGrid */}
      <div className='hidden h-105 grid-cols-[3fr_1fr_1fr] grid-rows-2 gap-1.5 px-6 pt-4 md:grid'>
        <Bone className='row-span-2 rounded-l-2xl' />
        <Bone className='rounded-none' />
        <Bone className='rounded-tr-2xl' />
        <Bone className='rounded-none' />
        <Bone className='rounded-br-2xl' />
      </div>

      <div className='mx-auto max-w-7xl px-4 md:px-6'>
        <Line className='mt-4 hidden w-56 md:block' />
        <div className={cn('mt-4', sidebar && 'md:grid md:grid-cols-[1fr_340px] md:items-start md:gap-10')}>
          <div className='min-w-0'>
            <div className='flex items-start gap-3'>
              <Bone className='h-14 w-14 shrink-0 rounded-xl' />
              <div className='flex-1 space-y-2.5 pt-1'>
                <Bone className='h-6 w-2/3 rounded-full' />
                <Line className='w-1/3' />
                <Line className='w-1/2' />
              </div>
            </div>
            <div className='mt-5 flex flex-wrap gap-2'>
              {['w-28', 'w-24', 'w-20', 'w-20'].map((w, i) => (
                <Bone key={i} className={cn('h-8 rounded-full', w)} />
              ))}
            </div>

            <div className='mt-8 flex gap-7 border-b border-gray-100 pb-3'>
              {['w-14', 'w-16', 'w-16', 'w-12'].map((w, i) => <Line key={i} className={cn('h-3.5', w)} />)}
            </div>

            {/* offers row */}
            <Bone className='mt-6 h-5 w-40 rounded-full' />
            <div className='mt-4 flex gap-3 overflow-hidden'>
              {[0, 1, 2].map(i => (
                <div key={i} className='w-72 shrink-0 rounded-2xl border border-gray-200 p-4'>
                  <Line className='w-1/3' />
                  <Line className='mt-4 h-4 w-2/3' />
                  <Line className='mt-2 w-1/2' />
                </div>
              ))}
            </div>

            {/* list section (menu / services / reviews) */}
            <Bone className='mt-8 h-5 w-32 rounded-full' />
            <div className='mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-200'>
              {[0, 1, 2, 3].map(i => (
                <div key={i} className='flex items-center justify-between gap-4 px-4 py-4'>
                  <div className='flex-1 space-y-2'>
                    <Line className='h-3.5 w-1/2' />
                    <Line className='w-3/4' />
                  </div>
                  <Line className='h-3.5 w-16' />
                </div>
              ))}
            </div>
          </div>

          {sidebar && (
            <div className='hidden pt-4 md:block'>
              <div className='flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
                <Bone className='h-5 w-32 rounded-full' />
                <Line className='w-full' />
                <Line className='w-2/3' />
                <Bone className='h-12 rounded-xl' />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

/** Booking flows (dining / wellness) — slim header row + the booking card. */
export function BookingPageSkeleton() {
  return (
    <main className='min-h-screen bg-gray-50' aria-busy='true'>
      <div className='border-b border-gray-200 bg-white'>
        <div className='mx-auto flex max-w-5xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8'>
          <Bone className='h-5 w-5 rounded-md' />
          <Bone className='h-14 w-14 rounded-xl' />
          <div className='flex-1 space-y-2'>
            <Line className='h-4 w-48' />
            <Line className='w-64' />
          </div>
        </div>
      </div>
      <div className='mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8'>
        <div className='mx-auto flex max-w-2xl flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-5 md:p-6'>
          <Line className='h-4 w-64' />
          <div>
            <Line className='mb-3 h-3.5 w-32' />
            <div className='flex gap-2 overflow-hidden'>
              {Array.from({ length: 10 }, (_, i) => <Bone key={i} className='h-10 w-10 shrink-0 rounded-full' />)}
            </div>
          </div>
          <div>
            <Line className='mb-3 h-3.5 w-40' />
            <div className='flex gap-2.5 overflow-hidden'>
              {Array.from({ length: 8 }, (_, i) => <Bone key={i} className='h-18 w-16 shrink-0 rounded-2xl' />)}
            </div>
          </div>
          <div className='grid grid-cols-3 gap-2.5 sm:grid-cols-4'>
            {Array.from({ length: 8 }, (_, i) => <Bone key={i} className='h-11 rounded-xl' />)}
          </div>
          <Bone className='h-12 rounded-xl' />
        </div>
      </div>
    </main>
  )
}

/** Deals / Instant Book / Collections — page title + wrapped grid of restaurant cards (RestaurantResults). */
export function CardGridPageSkeleton({ count = 8 }: { count?: number }) {
  return (
    <main className='pb-16' aria-busy='true'>
      <div className='mx-auto max-w-7xl px-4 pt-6 md:px-8 2xl:max-w-394'>
        <Bone className='h-7 w-56 rounded-full' />
        <Line className='mt-2 w-80' />
      </div>
      <div className='mx-auto max-w-7xl px-4 py-6 md:px-8 2xl:max-w-394'>
        <div className='flex flex-wrap justify-center gap-4 md:justify-start'>
          {Array.from({ length: count }, (_, i) => <MerchantCardSkeleton key={i} />)}
        </div>
      </div>
    </main>
  )
}

/** Search — the rounded search field and a result list (SearchClient). */
export function SearchPageSkeleton() {
  return (
    <main className='mx-auto max-w-3xl px-4 pt-6 pb-16 md:px-8' aria-busy='true'>
      <Bone className='h-12 rounded-full' />
      <div className='mt-6 space-y-3'>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className='flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm'>
            <Bone className='h-14 w-14 shrink-0 rounded-xl' />
            <div className='flex-1 space-y-2'>
              <Line className='h-3.5 w-1/2' />
              <Line className='w-1/3' />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

/** Bookings list — tab pills and booking cards (BookingsClient). */
export function BookingsListSkeleton() {
  return (
    <main className='min-h-screen' aria-busy='true'>
      <div className='flex justify-center gap-2 py-5'>
        {['w-14', 'w-20', 'w-24'].map((w, i) => <Bone key={i} className={cn('h-8 rounded-full', w)} />)}
      </div>
      <div className='mx-auto flex max-w-xl flex-col gap-4 px-4 pb-10'>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className='overflow-hidden rounded-2xl bg-white shadow-sm'>
            <div className='flex gap-3 p-4'>
              <div className='flex-1 space-y-3'>
                <Line className='h-4 w-1/2' />
                <Line className='w-1/4' />
                <Line className='w-2/3' />
                <Line className='w-1/2' />
              </div>
              <Bone className='h-20 w-20 shrink-0 rounded-xl' />
            </div>
            <div className='flex items-center justify-between border-t border-gray-100 px-4 py-3'>
              <Bone className='h-6 w-20 rounded-full' />
              <Line className='w-24' />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}

/** Neutral page skeleton for screens without a dedicated one (Gifts, Visit Rewards). */
export function SimplePageSkeleton() {
  return (
    <main className='mx-auto min-h-screen max-w-4xl px-4 pt-6 pb-16 md:px-8' aria-busy='true'>
      <Bone className='h-7 w-56 rounded-full' />
      <Line className='mt-2 w-72' />
      <Bone className='mt-6 h-44 rounded-3xl' />
      <div className='mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2'>
        {[0, 1, 2, 3].map(i => <Bone key={i} className='h-28 rounded-2xl' />)}
      </div>
    </main>
  )
}
