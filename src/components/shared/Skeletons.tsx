import { DESIGN_UNIT, SALON_TYPE, SALON_UNIT, TYPE_SCALE, t, u } from '@/components/sections/dining/designUnit'
import { PROFILE_UNIT } from '@/components/sections/profile/units'
import { SEARCH_PAGE } from '@/components/search/unit'
import { cn } from '@/lib/utils'

/**
 * Loading skeletons that mirror the real components' frames — same widths,
 * aspect ratios, corner radii, white surfaces and drop shadows — so a page
 * keeps its shape while it loads instead of flashing generic grey boxes.
 * Keep each one in step with the component named in its comment.
 */

/** A pulsing placeholder block. */
export function Bone({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={cn('animate-pulse bg-gray-200/80', className)} style={style} />
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
        {/* CardChips row (Recommended, Best value…) */}
        <Bone className='mt-1 h-5.25 w-28 rounded-full' />
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

/** malls/MallsNearYou — white 16:10 photo card with two caption lines. */
export function MallCardSkeleton() {
  return (
    <div className='w-72 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0px_4.8px_20.4px_0px_rgba(0,0,0,0.08)] 2xl:w-96'>
      <Bone className='aspect-16/10 rounded-none' />
      <div className='space-y-2 p-4'>
        <Line className='h-3.5 w-3/5' />
        <Line className='w-2/5' />
      </div>
    </div>
  )
}

/** home/HotOnPassprive — 326:218 collection photo with a caption under it. */
export function CollectionCardSkeleton() {
  return (
    <div className='w-81.5 shrink-0 xl:w-90 2xl:w-105 min-[120rem]:w-[489px]'>
      <Bone className='aspect-326/218 rounded-[16px]' />
      <Line className='mt-3 h-3.5 w-3/5' />
    </div>
  )
}

/** tourist CuratedCard / CompactPlaceCard — padded white card with photo. */
export function PlaceCardSkeleton() {
  return (
    <div className='flex w-75 shrink-0 flex-col rounded-[18px] bg-white p-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)] 2xl:w-95'>
      <Bone className='aspect-361/254 rounded-xl' />
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
    <div className='flex w-28 shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] md:w-32 xl:w-36 2xl:w-44 min-[120rem]:w-56'>
      <Bone className='h-24 rounded-none md:h-28 xl:h-32 2xl:h-38 min-[120rem]:h-48' />
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

/** Wellness and tourist booking — slim header row + the booking card. */
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

/** Instant Book / Collections — page title + wrapped grid of restaurant cards (RestaurantResults). */
export function CardGridPageSkeleton({ count = 8, subtitle = false }: { count?: number; subtitle?: boolean }) {
  return (
    <main className='pb-16' aria-busy='true'>
      <div className='mx-auto max-w-7xl px-4 pt-6 md:px-8'>
        <Bone className='h-7 w-56 rounded-full' />
        {subtitle && <Line className='mt-2 w-80' />}
      </div>
      <div className='mx-auto max-w-7xl px-4 py-6 md:px-8'>
        <div className='flex flex-wrap justify-center gap-4 md:justify-start'>
          {Array.from({ length: count }, (_, i) => <MerchantCardSkeleton key={i} />)}
        </div>
      </div>
    </main>
  )
}

/** Search (SearchClient, app parity: GlobalSearchScreen) — back + search pill, the five tabs, recent chips and the discovery rails. */
export function SearchPageSkeleton() {
  return (
    <main className={SEARCH_PAGE} aria-busy='true'>
      <Bone className='size-24 rounded-md' />
      <div className='flex flex-col gap-28 max-lg:gap-16'>
        <Bone className='h-56 rounded-full max-lg:h-48' />
        <div className='flex h-52 border-b border-[#EBEBEB]'>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className='w-136 shrink-0 px-16 pt-10 max-lg:w-auto max-lg:flex-1'>
              <Line className='h-16 w-60' />
            </div>
          ))}
        </div>
      </div>
      {[0, 1].map(s => (
        <div key={s} className='flex flex-col gap-12'>
          <Bone className='h-32 w-240 rounded-full max-lg:h-24 max-lg:w-180' />
          <div className='grid grid-cols-3 gap-24 py-12 max-lg:grid-cols-1 max-lg:gap-16'>
            {[0, 1, 2].map(i => (
              <div key={i} className={cn('flex h-160 gap-20 rounded-[calc(18*var(--u))] bg-white p-8 shadow-[0_calc(3*var(--u))_calc(16*var(--u))_rgba(0,0,0,0.07)]', i > 0 && 'max-lg:hidden')}>
                <Bone className='h-144 w-136 shrink-0 rounded-[calc(12*var(--u))]' />
                <div className='flex flex-1 flex-col gap-14 pt-8'>
                  <Line className='h-18 w-2/3' />
                  <Line className='h-14 w-1/2' />
                  <Line className='h-24 w-112 rounded-full' />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
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

/**
 * Visit Rewards (CollectStamps) — the full-bleed medal hero, "How it works"
 * steps, then a rail of stamp cards with its "Explore all" pill.
 */
export function VisitRewardsSkeleton() {
  return (
    <main
      className={cn('min-h-screen bg-white pb-16 max-md:[--t:0.62px] md:mx-[calc(50%-50vw)] md:-mt-9.5 md:w-screen', TYPE_SCALE)}
      style={{ ['--u' as string]: DESIGN_UNIT }}
      aria-busy='true'
    >
      {/* Hero — warm gradient band, headline left, medals right */}
      <div className='bg-[#B5502E]'>
        <div className='mx-auto flex max-w-7xl items-center justify-between px-4 md:px-8' style={{ minHeight: t(360) }}>
          <div className='space-y-3'>
            <Bone className='h-8 w-44 rounded-full bg-white/15 md:h-12 md:w-72' />
            <Bone className='h-9 w-52 rounded-full bg-white/20 md:h-14 md:w-96' />
          </div>
          <div className='hidden items-end md:flex' aria-hidden>
            <Bone className='rounded-full bg-white/15' style={{ width: t(190), height: t(190), marginRight: t(-58) }} />
            <Bone className='relative rounded-full bg-white/20' style={{ width: t(220), height: t(220), marginBottom: t(46) }} />
            <Bone className='rounded-full bg-white/15' style={{ width: t(190), height: t(190), marginLeft: t(-58) }} />
          </div>
        </div>
      </div>

      {/* HowItWorks — four step cards */}
      <div className='mx-auto max-w-7xl py-6 md:py-10'>
        <Bone className='mx-4 h-6 w-40 rounded-full md:mx-8' />
        <div className='flex gap-3 overflow-hidden px-4 pt-4 pb-5 md:grid md:grid-cols-4 md:px-8 lg:gap-4'>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className='w-64 shrink-0 rounded-2xl border border-[#F0F0F0] bg-white p-4 shadow-[0_4px_20px_rgba(0,0,0,0.08)] md:w-auto'>
              <div className='flex items-center justify-between'>
                <Bone className='size-10 rounded-full' />
                <Bone className='h-6 w-16 rounded-full' />
              </div>
              <Line className='mt-5 h-4 w-3/5' />
              <Line className='mt-2 w-4/5' />
            </div>
          ))}
        </div>
      </div>

      {/* Section — "Collect at Restaurants": four stamp cards across */}
      <RailSkeleton titleWidth='w-56' count={4} gap='gap-3 lg:gap-4' className='py-0! md:py-0!'>
        {i => (
          <div key={i} className='w-64 shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] md:w-[calc((100%-3*16px)/4)]'>
            <Bone className='rounded-none' style={{ height: t(220), minHeight: 150 }} />
            <div className='space-y-2 p-4'>
              <Line className='h-4 w-3/5' />
              <Line className='w-2/5' />
            </div>
            <div className='border-t border-[#EFEFEF] p-4'>
              <Line className='w-4/5' />
            </div>
          </div>
        )}
      </RailSkeleton>
      <div className='mt-1 flex justify-center px-4'>
        <Bone className='h-12 w-72 rounded-full' />
      </div>
    </main>
  )
}

/** One stamp sheet (StampDetailView) — back + name, the big sheet card beside its side column. */
export function StampDetailSkeleton() {
  return (
    <main
      className={cn('min-h-screen bg-white pb-16 max-md:[--t:0.62px] md:mx-[calc(50%-50vw)] md:-mt-9.5 md:w-screen', TYPE_SCALE)}
      style={{ ['--u' as string]: DESIGN_UNIT }}
      aria-busy='true'
    >
      <div className='mx-auto max-w-7xl px-4 pt-5 md:px-8 md:pt-8'>
        <div className='flex items-center gap-3'>
          <Bone className='size-10 shrink-0 rounded-full' />
          <Bone className='h-6 w-56 rounded-full' />
        </div>
        <div className='mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.64fr)_minmax(0,1fr)] lg:gap-x-6'>
          <div className='min-w-0'>
            <Bone className='aspect-16/9 rounded-[20px]' />
            <Bone className='mt-5 h-7 w-2/5 rounded-full' />
            <Line className='mt-3 w-3/5' />
            <div className='mt-6 grid grid-cols-1 gap-4 md:grid-cols-2'>
              {[0, 1].map(i => <Bone key={i} className='h-28 rounded-2xl' />)}
            </div>
          </div>
          <div className='flex flex-col gap-4'>
            <Bone className='h-56 rounded-[20px]' />
            <Bone className='h-32 rounded-[20px]' />
          </div>
        </div>
      </div>
    </main>
  )
}

/** Mall (MallDetailClient) — full-bleed cover, name, address, actions, then rails of places. */
export function MallDetailSkeleton() {
  return (
    <main className='min-h-screen bg-white pb-16' aria-busy='true'>
      <Bone className='relative left-1/2 h-64 w-screen -translate-x-1/2 rounded-none md:h-96' />
      <div className='mx-auto max-w-7xl px-4 pt-6 md:px-8'>
        <Bone className='h-8 w-64 rounded-full md:h-9' />
        <Line className='mt-3 h-3.5 w-72 max-w-full' />
        <Line className='mt-3 h-3.5 w-40' />
        <div className='mt-4 flex gap-3'>
          {['w-32', 'w-24'].map((w, i) => <Bone key={i} className={cn('h-10 rounded-full', w)} />)}
        </div>
      </div>
      <RailSkeleton titleWidth='w-40'>{i => <MerchantCardSkeleton key={i} />}</RailSkeleton>
    </main>
  )
}

/** Order & Collect (OrderCollectClient) — title, search, category chips + sort, then the item rows. */
export function OrderCollectSkeleton() {
  return (
    <main className='mx-auto min-h-screen max-w-4xl px-4 pt-6 pb-32 md:px-8' aria-busy='true'>
      <Bone className='h-8 w-56 rounded-full' />
      <Line className='mt-2 h-3.5 w-64' />
      <Bone className='mt-4 h-11 rounded-xl' />
      <div className='mt-3 flex items-center justify-between gap-3'>
        <div className='flex gap-2 overflow-hidden'>
          {['w-16', 'w-24', 'w-20', 'w-24'].map((w, i) => <Bone key={i} className={cn('h-9 shrink-0 rounded-full', w)} />)}
        </div>
        <Bone className='h-9 w-28 shrink-0 rounded-lg' />
      </div>
      <div className='mt-4 divide-y divide-[#EAEAEA]'>
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className='flex gap-4 py-4'>
            <div className='flex-1 space-y-2'>
              <Line className='w-16' />
              <Line className='h-4 w-1/2' />
              <Line className='h-3.5 w-20' />
              <Line className='w-4/5' />
            </div>
            <Bone className='size-28 shrink-0 rounded-xl' />
          </div>
        ))}
      </div>
    </main>
  )
}

/** All reviews (AllReviewsClient) — back + name, the rating summary, sort / tag chips and search, then review cards. */
export function AllReviewsSkeleton() {
  return (
    <main
      className={cn('min-h-screen bg-white pb-16 max-md:[--t:0.7px] md:mx-[calc(50%-50vw)] md:-mt-9.5 md:w-screen', TYPE_SCALE)}
      style={{ ['--u' as string]: DESIGN_UNIT }}
      aria-busy='true'
    >
      <div className='mx-auto max-w-7xl px-4 md:px-8' style={{ paddingTop: t(52) }}>
        <Bone className='h-7 w-48 rounded-full' />
        <Line className='mt-2 w-40' />
        <div className='mt-6 flex items-center gap-3'>
          <Bone className='h-10 w-16 rounded-full' />
          <div className='space-y-2'>
            <Line className='h-3.5 w-28' />
            <Line className='w-20' />
          </div>
        </div>
        <div className='mt-6 flex flex-wrap items-center justify-between gap-3'>
          <div className='flex flex-wrap gap-2'>
            {['w-28', 'w-20', 'w-24', 'w-20'].map((w, i) => <Bone key={i} className={cn('h-9 rounded-full', w)} />)}
          </div>
          <Bone className='h-10 w-full rounded-full sm:w-72' />
        </div>
        <div className='mt-6 flex flex-col' style={{ gap: t(20) }}>
          {[0, 1, 2].map(i => (
            <div key={i} className='bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)]' style={{ padding: `${t(28)} ${t(32)}`, borderRadius: t(18) }}>
              <div className='flex items-center gap-3'>
                <Bone className='size-10 shrink-0 rounded-full md:size-[calc(60*var(--t))]' />
                <div className='flex-1 space-y-2'>
                  <Line className='h-4 w-40' />
                  <Line className='w-24' />
                </div>
              </div>
              <Line className='mt-4 w-full' />
              <Line className='mt-2 w-3/4' />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

/** Status pill, action pills and tab row shared by the store / wellness / tourist detail pages. */
function DetailTabs({ widths }: { widths: string[] }) {
  return (
    <div className='mt-8 flex gap-8 border-b border-gray-100 pb-4'>
      {widths.map((w, i) => <Line key={i} className={cn('h-4', w)} />)}
    </div>
  )
}

/** PhotoGallery PhotoGrid: the phone cover, and the desktop 2fr|1fr|1fr grid. */
function DetailPhotoGrid({ className }: { className?: string }) {
  return (
    <>
      <Bone className='h-105 rounded-none md:hidden' />
      <div className={cn('hidden h-104 grid-cols-[2fr_1fr_1fr] grid-rows-2 gap-2 px-6 md:grid', className)}>
        <Bone className='row-span-2 rounded-l-2xl' />
        <Bone className='rounded-none' />
        <Bone className='rounded-tr-2xl' />
        <Bone className='rounded-none' />
        <Bone className='rounded-br-2xl' />
      </div>
    </>
  )
}

/** Stores / wellness detail — breadcrumb, photo grid, logo + title, actions, tabs and the "Good to know" column. */
export function DetailPageSkeleton() {
  return (
    <main className='min-h-screen bg-white pb-20 md:pb-0' aria-busy='true'>
      <Line className='mt-3.5 mb-5 ml-6 hidden w-56 md:block' />
      <DetailPhotoGrid />

      <div className='relative z-10 mx-auto max-w-7xl rounded-t-[20px] bg-white px-4 md:rounded-none md:px-6'>
        <div className='pt-5 md:grid md:grid-cols-[minmax(0,1fr)_22rem] md:items-start md:gap-12 md:pt-8'>
          <div className='min-w-0'>
            <div className='flex items-center gap-4'>
              <Bone className='size-16 shrink-0 rounded-xl' />
              <div className='flex-1 space-y-2.5'>
                <Line className='w-2/5' />
                <Bone className='h-8 w-3/5 rounded-full' />
              </div>
            </div>
            <div className='mt-5 flex flex-wrap items-center gap-3'>
              <Bone className='h-8 w-60 rounded-full' />
              <Line className='w-48' />
            </div>
            <div className='mt-5 flex flex-wrap gap-2'>
              {['w-28', 'w-20', 'w-22', 'w-20'].map((w, i) => <Bone key={i} className={cn('h-9 rounded-full', w)} />)}
            </div>
            <DetailTabs widths={['w-12', 'w-14', 'w-16', 'w-12', 'w-16']} />

            <Bone className='mt-8 h-6 w-44 rounded-full' />
            <Line className='mt-3 w-52' />
            <Bone className='mt-5 h-14 rounded-2xl' />
            <Bone className='mt-5 h-30 max-w-101 rounded-2xl' />
            <Bone className='mt-6 h-62 max-w-78 rounded-2xl' />
          </div>

          <div className='hidden flex-col gap-4 md:flex'>
            <div className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
              <Bone className='h-5 w-28 rounded-full' />
              <div className='mt-5 space-y-5'>
                {['w-3/5', 'w-4/5', 'w-2/5', 'w-1/2'].map((w, i) => <Line key={i} className={w} />)}
              </div>
            </div>
            <div className='flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4'>
              <Bone className='size-16 shrink-0 rounded-xl' />
              <div className='flex-1 space-y-2.5'>
                <Line className='h-3.5 w-2/3' />
                <Line className='w-4/5' />
                <Line className='w-3/4' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

/** Tourist detail — photo grid, breadcrumb under it, title without a logo, About and a photo rail. */
export function TouristDetailSkeleton() {
  return (
    <main className='min-h-screen bg-white pb-20 md:pb-0' aria-busy='true'>
      <DetailPhotoGrid className='mt-4' />
      <div className='relative z-10 mx-auto max-w-7xl rounded-t-[20px] bg-white px-4 md:rounded-none md:px-6'>
        <Line className='mt-4 hidden w-64 md:block' />
        <div className='pt-5 md:grid md:grid-cols-[1fr_340px] md:items-start md:gap-10'>
          <div className='min-w-0'>
            <Bone className='h-9 w-3/5 rounded-full' />
            <Line className='mt-4 w-56' />
            <div className='mt-6 flex gap-3'>
              {['w-36', 'w-30'].map((w, i) => <Bone key={i} className={cn('h-12 rounded-full', w)} />)}
            </div>
            <div className='mt-8 border-t border-gray-100 pt-8'>
              <Bone className='h-5 w-44 rounded-full' />
              <div className='mt-5 space-y-3'>
                {['w-full', 'w-11/12', 'w-1/2'].map((w, i) => <Line key={i} className={w} />)}
              </div>
            </div>
            <div className='mt-10 border-t border-gray-100 pt-10'>
              <Bone className='h-5 w-24 rounded-full' />
              <Line className='mt-3 w-16' />
              <div className='mt-5 flex gap-3 overflow-hidden'>
                {[0, 1, 2, 3].map(i => <Bone key={i} className='h-44 w-60 shrink-0 rounded-2xl' />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

/**
 * Restaurant detail (Figma "Dining - Pay Bill") — phones: cover + floating title
 * card; desktop: back link and full-width cover, then the title card, tabs
 * and offers beside the sidebar (book / pay card, banners, stamp card).
 * Measured in the page's own --u / --t units (designUnit.ts).
 */
export function RestaurantDetailSkeleton() {
  return (
    <main
      className={cn('min-h-screen bg-white pb-36 md:mx-[calc(50%-50vw)] md:-mt-9.5 md:w-screen md:pb-0', TYPE_SCALE)}
      style={{ ['--u' as string]: DESIGN_UNIT }}
      aria-busy='true'
    >
      <Bone className='h-105 rounded-none md:hidden' />

      <div className='relative z-10 mx-auto flex max-w-7xl flex-col rounded-t-[20px] bg-white px-4 md:max-w-[calc(1920*var(--u))] md:rounded-none md:bg-transparent md:px-[calc(172*var(--u))]'>
        {/* desktop: RestaurantDesktopHero — back link and the full-width 480 cover */}
        <div className='hidden md:block' style={{ paddingTop: t(59) }}>
          <Bone className='rounded-full' style={{ width: t(110), height: t(40) }} />
          <Bone style={{ marginTop: t(25), height: u(480), borderRadius: u(12.03) }} />
        </div>

        {/* phones: MobileTitleCard, status row and the upsell banner */}
        <div className='md:hidden'>
          <div className='relative z-20 -mx-0.75 -mt-16.75 mb-1.5 rounded-[18px] bg-white px-3.25 py-3.5 shadow-[0_0_8px_rgba(44,35,53,0.10)]'>
            <div className='flex items-start justify-between gap-3'>
              <div className='flex-1 space-y-2.5'>
                <Bone className='h-6 w-2/5 rounded-full' />
                <Line className='w-3/4' />
                <Line className='w-2/5' />
              </div>
              <Bone className='h-6 w-14 rounded-full' />
            </div>
          </div>
          <div className='mt-3 flex items-center gap-2'>
            <Bone className='h-8 w-60 rounded-full' />
            <Bone className='size-8 rounded-full' />
            <Bone className='size-8 rounded-full' />
          </div>
          <Bone className='mt-5 h-36 rounded-[20px]' />
        </div>

        {/* the main column beside the sidebar (lg), stacked above it (md) */}
        <div className='md:block lg:grid lg:grid-cols-[minmax(0,1128fr)_minmax(270px,390fr)] lg:items-start lg:gap-x-[calc(58*var(--u))]'>
          <div className='min-w-0'>
            {/* desktop: RestaurantTitleCard */}
            <div className='hidden bg-white shadow-[0_4px_43.5px_rgba(0,0,0,0.1)] md:block' style={{ marginTop: t(24), minHeight: t(192), padding: `${t(14)} ${t(24)}`, borderRadius: t(18) }}>
              <div className='flex items-start justify-between' style={{ gap: t(16) }}>
                <div className='flex flex-1 flex-col'>
                  <Bone className='w-2/5 rounded-full' style={{ height: t(42) }} />
                  <Bone className='w-3/5 rounded-full' style={{ height: t(20), marginTop: t(8) }} />
                  <Bone className='w-2/5 rounded-full' style={{ height: t(20), marginTop: t(8) }} />
                </div>
                <Bone className='rounded-full' style={{ width: t(68), height: t(26), marginTop: t(8) }} />
              </div>
              <div className='flex' style={{ marginTop: t(14), gap: t(12) }}>
                <Bone className='rounded-full' style={{ width: t(200), height: t(32) }} />
                <Bone className='rounded-full' style={{ width: t(32), height: t(31) }} />
                <Bone className='rounded-full' style={{ width: t(32), height: t(31) }} />
              </div>
            </div>

            {/* DetailSectionTabs (figma variant) */}
            <div className='mt-6 flex gap-5 border-b border-gray-100 pb-3.5 md:mt-[calc(32*var(--t))] md:gap-[calc(56*var(--t))] md:pb-[calc(12*var(--t))]'>
              {['w-12', 'w-12', 'w-14', 'w-16', 'w-20'].map((w, i) => <Line key={i} className={cn('h-4', w)} />)}
            </div>

            {/* desktop: RestaurantDesktopSections — "Offers for today", then the next section */}
            <div className='hidden md:block'>
              <Bone className='rounded-full' style={{ width: t(200), height: t(26), marginTop: t(44) }} />
              <div className='grid grid-cols-2 gap-4 xl:grid-cols-3' style={{ marginTop: t(20) }}>
                {[0, 1, 2].map(i => <Bone key={i} className={cn(i === 2 && 'hidden xl:block')} style={{ height: t(170), borderRadius: t(24) }} />)}
              </div>
              <Bone className='rounded-full' style={{ width: t(160), height: t(26), marginTop: t(44) }} />
              <div className='grid grid-cols-2 gap-4 xl:grid-cols-3' style={{ marginTop: t(20) }}>
                {[0, 1].map(i => <Bone key={i} style={{ height: t(170), borderRadius: t(24) }} />)}
              </div>
            </div>
          </div>

          {/* desktop: the sidebar — RestaurantCtaCard, UpsellBannerPager, stamp card */}
          <div className='hidden flex-col md:flex lg:mt-[calc(24*var(--t))]' style={{ gap: t(24), paddingBottom: t(90) }}>
            <div className='hidden bg-white shadow-[0_8px_23.8px_rgba(0,0,0,0.1)] lg:block' style={{ padding: t(24), borderRadius: t(18) }}>
              <Bone className='mx-auto w-4/5 rounded-full' style={{ height: t(18) }} />
              <div className='flex' style={{ marginTop: t(14), gap: t(12) }}>
                <Bone className='flex-1 rounded-full' style={{ height: t(48) }} />
                <Bone className='flex-1 rounded-full' style={{ height: t(48) }} />
              </div>
            </div>
            <Bone className='aspect-1436/296 rounded-xl' />
            <Bone style={{ height: t(200), borderRadius: t(24) }} />
          </div>
        </div>

        {/* phones: first section */}
        <div className='md:hidden'>
          <Bone className='mt-8 h-6 w-24 rounded-full' />
          <Line className='mt-3 w-52' />
          <div className='mt-5 flex gap-3 overflow-hidden'>
            {[0, 1, 2].map(i => <Bone key={i} className='h-48 w-36 shrink-0 rounded-2xl' />)}
          </div>
        </div>
      </div>
    </main>
  )
}

/**
 * Salon detail (Figma "Salon details – Desktop") — phones: cover + floating
 * title card; desktop: back link, the 980×480 photo beside the 568-wide
 * details card, tabs, offers, service tiles and vibes. Same --u as the page
 * (SALON_UNIT), so it scales with the screen exactly like the real layout.
 */
export function WellnessDetailSkeleton() {
  const U = (n: number) => `calc(${n}*var(--u))`
  return (
    <main
      className={cn('min-h-screen bg-white pb-36 md:mx-[calc(50%-50vw)] md:-mt-9.5 md:w-screen md:pb-0', SALON_TYPE)}
      style={{ ['--u' as string]: SALON_UNIT }}
      aria-busy='true'
    >
      <Bone className='h-105 rounded-none md:hidden' />

      <div className='relative z-10 mx-auto flex max-w-7xl flex-col rounded-t-[20px] bg-white px-4 md:max-w-none md:rounded-none md:px-[calc(172*var(--u))]'>
        {/* desktop: WellnessBackLink + WellnessDesktopHero */}
        <div className='hidden md:block'>
          <Bone className='rounded-full' style={{ marginTop: U(60), width: U(110), height: U(40) }} />
          <div className='grid grid-cols-[minmax(0,980fr)_minmax(0,568fr)]' style={{ paddingTop: U(24), columnGap: U(28) }}>
            <Bone style={{ height: U(480), borderRadius: U(18) }} />
            <div className='flex flex-col' style={{ gap: U(20) }}>
              <div className='flex flex-1 flex-col bg-white shadow-[0_4px_24px_rgba(0,0,0,0.05)]' style={{ padding: U(28), gap: U(12), borderRadius: U(18) }}>
                <div className='flex items-center' style={{ gap: U(18) }}>
                  <Bone className='shrink-0' style={{ width: U(82), height: U(88), borderRadius: U(16) }} />
                  <div className='flex flex-1 flex-col' style={{ gap: U(8) }}>
                    <Bone className='w-3/5 rounded-full' style={{ height: U(39) }} />
                    <Bone className='w-4/5 rounded-full' style={{ height: U(20) }} />
                    <Bone className='w-2/5 rounded-full' style={{ height: U(20) }} />
                  </div>
                </div>
                <div className='flex' style={{ gap: U(8) }}>
                  <Bone className='rounded-full' style={{ width: U(160), height: U(38) }} />
                  <Bone className='rounded-full' style={{ width: U(40), height: U(40) }} />
                  <Bone className='rounded-full' style={{ width: U(40), height: U(40) }} />
                </div>
                <div className='mt-auto flex' style={{ gap: U(16) }}>
                  <Bone className='rounded-full' style={{ width: U(200), height: U(48) }} />
                  <Bone className='rounded-full' style={{ width: U(200), height: U(48) }} />
                </div>
              </div>
              <Bone style={{ height: U(109), borderRadius: U(18) }} />
            </div>
          </div>
        </div>

        {/* phones: MobileTitleCard and its status row */}
        <div className='md:hidden'>
          <div className='relative z-20 -mx-0.75 -mt-16.75 mb-1.5 rounded-[18px] bg-white px-3.25 py-3.5 shadow-[0_0_8px_rgba(44,35,53,0.10)]'>
            <div className='flex items-center gap-3'>
              <Bone className='size-14 shrink-0 rounded-xl' />
              <div className='flex-1 space-y-2.5'>
                <Bone className='h-6 w-3/5 rounded-full' />
                <Line className='w-3/4' />
                <Line className='w-2/5' />
              </div>
            </div>
          </div>
          <div className='mt-3 flex items-center gap-2'>
            <Bone className='h-8 w-60 rounded-full' />
            <Bone className='size-8 rounded-full' />
            <Bone className='size-8 rounded-full' />
          </div>
        </div>

        {/* DetailSectionTabs (wellness variant) */}
        <div className='mt-6 flex gap-5 border-b border-[#ffd1bf] pb-3.5 md:gap-[calc(44*var(--u))] md:pb-[calc(12*var(--u))]'>
          {['w-12', 'w-14', 'w-12', 'w-14', 'w-16'].map((w, i) => <Line key={i} className={cn('h-4 md:h-[calc(21*var(--u))]', w)} />)}
        </div>

        {/* desktop: WellnessDesktopSections — offers, services, vibes */}
        <div className='hidden md:block'>
          <Bone className='rounded-full' style={{ marginTop: U(28), width: U(160), height: U(23) }} />
          <Bone style={{ marginTop: U(18), width: U(362), height: U(156), borderRadius: U(16) }} />
          <Bone className='rounded-full' style={{ marginTop: U(40), width: U(90), height: U(26) }} />
          <div className='flex' style={{ marginTop: U(20), gap: U(16) }}>
            {Array.from({ length: 8 }, (_, i) => <Bone key={i} className='flex-1' style={{ height: U(186), borderRadius: U(12) }} />)}
          </div>
          <Bone className='rounded-full' style={{ marginTop: U(40), width: U(70), height: U(26) }} />
          <div className='grid grid-cols-4' style={{ marginTop: U(20), gap: U(20), marginBottom: U(71) }}>
            {[0, 1, 2, 3].map(i => <Bone key={i} style={{ height: U(320), borderRadius: U(18) }} />)}
          </div>
        </div>

        {/* phones: first section */}
        <div className='md:hidden'>
          <Bone className='mt-8 h-6 w-32 rounded-full' />
          <div className='mt-5 flex gap-3 overflow-hidden'>
            {[0, 1].map(i => <Bone key={i} className='h-36 w-72 shrink-0 rounded-2xl' />)}
          </div>
        </div>
      </div>
    </main>
  )
}

/**
 * Pay bill and table booking (Figma "Flow") — MerchantFlowParts' layout: the
 * merchant on the left and the step in a card on the right. `breakout` is for
 * the dining page, which sits in the site's 1280px column.
 */
export function MerchantFlowSkeleton({ variant, breakout = false }: { variant: 'pay' | 'book'; breakout?: boolean }) {
  return (
    <main
      className={cn('min-h-screen bg-white max-md:[--t:0.62px]', breakout && 'md:mx-[calc(50%-50vw)] md:-mt-9.5 md:w-screen', TYPE_SCALE)}
      style={{ ['--u' as string]: DESIGN_UNIT }}
      aria-busy='true'
    >
      <div className='relative mx-auto px-4 md:px-[calc(172*var(--u))]' style={{ maxWidth: u(1920), paddingTop: t(48), paddingBottom: t(120) }}>
        <Bone className='rounded-full' style={{ width: t(110), height: t(40) }} />

        {/* phones: the place, as the app's header */}
        <div className='mt-3 flex flex-col items-center gap-2 md:hidden'>
          <Line className='w-24' />
          <Bone className='h-5 w-44 rounded-full' />
          <Line className='w-32' />
        </div>

        <div className='mt-5 grid md:mt-0 md:grid-cols-[calc(560*var(--u))_minmax(0,1fr)] md:items-start md:gap-[calc(43*var(--u))]'>
          {/* RestaurantPanel */}
          <div className='hidden md:block' style={{ marginTop: t(45) }}>
            <Bone style={{ aspectRatio: '560 / 340', borderRadius: t(25) }} />
            <Bone className='w-3/5 rounded-full' style={{ height: t(44), marginTop: t(44) }} />
            <Bone className='w-2/5 rounded-full' style={{ height: t(28), marginTop: t(14) }} />
            <div className='flex flex-col' style={{ marginTop: t(32), gap: t(16) }}>
              {['w-4/5', 'w-3/5', 'w-2/3'].map((w, i) => (
                <div key={i} className='flex items-center' style={{ gap: t(25) }}>
                  <Bone className='rounded-full' style={{ width: t(40), height: t(40) }} />
                  <Bone className={cn('rounded-full', w)} style={{ height: t(24) }} />
                </div>
              ))}
            </div>
          </div>

          {/* the step card */}
          <section
            className='flex min-w-0 flex-col bg-white md:shadow-[4px_4px_47px_rgba(0,0,0,0.1)] max-md:rounded-3xl! max-md:border max-md:border-[#efefef] max-md:p-5!'
            style={{ marginTop: t(45), borderRadius: t(40), padding: t(48), minHeight: t(549) }}
          >
            <Bone className='w-3/5 rounded-full' style={{ height: t(44) }} />
            {variant === 'pay' ? (
              <>
                <Bone className='w-2/5 rounded-full' style={{ height: t(65), marginTop: t(36) }} />
                <Bone className='w-3/4 rounded-full' style={{ height: t(24), marginTop: t(30) }} />
                <Bone className='w-1/2 rounded-full' style={{ height: t(64), marginTop: t(28) }} />
              </>
            ) : (
              <>
                <Bone className='w-1/3 rounded-full' style={{ height: t(22), marginTop: t(36) }} />
                <div className='flex overflow-hidden' style={{ gap: t(12), marginTop: t(16) }}>
                  {Array.from({ length: 8 }, (_, i) => <Bone key={i} className='shrink-0 rounded-full' style={{ width: t(64), height: t(64) }} />)}
                </div>
                <Bone className='w-1/3 rounded-full' style={{ height: t(22), marginTop: t(36) }} />
                <div className='flex overflow-hidden' style={{ gap: t(24), marginTop: t(16) }}>
                  {Array.from({ length: 7 }, (_, i) => <Bone key={i} className='shrink-0' style={{ width: t(72), height: t(56), borderRadius: t(12) }} />)}
                </div>
                <Bone className='w-1/2 rounded-full' style={{ height: t(52), marginTop: t(32) }} />
                <div className='grid grid-cols-3 sm:grid-cols-4' style={{ gap: t(14), marginTop: t(24) }}>
                  {Array.from({ length: 8 }, (_, i) => <Bone key={i} className='rounded-full' style={{ height: t(56) }} />)}
                </div>
              </>
            )}
            <div className='mt-auto' style={{ paddingTop: t(48) }}>
              <Bone className='rounded-full' style={{ height: t(72) }} />
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

/** Deals mode (DealsModeClient) — hero, category and filter chips, result count and deal cards. */
export function DealsPageSkeleton() {
  return (
    <main className='pb-16' aria-busy='true'>
      <div className='mx-auto max-w-7xl px-4 pt-4 pb-28 md:px-6 md:pt-6'>
        <section className='rounded-3xl bg-gray-100 px-5 py-5 md:px-10 md:py-9'>
          <Bone className='h-11 w-58 rounded-full bg-gray-200' />
          <Line className='mt-6 w-20' />
          <Bone className='mt-3 h-8 w-3/4 max-w-lg rounded-full md:h-10' />
          <Line className='mt-5 w-full max-w-xl' />
          <Line className='mt-3 w-2/3 max-w-sm' />
          <div className='mt-6 hidden max-w-2xl grid-cols-3 gap-3 sm:grid'>
            {[0, 1, 2].map(i => <Bone key={i} className='h-14 rounded-2xl' />)}
          </div>
          <Line className='mt-5 w-56' />
        </section>

        <div className='-mx-4 mt-6 flex items-center gap-2 overflow-hidden border-b border-gray-100 px-4 py-3 md:-mx-6 md:px-6'>
          {['w-30', 'w-36', 'w-36'].map((w, i) => <Bone key={i} className={cn('h-10 shrink-0 rounded-full', w)} />)}
          <span className='mx-2 h-7 w-px shrink-0 bg-gray-200' />
          {['w-30', 'w-38', 'w-40'].map((w, i) => <Bone key={i} className={cn('h-9 shrink-0 rounded-full', w)} />)}
        </div>

        <div className='mt-5 flex items-center justify-between gap-2'>
          <Bone className='h-5 w-36 rounded-full' />
          <Line className='hidden w-64 sm:block' />
        </div>

        <div className='mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3'>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className='flex overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_2px_14px_rgba(0,0,0,0.05)] sm:flex-col'>
              <Bone className='w-30 shrink-0 rounded-none sm:aspect-16/10 sm:w-auto' />
              <div className='min-w-0 flex-1 space-y-2.5 p-3.5 sm:p-4'>
                <Line className='h-4 w-1/2' />
                <Line className='w-4/5' />
                <Bone className='mt-1 h-9 rounded-xl' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}

/** Privé Credits — tier hero, upgrade row, how it works, FAQ link, explore pills, transactions. */
export function PriveCreditsSkeleton() {
  return (
    <main className='min-h-screen bg-white pb-20 md:pb-10' aria-busy='true'>
      <div className='mx-auto max-w-3xl px-4 pt-6 md:px-8'>
        <Bone className='h-69 rounded-3xl' />
        <Bone className='mt-4 h-14 rounded-2xl' />

        <Bone className='mt-8 h-6 w-32 rounded-full' />
        <div className='mt-4 space-y-3'>
          {['w-1/2', 'w-3/4', 'w-5/6', 'w-2/3'].map((w, i) => (
            <div key={i} className='flex items-center gap-3'>
              <Bone className='size-7 shrink-0 rounded-full' />
              <Line className={cn('h-3.5', w)} />
            </div>
          ))}
        </div>
        <Bone className='mt-5 h-20 rounded-2xl' />

        <div className='mt-8 grid gap-3 md:grid-cols-3'>
          {[0, 1, 2].map(i => <Bone key={i} className='h-17 rounded-full' />)}
        </div>

        <Bone className='mt-10 h-6 w-32 rounded-full' />
        <Bone className='mt-3 h-22 rounded-2xl' />
      </div>
    </main>
  )
}

/** Plan detail — wide hero with the tilted member card, then how it works and the FAQ link. */
export function PlanDetailSkeleton() {
  return (
    <main className='min-h-screen bg-white pb-16' aria-busy='true'>
      <section className='mx-auto max-w-6xl px-4 pt-4 md:px-8 md:pt-6'>
        <div className='grid items-center gap-10 rounded-[28px] bg-gray-100 px-6 py-8 md:grid-cols-[1.15fr_1fr] md:px-12 md:py-12'>
          <div>
            <Line className='w-20' />
            <Bone className='mt-6 h-11 w-36 rounded-full' />
            <Bone className='mt-5 h-10 w-4/5 rounded-full md:h-12' />
            <Bone className='mt-3 h-10 w-3/5 rounded-full md:h-12' />
            <Bone className='mt-5 h-9 w-72 max-w-full rounded-full' />
            <Bone className='mt-6 h-8 w-40 rounded-full' />
          </div>
          <div className='hidden justify-center md:flex'>
            <Bone className='aspect-[1.6] w-full max-w-sm -rotate-3 rounded-3xl' />
          </div>
        </div>
      </section>
      <div className='mx-auto max-w-3xl px-4 md:px-8'>
        <section className='mt-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)]'>
          <Bone className='h-5 w-32 rounded-full' />
          <div className='mt-5 space-y-5'>
            {['w-3/4', 'w-5/6', 'w-2/3'].map((w, i) => (
              <div key={i} className='flex items-center gap-3'>
                <Bone className='size-2.5 shrink-0 rounded-full' />
                <Line className={cn('h-3.5', w)} />
              </div>
            ))}
          </div>
        </section>
        <Bone className='mt-4 h-20 rounded-2xl' />
      </div>
    </main>
  )
}

/** Gifts — dark hero with the coins card, how it works, occasions and the sidebar. */
export function GiftsPageSkeleton() {
  return (
    <main className='min-h-screen bg-gray-50' aria-busy='true'>
      <section className='flex min-h-120 items-center bg-[#1A0E07]'>
        <div className='mx-auto flex w-full max-w-7xl flex-col items-center gap-12 px-6 py-16 lg:flex-row'>
          <div className='w-full flex-1'>
            <Bone className='h-8 w-32 rounded-full bg-white/10' />
            <Bone className='mt-6 h-13 w-80 max-w-full rounded-full bg-white/10 md:h-16' />
            <Bone className='mt-3 h-13 w-44 rounded-full bg-white/10 md:h-16' />
            <Bone className='mt-6 h-3.5 w-full max-w-md rounded-full bg-white/10' />
            <Bone className='mt-3 h-3.5 w-2/3 max-w-sm rounded-full bg-white/10' />
            <div className='mt-8 flex gap-3'>
              <Bone className='h-13 w-52 rounded-2xl bg-white/15' />
              <Bone className='h-13 w-46 rounded-2xl bg-white/10' />
            </div>
          </div>
          <div className='hidden w-72 shrink-0 space-y-4 lg:block'>
            <Bone className='h-45 rounded-3xl bg-white/10' />
            <div className='grid grid-cols-3 gap-2.5'>
              {[0, 1, 2].map(i => <Bone key={i} className='h-16 rounded-2xl bg-white/10' />)}
            </div>
          </div>
        </div>
      </section>

      <section className='border-b border-gray-100 bg-white'>
        <div className='mx-auto grid max-w-7xl grid-cols-1 gap-6 px-6 py-10 md:grid-cols-3'>
          {[0, 1, 2].map(i => (
            <div key={i} className='flex items-start gap-4'>
              <Bone className='size-10 shrink-0 rounded-2xl' />
              <div className='flex-1 space-y-2.5'>
                <Line className='h-3.5 w-1/2' />
                <Line className='w-4/5' />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className='mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 pb-20 md:px-6 lg:flex-row'>
        <div className='min-w-0 flex-1 space-y-6'>
          <Bone className='h-12 rounded-2xl' />
          <div className='flex flex-wrap gap-2'>
            {['w-32', 'w-44', 'w-32', 'w-46'].map((w, i) => <Bone key={i} className={cn('h-10 rounded-full', w)} />)}
          </div>
          <Bone className='h-6 w-56 rounded-full' />
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5'>
            {Array.from({ length: 5 }, (_, i) => <Bone key={i} className='h-50 rounded-2xl' />)}
          </div>
        </div>
        <div className='w-full shrink-0 space-y-4 lg:w-[320px]'>
          <Bone className='h-83 rounded-3xl' />
          <Bone className='h-46 rounded-3xl' />
        </div>
      </div>
    </main>
  )
}

/** Listing rows with an icon, two lines and a value (wallet / transactions). */
function LedgerRow({ icon = 'size-9 rounded-xl' }: { icon?: string }) {
  return (
    <div className='flex items-center gap-3 py-3.5'>
      <Bone className={cn('shrink-0', icon)} />
      <div className='flex-1 space-y-2'>
        <Line className='h-3.5 w-1/2' />
        <Line className='w-1/3' />
      </div>
      <Line className='h-3.5 w-14' />
    </div>
  )
}

/** Wallet (WalletClient) — balance card, cashback rate and upgrade cards, ledger and rates. */
export function WalletPageSkeleton() {
  return (
    <main className='min-h-screen' aria-busy='true'>
      <div className='mx-auto max-w-5xl px-4 pt-6 pb-16 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-5'>
          <Bone className='h-64 rounded-3xl lg:col-span-3' />
          <div className='flex flex-col gap-4 lg:col-span-2'>
            <Bone className='min-h-24 flex-1 rounded-2xl' />
            <Bone className='min-h-24 flex-1 rounded-2xl' />
          </div>
        </div>
        <div className='mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5'>
          <div className='rounded-2xl border border-gray-100 bg-white px-5 py-4 lg:col-span-3'>
            <Bone className='mb-2 h-5 w-40 rounded-full' />
            <div className='divide-y divide-gray-100'>
              {[0, 1, 2, 3].map(i => <LedgerRow key={i} />)}
            </div>
          </div>
          <div className='rounded-2xl border border-gray-100 bg-white p-5 lg:col-span-2'>
            <Bone className='h-5 w-36 rounded-full' />
            <div className='mt-5 space-y-5'>
              {[0, 1, 2].map(i => (
                <div key={i} className='flex items-center justify-between gap-3'>
                  <Line className='h-3.5 w-1/2' />
                  <Line className='h-4 w-10' />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

/** Transactions (TransactionsClient) — type pills, category tabs and the list card. */
export function TransactionsPageSkeleton() {
  return (
    <main className='min-h-screen' aria-busy='true'>
      <div className='mx-auto max-w-3xl px-4 pt-4 pb-16 md:px-6'>
        <div className='flex gap-2'>
          {['w-28', 'w-32'].map((w, i) => <Bone key={i} className={cn('h-10 rounded-full', w)} />)}
        </div>
        <div className='mt-4 flex gap-6 border-b border-gray-100 pb-2.5'>
          {['w-8', 'w-14', 'w-16', 'w-16'].map((w, i) => <Line key={i} className={cn('h-3.5', w)} />)}
        </div>
        <div className='mt-5 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white px-4'>
          {Array.from({ length: 6 }, (_, i) => <LedgerRow key={i} icon='size-12 rounded-xl' />)}
        </div>
      </div>
    </main>
  )
}

/** Your receipts — avatar rows with a status chip. */
export function ReceiptsListSkeleton() {
  return (
    <main className='min-h-screen' aria-busy='true'>
      <div className='mx-auto max-w-2xl divide-y divide-[#F0F0F0] px-4 pt-4 pb-16'>
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className='flex items-center gap-4 py-4'>
            <Bone className='size-13 shrink-0 rounded-full' />
            <div className='flex-1 space-y-2'>
              <div className='flex items-center gap-2'>
                <Line className='h-4 w-2/5' />
                <Bone className='h-5 w-16 rounded-full' />
              </div>
              <Line className='w-1/2' />
              <Line className='w-1/3' />
            </div>
            <Bone className='size-5 shrink-0 rounded-full' />
          </div>
        ))}
      </div>
    </main>
  )
}

/** Receipt status, upload and edit — the narrow centred column with the receipt image. */
export function ReceiptFlowSkeleton() {
  return (
    <main className='min-h-screen' aria-busy='true'>
      <div className='mx-auto flex max-w-md flex-col items-center px-4 pt-6 pb-10'>
        <Line className='h-3.5 w-56' />
        <Bone className='mt-6 h-84 w-full max-w-79 rounded-3xl' />
        <Bone className='mt-7 h-6 w-3/5 rounded-full' />
        <Line className='mt-3 w-4/5' />
        <Line className='mt-2 w-2/3' />
        <Bone className='mt-8 h-12 w-full rounded-full' />
      </div>
    </main>
  )
}

/** Your reviews — two-column cards with the place, rating and review text. */
export function ReviewsPageSkeleton() {
  return (
    <main className='min-h-screen' aria-busy='true'>
      <div className='mx-auto grid max-w-5xl gap-4 px-4 py-6 md:grid-cols-2'>
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className='rounded-2xl bg-white p-4 shadow-sm'>
            <div className='flex items-start gap-3'>
              <Bone className='size-14 shrink-0 rounded-xl' />
              <div className='flex-1 space-y-2 pt-0.5'>
                <Line className='h-4 w-1/2' />
                <Line className='w-2/3' />
                <Line className='w-1/3' />
              </div>
              <Bone className='h-7 w-14 shrink-0 rounded-lg' />
            </div>
            <div className='mt-3 flex gap-2'>
              {['w-20', 'w-24'].map((w, n) => <Bone key={n} className={cn('h-6 rounded-full', w)} />)}
            </div>
            <Line className='mt-4 w-full' />
            <Line className='mt-2 w-3/4' />
          </div>
        ))}
      </div>
    </main>
  )
}

/** Membership (MembershipClient) — subtitle and the plan cards. */
export function MembershipPageSkeleton() {
  return (
    <main className='min-h-screen' aria-busy='true'>
      <div className='mx-auto max-w-5xl px-4 pt-1 pb-16 md:px-6'>
        <Line className='mb-6 ml-12.5 h-3.5 w-52' />
        <div className='grid gap-4.5 md:grid-cols-2'>
          {[0, 1, 2].map(i => <Bone key={i} className='h-110 rounded-3xl' />)}
        </div>
      </div>
    </main>
  )
}

/** Booking details (BookingDetailClient) — heading, then the booking column and a summary column. */
export function BookingDetailSkeleton() {
  return (
    <main className='min-h-screen bg-gray-50' aria-busy='true'>
      <div className='mx-auto max-w-5xl px-6 py-8 pb-16'>
        <div className='mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex-1 space-y-2.5'>
            <Line className='w-28' />
            <Bone className='h-7 w-64 rounded-full' />
            <Line className='w-52' />
          </div>
          <Bone className='h-8 w-28 rounded-full' />
        </div>
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
          <div className='flex flex-col gap-5 lg:col-span-2'>
            <div className='overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm'>
              <Bone className='h-40 rounded-none' />
              <div className='grid grid-cols-1 gap-4 p-5 sm:grid-cols-2'>
                {[0, 1, 2, 3].map(i => <Line key={i} className='h-3.5 w-3/4' />)}
              </div>
            </div>
            <Bone className='h-36 rounded-2xl' />
          </div>
          <div className='flex flex-col gap-5'>
            {[0, 1, 2].map(i => (
              <div key={i} className='rounded-2xl border border-gray-100 bg-white p-5 shadow-sm'>
                <Line className='h-4 w-1/2' />
                <Line className='mt-4 w-full' />
                <Line className='mt-2 w-2/3' />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

/** Dining mood / store category — back button, title, chips and, for stores, the sort row above the cards. */
export function CategoryPageSkeleton({ filters = false }: { filters?: boolean }) {
  return (
    <main className='min-h-screen pb-20 md:pb-16' aria-busy='true'>
      <div className='mx-auto max-w-7xl px-4 pt-6 md:px-8'>
        <div className='flex items-center gap-3.5'>
          <Bone className='size-9 shrink-0 rounded-full' />
          <Bone className='h-6 w-44 rounded-full' />
        </div>
        <Line className='mt-4 w-96 max-w-full' />
        <div className='mt-5 flex gap-2 overflow-hidden'>
          {['w-40', 'w-36', 'w-30', 'w-30', 'w-36', 'w-28', 'w-30'].map((w, i) => (
            <Bone key={i} className={cn('h-10.5 shrink-0 rounded-full', w)} />
          ))}
        </div>
        {filters && (
          <div className='mt-5 flex items-center justify-between gap-4'>
            <Bone className='h-6 w-28 rounded-full' />
            <div className='hidden gap-2 md:flex'>
              {['w-19', 'w-45', 'w-27', 'w-30'].map((w, i) => <Bone key={i} className={cn('h-8 rounded-full', w)} />)}
            </div>
          </div>
        )}
        <div className='mt-5 flex flex-wrap justify-center gap-4 md:justify-start'>
          {Array.from({ length: 6 }, (_, i) => <MerchantCardSkeleton key={i} />)}
        </div>
      </div>
    </main>
  )
}

/** Account screens without a dedicated skeleton (checkout, booking payment). */
export function AccountPageSkeleton() {
  return (
    <main className='min-h-screen' aria-busy='true'>
      <div className='mx-auto max-w-2xl px-4 pt-6 pb-16'>
        <Bone className='h-44 rounded-3xl' />
        <div className='mt-4 divide-y divide-gray-100 rounded-2xl border border-gray-100 bg-white px-4'>
          {[0, 1, 2].map(i => <LedgerRow key={i} />)}
        </div>
        <Bone className='mt-6 h-12 rounded-full' />
      </div>
    </main>
  )
}

/**
 * app/(account)/profile — same frame as the page: design px via PROFILE_UNIT,
 * navy overview card, 3 stat cards, menu on the left (last on phones), then
 * active bookings, category tiles and recent activity.
 */
export function ProfilePageSkeleton() {
  const heading = 'h-28 w-260 rounded-[calc(8*var(--u))]'
  return (
    <main
      aria-busy='true'
      className={cn('min-h-screen bg-white px-16 pt-16 pb-76 lg:px-172 lg:pt-76', PROFILE_UNIT)}
    >
      {/* Back */}
      <Bone className='h-40 w-100 rounded-[calc(10*var(--u))]' />

      {/* overview */}
      <div className='mt-16 flex h-224 flex-col justify-center gap-10 rounded-[calc(24*var(--u))] bg-[#0A1A4D] px-24 lg:mt-24 lg:px-40'>
        <div className='h-36 w-260 animate-pulse rounded-[calc(8*var(--u))] bg-white/15' />
        <div className='h-18 w-220 animate-pulse rounded-full bg-white/15' />
        <div className='h-18 w-130 animate-pulse rounded-full bg-white/15' />
        <div className='mt-14 h-27.5 w-122.5 animate-pulse rounded-full bg-white/25' />
      </div>

      {/* stat cards */}
      <div className='-mx-16 mt-24 flex gap-12 overflow-hidden px-16 lg:mx-0 lg:mt-32 lg:grid lg:grid-cols-3 lg:gap-24 lg:px-0'>
        {[0, 1, 2].map(i => <Bone key={i} className='h-200 w-[min(calc(509*var(--u)),82vw)] shrink-0 rounded-[calc(20*var(--u))] lg:w-auto' />)}
      </div>

      <div className='mt-32 flex flex-col gap-40 lg:mt-48 lg:flex-row lg:items-start'>
        {/* menu */}
        <div className='order-last flex flex-col gap-32 lg:order-first lg:w-356 lg:shrink-0'>
          {[4, 3, 3].map((rows, g) => (
            <div key={g} className='flex flex-col gap-16'>
              <Bone className='mx-4 h-20 w-90 rounded-full' />
              <div className='rounded-[calc(24*var(--u))] border border-[#F2F4F4] bg-white'>
                {Array.from({ length: rows }, (_, r) => (
                  <div key={r} className={cn('flex h-56 items-center gap-12 px-16', r > 0 && 'border-t border-[#F2F4F4]')}>
                    <Bone className='size-24 rounded-[calc(6*var(--u))]' />
                    <Bone className='h-16 w-160 rounded-full' />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className='min-w-0 flex-1'>
          {/* active bookings */}
          <Bone className={heading} />
          <div className='-mx-16 mt-20 -mb-24 flex gap-20 overflow-hidden px-16 pb-24 lg:mx-0 lg:px-0'>
            {[0, 1, 2].map(i => (
              <div key={i} className='h-229 w-528 shrink-0 overflow-hidden rounded-[calc(25.83*var(--u))] bg-white shadow-[0_calc(6.46*var(--u))_calc(19.37*var(--u))_rgba(0,0,0,0.15)] max-lg:[--spacing:min(1px,calc((100vw_-_48px)/528))]'>
                <Bone className='h-150 rounded-none' />
                <div className='flex h-79 items-center gap-40 px-26'>
                  {[0, 1, 2].map(j => <Bone key={j} className='h-22 w-110 rounded-full' />)}
                </div>
              </div>
            ))}
          </div>

          {/* bookings & transactions */}
          <Bone className={cn(heading, 'mt-38')} />
          <div className='-mx-16 mt-20 -mb-24 flex gap-18 overflow-hidden px-16 pb-24 lg:mx-0 lg:gap-30 lg:px-0'>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className='flex size-172 shrink-0 flex-col items-center justify-center gap-17 rounded-[calc(20.65*var(--u))] bg-white shadow-[0_calc(6.6*var(--u))_calc(15.2*var(--u))_rgba(0,0,0,0.1)] max-lg:[--spacing:0.62px]'>
                <Bone className='h-100 w-90 rounded-[calc(16*var(--u))]' />
                <Bone className='h-20 w-80 rounded-full' />
              </div>
            ))}
          </div>
          <div className='mt-26 flex justify-end'>
            <Bone className='h-43 w-300 rounded-full' />
          </div>

          {/* recent activity */}
          <Bone className={cn(heading, 'mt-53')} />
          <div className='mt-22 h-29 border-b border-[#FFD9C7]' />
          <div className='mt-17 flex flex-col gap-6'>
            {[0, 1, 2, 3].map(i => (
              <div key={i} className='flex h-76 border-b border-[#F0F0F0] pt-4 pr-16 pl-16 lg:pr-57'>
                <div className='flex flex-1 flex-col gap-8'>
                  <Bone className='h-14 w-150 rounded-full' />
                  <Bone className='h-12 w-230 rounded-full' />
                  <Bone className='h-12 w-110 rounded-full' />
                </div>
                <div className='flex w-93 flex-col gap-10'>
                  <Bone className='h-14 w-70 rounded-full' />
                  <Bone className='h-26 w-93 rounded-full' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
