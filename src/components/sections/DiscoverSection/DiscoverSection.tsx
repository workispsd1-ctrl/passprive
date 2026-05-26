import Image from 'next/image';
import { Search } from 'lucide-react';

const DISCOVER_POINTS = [
  "6,00,000+ restaurants across India's top cities – from hole-in-the-wall to five-star",
  'Curated lists for every mood: date nights, family lunches, quick bites before work',
  "Browse by mood, cuisine, neighbourhood, occasion, or what's on offer tonight",
  'Full menus, photos, and real vibes – no guesswork, no surprises',
  'Loved and reviewed by diners everywhere you go',
];

export function DiscoverSection() {
  return (
    <section
      aria-labelledby='discover-heading'
      className='py-5 px-4 md:py-20 md:px-6'
    >
        <div className='grid grid-cols-1 bg-white rounded-3xl overflow-hidden shadow-sm md:bg-transparent md:shadow-none md:rounded-none md:overflow-visible md:grid-cols-2 md:gap-16 md:items-center'>


          <div className='relative w-full aspect-video md:aspect-square rounded-none md:rounded-2xl overflow-hidden bg-gray-300'>
            <Image
              src='/images/discover-dining.jpg'
              alt='Atmospheric restaurant interior with wine glasses and warm bokeh lighting'
              fill
              className='object-cover'
              sizes='(max-width: 768px) 100vw, 50vw'
            />
          </div>


          <div className='bg-white md:bg-transparent p-5 md:p-0 flex flex-col gap-4'>
            <div className='flex items-center gap-2 text-purple-500'>
              <Search className='w-5 h-5 md:w-6 md:h-6' aria-hidden='true' />
              <span className='text-xl md:text-3xl font-bold tracking-wide'>Discover</span>
            </div>

            <h2
              id='discover-heading'
              className='text-base md:text-2xl font-bold text-gray-900 leading-tight'
            >
              <span className='font-extrabold'>Explore dining experiences </span>
              <span className='italic bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent'>
                tailored to your mood.
              </span>
            </h2>

            <ul className='flex flex-col gap-2 md:gap-3 mt-1'>
              {DISCOVER_POINTS.map((point, i) => (
                <li
                  key={point}
                  className={`flex items-start gap-3 text-sm md:text-base font-semibold text-gray-500 leading-normal ${i >= 2 ? 'hidden md:flex' : ''}`}
                >
                  <span
                    className='mt-1.75 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0'
                    aria-hidden='true'
                  />
                  {point}
                </li>
              ))}
            </ul>
          </div>

        </div>
    </section>
  );
}
