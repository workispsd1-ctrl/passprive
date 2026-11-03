import { Bone, CircleCardSkeleton, MerchantCardSkeleton, PosterCardSkeleton, RailSkeleton, TileSkeleton } from '@/components/shared/Skeletons'

/** Shopping home skeleton, in the page's section order (see stores/page.tsx). */
export default function StoresLoading() {
  return (
    <main className='min-h-screen pb-20 md:pb-0' aria-busy='true'>
      <div className='mx-auto mb-8 max-w-350 px-4 pt-4 md:px-12' aria-hidden>
        <Bone className='aspect-1606/606 rounded-2xl' />
      </div>
      <RailSkeleton titleWidth={null} count={8} gap='gap-3'>{i => <TileSkeleton key={i} />}</RailSkeleton>
      <RailSkeleton count={4}>
        {i => <PosterCardSkeleton key={i} size='w-[42%] md:w-80 2xl:w-105' />}
      </RailSkeleton>
      <RailSkeleton titleWidth='w-48'>{i => <CircleCardSkeleton key={i} />}</RailSkeleton>
      <section className='mx-auto max-w-7xl px-4 py-4 md:px-8' aria-hidden>
        <Bone className='min-h-130 rounded-[20px] md:min-h-150' />
      </section>
      <RailSkeleton titleWidth='w-32'>{i => <MerchantCardSkeleton key={i} />}</RailSkeleton>
    </main>
  )
}
