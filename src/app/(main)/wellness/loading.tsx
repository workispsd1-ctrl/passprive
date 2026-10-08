import { Bone, CircleCardSkeleton, MerchantCardSkeleton, RailSkeleton } from '@/components/shared/Skeletons'

/**
 * Wellness home skeleton, in the page's section order (see wellness/page.tsx).
 * The hero lives in the header, which stays rendered while this shows.
 */
export default function WellnessLoading() {
  return (
    <main className='min-h-screen pb-20 md:pb-0' aria-busy='true'>
      <RailSkeleton titleWidth='w-36'>{i => <MerchantCardSkeleton key={i} />}</RailSkeleton>
      <RailSkeleton titleWidth='w-36' count={7}>
        {i => <CircleCardSkeleton key={i} size='w-40 2xl:w-52' />}
      </RailSkeleton>
      <RailSkeleton titleWidth='w-52'>{i => <MerchantCardSkeleton key={i} />}</RailSkeleton>
      {/* WellnessGlowUpSection — full-bleed peach banner with a card rail */}
      <section className='relative left-1/2 my-4 w-screen -translate-x-1/2 bg-[#FFF1E7] pt-[21%] pb-4 md:pt-[max(7rem,8%)]' aria-hidden>
        <div className='mx-auto flex max-w-7xl gap-4 overflow-hidden px-4 pt-3 pb-8 md:px-8'>
          {[0, 1, 2, 3, 4].map(i => <MerchantCardSkeleton key={i} />)}
        </div>
      </section>
      <RailSkeleton titleWidth='w-32'>{i => <MerchantCardSkeleton key={i} />}</RailSkeleton>
    </main>
  )
}
