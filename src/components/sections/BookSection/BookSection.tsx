import Image from 'next/image';
import { CalendarDays } from 'lucide-react';

const BOOK_POINTS = [
  'Book in under 60 seconds, show up and walk in.',
  'Explore available tables across your favourite restaurants.',
  'Peak hour slots at the places that are hardest to get into.',
  'Curated packages for special occasions, anniversaries and everything in between.',
  'Cancel or reschedule easily – plans change, we get it.',
];

export function BookSection() {
  return (
    <section
      aria-labelledby='book-heading'
      className='py-5 px-4 md:py-20 md:px-6'
    >
        <div className='grid grid-cols-1 bg-white rounded-3xl overflow-hidden shadow-sm md:bg-transparent md:shadow-none md:rounded-none md:overflow-visible md:grid-cols-2 md:gap-16 md:items-center'>


          <div className='order-2 md:order-1 bg-white md:bg-transparent p-5 md:p-0 flex flex-col gap-6'>
            <div className='flex items-center gap-2 text-purple-500'>
              <CalendarDays className='w-5 h-5 md:w-7 md:h-7' aria-hidden='true' />
              <span className='text-xl md:text-3xl font-bold tracking-wide'>Book</span>
            </div>

            <h2
              id='book-heading'
              className='text-base md:text-2xl font-bold text-gray-900 leading-tight'
            >
              <span className='font-extrabold'>Find the table </span>
              <span className='italic bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent'>
                that fits the moment.
              </span>
            </h2>

            <ul className='flex flex-col gap-2 md:gap-3 mt-1'>
              {BOOK_POINTS.map((point, i) => (
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


          <div className='order-1 md:order-2 relative w-full aspect-video md:aspect-square rounded-none md:rounded-2xl overflow-hidden bg-gray-200'>
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
