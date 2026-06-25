'use client';

import Link from 'next/link';

interface Props {
  placeId: string;
  placeName: string;
  bookingEnabled: boolean;
  slug: string | null;
}

export function TouristBookingWidget({ placeId, placeName, bookingEnabled, slug }: Props) {
  if (!bookingEnabled) return null;

  const bookUrl = `/tourist/${slug ?? placeId}/book`;

  return (
    <>
      {/* Desktop sidebar — Book visits CTA */}
      <div className="hidden md:block sticky top-20 pt-4">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 flex flex-col gap-4">
          <div>
            <h2 className="text-[17px] font-extrabold text-gray-900">Book visits</h2>
            <p className="text-sm text-gray-500 mt-1">Plan your tour at {placeName}</p>
          </div>
          <Link
            href={bookUrl}
            className="block w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold text-[14px] text-center hover:bg-black hover:shadow-md transition-all"
          >
            Book ticket
          </Link>
        </div>
      </div>

      {/* Mobile sticky bottom CTA */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-4 z-20 shadow-lg">
        <Link
          href={bookUrl}
          className="block w-full py-3.5 rounded-2xl bg-gray-900 text-white font-bold text-[15px] text-center hover:bg-black transition-colors"
        >
          Book visits
        </Link>
      </div>
    </>
  );
}
