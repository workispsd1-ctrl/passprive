import { MerchantCardSkeleton, CircleCardSkeleton, OfferCardSkeleton, PosterCardSkeleton, RailSkeleton, Bone } from '@/components/shared/Skeletons'

/**
 * Home page skeleton, in the page's section order (see app/(main)/page.tsx).
 * The hero lives in the header, which stays rendered while this shows.
 */
export default function MainLoading() {
  return (
    <main className='min-h-screen bg-white pb-10' aria-busy='true'>
      <RailSkeleton>{i => <MerchantCardSkeleton key={i} />}</RailSkeleton>
      {/* StampsGiftPromo */}
      <section className='px-4 py-6 md:px-8' aria-hidden>
        <div className='mx-auto max-w-394'>
          <Bone className='aspect-43/15 max-w-2xl rounded-[20px]' />
        </div>
      </section>
      <RailSkeleton className='relative left-1/2 w-screen -translate-x-1/2 bg-[#FFF7F2]' count={6}>
        {i => <OfferCardSkeleton key={i} />}
      </RailSkeleton>
      <RailSkeleton titleWidth='w-36'>{i => <CircleCardSkeleton key={i} />}</RailSkeleton>
      <RailSkeleton>{i => <MerchantCardSkeleton key={i} />}</RailSkeleton>
      <RailSkeleton className='relative left-1/2 w-screen -translate-x-1/2 bg-[#FFF7F2]' titleWidth='w-52'>
        {i => <MerchantCardSkeleton key={i} />}
      </RailSkeleton>
      <RailSkeleton count={4}>{i => <PosterCardSkeleton key={i} />}</RailSkeleton>
    </main>
  )
}
