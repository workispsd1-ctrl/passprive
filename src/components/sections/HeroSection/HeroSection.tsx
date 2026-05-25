import { ArrowRight, Search } from 'lucide-react';

export function HeroSection() {
  return (
    <section
      aria-labelledby='hero-heading'
      className='bg-white pt-8 pb-10 px-4 md:pt-20 md:pb-16 md:px-6'
    >
      <div className='mx-auto max-w-6xl text-center'>
        {/* Headline */}
        <h1
          id='hero-heading'
          className='text-[1.2rem] md:text-[2.6rem] font-bold text-gray-900 leading-[1.4] tracking-normal'
        >
          Discover restaurants, explore
          <br />
          menus book tables, pay bills—
          <span className='bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent'>all in one place.</span>
        </h1>

        {/* Dark search card */}
        <div className='mt-10 relative w-full rounded-2xl overflow-hidden bg-[#111111] min-h-[34vh] sm:min-h-[55vh] flex flex-col items-center justify-end md:justify-center gap-7 px-8 py-12'>
          {/* Subtle image overlay */}
          <div
            className='absolute inset-0 hero-bg-image bg-cover bg-center opacity-25'
            aria-hidden='true'
          />

          <div className='relative z-10 text-center space-y-2 hidden md:block'>
            <p className='text-2xl md:text-3xl font-bold text-white tracking-normal'>
              Seamlessly Crafted
            </p>
            <p className='text-3xl md:text-4xl font-bold text-white leading-tight'>
              Dining Experiences
            </p>
          </div>

          {/* Search bar */}
          <div className='relative z-10 w-full max-w-xl'>
            <div className='flex items-center bg-white rounded-full overflow-hidden md:h-16 h-10 pr-1.5 pl-4 shadow-lg'>
              <Search
                className='w-4 h-4 text-gray-400 shrink-0'
                aria-hidden='true'
              />
              <input
                type='search'
                placeholder='Search for a restaurant name'
                aria-label='Search for a restaurant'
                className='flex-1 px-3 text-sm text-gray-800 bg-transparent outline-none placeholder:text-gray-500 sm:placeholder:text-sm  placeholder:text-xs font-medium  h-full'
              />
              <button
                type='submit'
                aria-label='Submit search'
                className='w-9 h-9 rounded-full bg-purple-500 hover:bg-purple-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer'
              >
                <ArrowRight
                  className='w-4 h-4 text-white'
                  aria-hidden='true'
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
