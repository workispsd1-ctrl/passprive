import { Bone, MerchantCardSkeleton } from '@/components/shared/Skeletons'

/** Favourites skeleton — heading, tab pills and the card grid (see SavedClient). */
export default function SavedLoading() {
  return (
    <main className='min-h-screen pb-20 md:pb-0' aria-busy='true'>
      <div className='mx-auto max-w-7xl px-4 py-6 md:px-8'>
        <Bone className='h-7 w-40 rounded-full' />
        <Bone className='mt-2 h-3.5 w-72 rounded-full' />
        <div className='mt-5 flex gap-2'>
          {['w-16', 'w-20', 'w-24', 'w-20'].map((w, i) => <Bone key={i} className={'h-8 rounded-full ' + w} />)}
        </div>
        <div className='mt-6 flex flex-wrap justify-center gap-5 md:justify-start'>
          {[0, 1, 2, 3].map(i => <MerchantCardSkeleton key={i} />)}
        </div>
      </div>
    </main>
  )
}
