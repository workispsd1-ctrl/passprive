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
      className='bg-[#f7f7f7] py-10 px-4 md:py-20 md:px-6'
    >
      <div className='mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center'>
        {/* Restaurant image */}
        <div className='relative w-full aspect-3/3 rounded-2xl overflow-hidden bg-gray-300'>
          <Image
            src='/images/discover-dining.jpg'
            alt='Atmospheric restaurant interior with wine glasses and warm bokeh lighting'
            fill
            className='object-cover'
            sizes='(max-width: 768px) 100vw, 50vw'
          />
        </div>

        {/* Content */}
        <div className='flex flex-col gap-4'>
          <div className='flex items-center gap-2 text-purple-500'>
            <Search
              className='w-6 h-6 '
              aria-hidden='true'
            />
            <span className='text-3xl font-bold tracking-wide  '>Discover</span>
          </div>

          <h2
            id='discover-heading'
            className='text-2xl italic font-bold text-gray-900 leading-tight'
          >
            <span className='font-extrabold'>Explore dining experiences </span>
            <span className=' italic bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent'>
              tailored to your mood
            </span>
          </h2>

          <ul className='flex flex-col gap-3 mt-1'>
            {DISCOVER_POINTS.map((point) => (
              <li
                key={point}
                className='flex items-start gap-3 text-base font-semibold text-gray-500 leading-[1.5]'
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
