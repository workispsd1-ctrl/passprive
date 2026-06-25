interface Props {
  costForTwo: number | null | undefined
  cuisineLabel: string
  facilityTags: string[]
}

export function RestaurantAboutSection({ costForTwo, cuisineLabel, facilityTags }: Props) {
  return (
    <section className='mt-8 border-t border-gray-100 pt-6'>
      <h2 className='text-[18px] font-bold text-gray-900 mb-5'>About the restaurant</h2>
      <div className='space-y-4'>
        {costForTwo != null && (
          <div>
            <p className='font-semibold text-gray-900 mb-0.5'>Cost</p>
            <p className='text-sm font-semibold text-gray-500'>₨{costForTwo.toLocaleString()} for two</p>
          </div>
        )}
        {cuisineLabel && (
          <div>
            <p className='font-semibold text-gray-900 mb-0.5'>Cuisines</p>
            <p className='text-sm font-semibold text-gray-500'>{cuisineLabel}</p>
          </div>
        )}
        {facilityTags.length > 0 && (
          <div>
            <p className='font-semibold text-gray-900 mb-2.5'>Available facilities</p>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4'>
              {facilityTags.map(f => (
                <div key={f} className='flex items-center gap-1.5'>
                  <span className='w-1.5 h-1.5 rounded-full bg-gray-500 shrink-0' />
                  <span className='text-sm text-gray-500 font-semibold'>{f}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
