import Image from 'next/image';
import { HeroSearchBar } from './HeroSearchBar';

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
        <span className='bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent'>
          all in one place.
        </span>
      </h1>

      <div className='relative mt-4 w-full overflow-hidden rounded-2xl min-h-[30vh] sm:min-h-[55vh] md:min-h-[44vh]'>
        <Image
          src='/hero-banner.png'
          alt='Dining Experience'
          fill
          priority
          className='object-cover object-center'
        />

        <div className='absolute left-1/2 bottom-16 -translate-x-1/2 z-10 w-full max-w-xl px-4'>
          <HeroSearchBar />
        </div>
      </div>
    </section>
  );
}
