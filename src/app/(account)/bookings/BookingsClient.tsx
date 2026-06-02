'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Navigation } from 'lucide-react'
import type { DiningBooking } from '@/lib/types/bookings'

type Tab = 'dining' | 'store'

function formatDateTime(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number)
  const [hour, minute] = time.split(':').map(Number)
  const d = new Date(year, month - 1, day)
  const monthName = d.toLocaleDateString('en-GB', { month: 'short' })
  const period = hour >= 12 ? 'PM' : 'AM'
  const h = hour % 12 === 0 ? 12 : hour % 12
  const m = minute.toString().padStart(2, '0')
  return `${day} ${monthName} at ${h}:${m} ${period}`
}

function getStatusBadge(status: string, bookingDate: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [y, mo, d] = bookingDate.split('-').map(Number)
  const bDate = new Date(y, mo - 1, d)
  const isPast = bDate < today

  if (status === 'cancelled') return { label: 'Cancelled', className: 'bg-gray-100 text-gray-500' }
  if (status === 'confirmed' && isPast) return { label: 'Expired', className: 'bg-gray-100 text-gray-500' }
  if (status === 'confirmed') return { label: 'Confirmed', className: 'bg-green-100 text-green-600' }
  if (status === 'pending') return { label: 'Pending', className: 'bg-amber-100 text-amber-600' }
  return { label: status, className: 'bg-gray-100 text-gray-500' }
}

function BookingCard({ booking }: { booking: DiningBooking }) {
  const restaurant = booking.restaurants
  const badge = getStatusBadge(booking.status, booking.booking_date)
  const location = restaurant?.area ?? restaurant?.full_address ?? restaurant?.name ?? '—'

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className="flex gap-3 p-4">
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-tight">{restaurant?.name ?? '—'}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{booking.party_size} {booking.party_size === 1 ? 'guest' : 'guests'}</p>
          </div>

          <div className="flex flex-col gap-2">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Date and Time</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">
                {formatDateTime(booking.booking_date, booking.booking_time)}
              </p>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Location</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{location}</p>
              </div>
              <button
                type="button"
                aria-label="Get directions"
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors text-gray-400 shrink-0"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-200 shrink-0 self-start">
          {restaurant?.cover_image ? (
            <Image
              src={restaurant.cover_image}
              alt={restaurant.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
          {badge.label}
        </span>
        <Link
          href={`/dining/${restaurant?.slug ?? booking.restaurant_id}`}
          className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          View details
          <span aria-hidden="true">›</span>
        </Link>
      </div>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="text-gray-400 text-sm">No {label} bookings yet.</p>
    </div>
  )
}

export function BookingsClient({ diningBookings }: { diningBookings: DiningBooking[] }) {
  const [tab, setTab] = useState<Tab>('dining')

  return (
    <div>
      <div className="flex justify-center gap-2 py-5">
        {(['dining', 'store'] as Tab[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-5 py-1.5 rounded-full text-sm font-medium transition-colors ${
              tab === t
                ? 'bg-violet-100 text-violet-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'dining' ? 'Dining' : 'Store'}
          </button>
        ))}
      </div>

      <div className="px-4 pb-10 flex flex-col gap-4 max-w-xl mx-auto">
        {tab === 'dining' ? (
          diningBookings.length > 0
            ? diningBookings.map(b => <BookingCard key={b.id} booking={b} />)
            : <EmptyState label="dining" />
        ) : (
          <EmptyState label="store" />
        )}
      </div>
    </div>
  )
}
