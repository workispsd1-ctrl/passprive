import { Bone, CircleCardSkeleton, MerchantCardSkeleton, OfferCardSkeleton, RailSkeleton, TileSkeleton } from '@/components/shared/Skeletons'

/** Dining home skeleton, in the page's section order (see dining/page.tsx). */
export default function DiningLoading() {
  return (
    <main aria-busy='true'>
      {/* HeroSection headline */}
      <div className='flex flex-col items-center gap-3 px-4 pt-10 pb-6 md:px-6 md:pt-16 md:pb-10' aria-hidden>
        <Bone className='h-8 w-72 rounded-full md:h-11 md:w-xl' />
        <Bone className='h-8 w-56 rounded-full md:h-11 md:w-md' />
      </div>
      <RailSkeleton titleWidth='w-48' count={8} gap='gap-3'>{i => <TileSkeleton key={i} />}</RailSkeleton>
      {/* QuickFilterTiles */}
      <RailSkeleton titleWidth={null} count={7} gap='gap-3'>
        {i => <Bone key={i} className='aspect-106/120 w-38 shrink-0 rounded-[24px] 2xl:w-52.5 2xl:rounded-[32px]' />}
      </RailSkeleton>
      {/* PromotionalCollectionsSection banner */}
      <section className='mx-auto max-w-7xl px-4 py-4 md:px-8 2xl:max-w-394' aria-hidden>
        <Bone className='min-h-130 rounded-[20px] md:min-h-150' />
      </section>
      <RailSkeleton>{i => <MerchantCardSkeleton key={i} />}</RailSkeleton>
      <RailSkeleton titleWidth='w-36'>{i => <CircleCardSkeleton key={i} />}</RailSkeleton>
      <RailSkeleton>{i => <MerchantCardSkeleton key={i} />}</RailSkeleton>
      <RailSkeleton>{i => <MerchantCardSkeleton key={i} />}</RailSkeleton>
      <RailSkeleton count={6}>{i => <OfferCardSkeleton key={i} />}</RailSkeleton>
    </main>
  )
}
