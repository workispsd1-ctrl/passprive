interface Props {
  description: string | null | undefined
  cuisineLabel: string
  facilityTags: string[]
}

export function RestaurantInfoCards({ description, cuisineLabel, facilityTags }: Props) {
  if (!description && !cuisineLabel && facilityTags.length === 0) return null

  return (
    <div className='flex gap-4 mt-7 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1'>
      {description && (
        <div className='shrink-0 w-72 border border-gray-200 rounded-2xl p-5 bg-white'>
          <div className='flex items-center gap-2.5 mb-3'>
            <span className='text-[22px]'>💎</span>
            <span className='text-[14px] font-bold text-gray-900'>About the place</span>
          </div>
          <p className='text-[13px] text-gray-500 leading-relaxed line-clamp-3'>{description}</p>
          <button type='button' className='text-[13px] text-gray-500 mt-2 hover:text-gray-700'>
            view more
          </button>
        </div>
      )}
      {cuisineLabel && (
        <div className='shrink-0 w-72 border border-gray-200 rounded-2xl p-5 bg-white'>
          <div className='flex items-center gap-2.5 mb-3'>
            <span className='text-[22px]'>🍲</span>
            <span className='text-[14px] font-bold text-gray-900'>Must tries dishes and cuisines</span>
          </div>
          <p className='text-[13px] text-gray-500 leading-relaxed line-clamp-3'>{cuisineLabel}</p>
          <button type='button' className='text-[13px] text-gray-500 mt-2 hover:text-gray-700'>
            view more
          </button>
        </div>
      )}
      {facilityTags.length > 0 && (
        <div className='shrink-0 w-72 border border-gray-200 rounded-2xl p-5 bg-white'>
          <div className='flex items-center gap-2.5 mb-3'>
            <span className='text-[22px]'>✨</span>
            <span className='text-[14px] font-bold text-gray-900'>Must try experiences</span>
          </div>
          <p className='text-[13px] text-gray-500 leading-relaxed line-clamp-3'>
            {facilityTags.slice(0, 4).join(', ')}
          </p>
          <button type='button' className='text-[13px] text-gray-500 mt-2 hover:text-gray-700'>
            view more
          </button>
        </div>
      )}
    </div>
  )
}
