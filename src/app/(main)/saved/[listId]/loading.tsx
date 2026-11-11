import { Bone } from '@/components/shared/Skeletons'
import { FAV_PAGE } from '@/components/favourites/unit'

/** List detail skeleton — page header, meta line and venue cards (see ListDetailClient). */
export default function SavedListLoading() {
  return (
    <main className={FAV_PAGE} aria-busy='true'>
      <div className='flex h-112 items-center gap-20 border-b border-[#EBEBEB] px-172 max-lg:h-64 max-lg:gap-12 max-lg:px-16'>
        <Bone className='size-44 rounded-full max-lg:size-36' />
        <Bone className='h-32 w-260 rounded-full max-lg:h-24 max-lg:w-160' />
      </div>
      <div className='flex flex-col gap-32 px-172 pt-40 pb-80 max-lg:gap-16 max-lg:px-16 max-lg:pt-16'>
        <Bone className='h-18 w-220 rounded-full' />
        <div className='grid grid-cols-2 gap-24 max-lg:grid-cols-1 max-lg:gap-12'>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className='flex h-176 items-center gap-20 rounded-[calc(16*var(--u))] border border-[#EBEBEB] p-16 max-lg:h-auto max-lg:gap-12 max-lg:p-10'>
              <Bone className='size-144 shrink-0 rounded-[calc(12*var(--u))] max-lg:size-80' />
              <div className='flex flex-1 flex-col gap-10'>
                <Bone className='h-20 w-180 rounded-full' />
                <Bone className='h-14 w-240 rounded-full' />
                <Bone className='h-14 w-120 rounded-full' />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
