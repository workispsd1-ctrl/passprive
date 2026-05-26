import { HeroSearchBar } from './HeroSearchBar'

export function HeroSection() {
  return (
    <section
      aria-labelledby='hero-heading'
      className='bg-white pt-10 pb-6 px-4 md:pt-20 md:pb-16 md:px-6 text-center'
    >

        <h1
          id='hero-heading'
          className='text-[1.2rem] md:text-[2.6rem] font-bold text-gray-900 leading-[1.4] tracking-normal'
        >
          Discover restaurants, explore
          <br />
          menus book tables, pay bills—
          <span className='bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent'>all in one place.</span>
        </h1>


        <div className='mt-4 relative w-full rounded-2xl overflow-hidden bg-[#111111] min-h-[30vh] sm:min-h-[55vh] md:min-h-[44vh] flex flex-col items-center justify-end md:justify-center gap-7 sm:px-8 px-4 sm:py-12 py-4 shadow-md shadow-gray-400'>
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

          <div className='relative z-10 w-full max-w-xl'>
            <HeroSearchBar />
          </div>
        </div>
    </section>
  );
}
