import { BannerSkeleton, CategoryChipSkeleton, CircleCardSkeleton, MerchantCardSkeleton, PlaceCardSkeleton, RailSkeleton } from '@/components/shared/Skeletons'

/**
 * Tourist home skeleton, in the page's section order (see tourist/page.tsx and
 * TouristHomeClient). The hero lives in the header, which stays rendered.
 */
export default function TouristLoading() {
  return (
    <main className='min-h-screen bg-white pb-20 md:pb-0' aria-busy='true'>
      {/* Hire Taxis strip: app art on phones, wide desktop art from md */}
      <BannerSkeleton aspect='aspect-[1432/500] md:aspect-[6304/500]' className='max-w-3xl md:max-w-7xl' />
      <RailSkeleton titleWidth='w-48' count={8} gap='gap-3 md:gap-4'>{i => <CategoryChipSkeleton key={i} />}</RailSkeleton>
      <RailSkeleton titleWidth='w-60' subtitle>{i => <PlaceCardSkeleton key={i} />}</RailSkeleton>
      <RailSkeleton titleWidth='w-36'>{i => <MerchantCardSkeleton key={i} />}</RailSkeleton>
      <RailSkeleton titleWidth='w-56' subtitle>{i => <PlaceCardSkeleton key={i} />}</RailSkeleton>
      <RailSkeleton titleWidth='w-48' count={6}>{i => <CircleCardSkeleton key={i} size='w-40 md:w-44' />}</RailSkeleton>
      <BannerSkeleton aspect='aspect-[1432/500] md:aspect-[6304/656]' className='max-w-3xl md:max-w-7xl' />
      <RailSkeleton titleWidth='w-44'>{i => <PlaceCardSkeleton key={i} />}</RailSkeleton>
    </main>
  )
}
