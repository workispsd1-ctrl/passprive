import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, Users } from 'lucide-react'
import { HScroll } from './HScroll'
import type { DiningBooking } from '@/lib/types/bookings'

function formatWhen(date: string, time: string) {
  const d = new Date(`${date}T${time}`)
  if (Number.isNaN(d.getTime())) return `${date} ${time}`
  return `${d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
}

/** Home strip of the signed-in user's next bookings — app parity: Home/UpcomingBookings.jsx. */
export function UpcomingBookings({ bookings }: { bookings: DiningBooking[] }) {
  if (!bookings.length) return null

  return (
    <HScroll title="Upcoming bookings">
      {bookings.map((b) => (
        <Link
          key={b.id}
          href={`/bookings/${b.id}`}
          className="flex w-72 shrink-0 gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-[0px_4.8px_20.4px_0px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-md"
        >
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
            {b.restaurants?.cover_image && (
              <Image src={b.restaurants.cover_image} alt="" fill className="object-cover" sizes="80px" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-[#383838]">{b.restaurants?.name ?? 'Restaurant'}</p>
            <p className="mt-1 flex items-center gap-1 text-xs text-[#383838]">
              <CalendarDays className="h-3 w-3 shrink-0" /> {formatWhen(b.booking_date, b.booking_time)}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-[#878787]">
              <Users className="h-3 w-3 shrink-0" /> {b.party_size} guests
              <span className="ml-1 rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-semibold capitalize text-green-700">
                {b.status}
              </span>
            </p>
          </div>
        </Link>
      ))}
    </HScroll>
  )
}
