import { Bone } from '@/components/shared/Skeletons'
import { FAV_PAGE } from '@/components/favourites/unit'

/** Favourites skeleton — page header and the list-card grid (see FavouritesClient). */
export default function SavedLoading() {
  return (
    <main className={FAV_PAGE} aria-busy='true'>
      <div className='flex h-112 items-center gap-20 border-b border-[#EBEBEB] px-172 max-lg:h-64 max-lg:gap-12 max-lg:px-16'>
        <Bone className='size-44 rounded-full max-lg:size-36' />
        <Bone className='h-32 w-200 rounded-full max-lg:h-24 max-lg:w-140' />
      </div>
      <div className='grid grid-cols-2 gap-24 px-172 pt-40 pb-80 max-lg:grid-cols-1 max-lg:gap-16 max-lg:px-16 max-lg:pt-20'>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className='flex flex-col gap-20 rounded-[calc(16*var(--u))] border border-[#EBEBEB] p-20 max-lg:gap-12 max-lg:p-12'>
            <div className='flex h-186 gap-8 max-lg:h-96 max-lg:gap-4'>
              {[0, 1, 2].map(j => <Bone key={j} className='flex-1 rounded-[calc(12*var(--u))]' />)}
            </div>
            <div className='flex flex-col gap-8'>
              <Bone className='h-20 w-180 rounded-full' />
              <Bone className='h-14 w-240 rounded-full' />
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
