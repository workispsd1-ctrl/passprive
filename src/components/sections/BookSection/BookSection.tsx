import Image from 'next/image';
import { CalendarDays } from 'lucide-react';

const BOOK_POINTS = [
  'Explore available tables across your favorite restaurants.',
  'Peak hour slots at the places that are hardest to get into.',
  'Book in under 60 seconds, show up and walk in.',
  'Curated packages for special occasions, anniversaries and everything in between.',
  'Cancel or reschedule easily – plans change, we get it.',
];

export function BookSection() {
  return (
    <section
      aria-labelledby='book-heading'
      className='bg-white py-10 px-4 md:py-20 md:px-6'
    >
      <div className='mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center'>
        {/* Content */}
        <div className='order-2 md:order-1 flex flex-col gap-6'>
          <div className='flex items-center gap-2 text-purple-500'>
            <CalendarDays
              className='w-7 h-7'
              aria-hidden='true'
            />
            <span className='text-3xl font-bold tracking-wide '>Book</span>
          </div>

          <h2
            id='book-heading'
            className='text-2xl italic font-bold text-gray-900 leading-tight'
          >
            <span className='font-extrabold'>Find the table </span>
            <span className='italic bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent'>
              that fits the moment.
            </span>
          </h2>

          <ul className='flex flex-col gap-3 mt-1'>
            {BOOK_POINTS.map((point) => (
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

        {/* Image */}
        <div className='order-1 md:order-2 relative w-full aspect-3/3 rounded-2xl overflow-hidden bg-gray-200'>
          <Image
            src='/images/book-dining.jpg'
            alt='Restaurant table set for a special dining experience'
            fill
            className='object-cover'
            sizes='(max-width: 768px) 100vw, 50vw'
          />
        </div>
      </div>
    </section>
  );
}
