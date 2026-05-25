import { Percent } from 'lucide-react';
import Image from 'next/image'

const PAY_POINTS = [
  'Up to 50% OFF your dining bill',
  'On-the-house complimentary dishes and drinks at select restaurants',
  'Bank offers that layer on top – so your final bill is lower than you expected',
  'No effort required – your savings are applied automatically when you pay',
]

export function PaySection() {
  return (
    <section
      aria-labelledby='pay-heading'
      className='bg-[#f7f7f7] py-10 px-4 md:py-20 md:px-6'
    >
      <div className='mx-auto max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center'>
        {/* Image */}
        <div className='relative w-full aspect-3/3 rounded-2xl overflow-hidden bg-gray-200'>
          <Image
            src='/images/pay-dining.jpg'
            alt='Elegant dining table with premium tableware'
            fill
            className='object-cover'
            sizes='(max-width: 768px) 100vw, 50vw'
          />
        </div>

        {/* Content */}
        <div className='flex flex-col gap-6'>
          <div className='flex items-center gap-2'>
            <div className='flex items-center gap-2 text-purple-500'>
              <Percent
                className='w-7 h-7'
                aria-hidden='true'
              />
              <span className='text-3xl font-bold tracking-wide '>Pay</span>
            </div>
          </div>

          <h2
            id='pay-heading'
            className='text-2xl italic font-bold text-gray-900 leading-tight'
          >
            <span className='font-extrabold'>Walk in knowing the </span>
            <span className='italic bg-linear-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent'>
              best deal is already on your table.
            </span>
          </h2>

          <ul className='flex flex-col gap-3 mt-1'>
            {PAY_POINTS.map((point) => (
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
