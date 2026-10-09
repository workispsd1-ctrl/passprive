'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Navigation, Globe, Smartphone, Coins } from 'lucide-react'
import type { DiningBooking, StoreBooking } from '@/lib/types/bookings'
import { formatBookingDateTime } from '@/lib/utils/format'
import { cn } from '@/lib/utils'

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
                {formatBookingDateTime(booking.booking_date, booking.booking_time)}
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
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>
            {badge.label}
          </span>
          <span className="flex items-center gap-1 text-[11px] font-medium text-gray-400 px-2 py-1 rounded-full bg-gray-50 border border-gray-100">
            {booking.source === 'app'
              ? <><Smartphone className="w-3 h-3" /> App</>
              : <><Globe className="w-3 h-3" /> Web</>}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {(booking.status === 'confirmed' || booking.status === 'pending') && booking.restaurants?.merchant_type !== null && (
            <Link
              href={`/bookings/${booking.id}`}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-dark bg-brand-tint hover:bg-brand-tint-strong px-3 py-1.5 rounded-full transition-colors"
            >
              <Coins className="w-3.5 h-3.5" />
              Pay Bill
            </Link>
          )}
          <Link
            href={`/bookings/${booking.id}`}
            className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
          >
            View details
            <span aria-hidden="true">›</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

/** app parity: `store_orders.status` values */
function getStoreStatusBadge(status: string) {
  const s = status.toUpperCase()
  if (s === 'CANCELLED' || s === 'REJECTED') return { label: s === 'REJECTED' ? 'Rejected' : 'Cancelled', className: 'bg-gray-100 text-gray-500' }
  if (s === 'DELIVERED') return { label: 'Completed', className: 'bg-gray-100 text-gray-600' }
  if (s === 'ACCEPTED' || s === 'PREPARING' || s === 'READY') return { label: 'Confirmed', className: 'bg-green-100 text-green-600' }
  return { label: 'Pending', className: 'bg-amber-100 text-amber-600' }
}

function formatStoreWhen(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return `${d.getDate()} ${d.toLocaleDateString('en-GB', { month: 'short' })} at ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
}

const WELLNESS_CATEGORY = 'salon & wellness'

function storeHref(b: StoreBooking): string | null {
  if (!b.store) return null
  const key = b.store.slug ?? b.store.id
  return (b.store.category ?? '').trim().toLowerCase() === WELLNESS_CATEGORY ? `/wellness/${key}` : `/stores/${key}`
}

function StoreBookingCard({ booking }: { booking: StoreBooking }) {
  const store = booking.store
  const badge = getStoreStatusBadge(booking.status)
  const isAppointment = (booking.service_type ?? '').toUpperCase() === 'APPOINTMENT'
  const location = store?.location_name ?? store?.city ?? '—'
  const href = storeHref(booking)
  const amount = Number(booking.total_amount) || 0

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <div className="flex gap-3 p-4">
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-tight">{store?.name ?? 'Store'}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{isAppointment ? 'Appointment' : 'Order'}</p>
          </div>
          <div className="flex flex-col gap-2">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{isAppointment ? 'Date and Time' : 'Ordered on'}</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{formatStoreWhen(booking.slot_start_at ?? booking.created_at)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Location</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">{location}</p>
            </div>
          </div>
        </div>
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-200 shrink-0 self-start">
          {store?.cover_image ? (
            <Image src={store.cover_image} alt={store.name} fill className="object-cover" sizes="80px" />
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}>{badge.label}</span>
          {amount > 0 && <span className="text-xs font-semibold text-gray-700">Rs.{amount.toLocaleString()}</span>}
        </div>
        {href && (
          <Link href={href} className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
            View store
            <span aria-hidden="true">›</span>
          </Link>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <p className="text-gray-700 font-semibold">There are no bookings yet</p>
      <p className="text-gray-400 text-sm">Ready to explore some amazing options?</p>
      <Link href="/" className="mt-1 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark">Explore</Link>
    </div>
  )
}

type Item =
  | { kind: 'dining'; key: string; when: number; category: 'dining'; booking: DiningBooking }
  | { kind: 'store'; key: string; when: number; category: string; booking: StoreBooking }

function categoryOf(b: StoreBooking): string {
  const c = (b.store?.category ?? '').trim().toLowerCase()
  if (c === WELLNESS_CATEGORY) return 'wellness'
  return c || 'shopping'
}

function tabLabel(t: string): string {
  if (t === 'all') return 'All'
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/**
 * All bookings in one list — app parity: YourBookingsScreen.jsx (restaurant
 * bookings + store orders, "All" / "Dining" / one tab per store category).
 */
export function BookingsClient({
  diningBookings,
  storeBookings,
}: {
  diningBookings: DiningBooking[]
  storeBookings: StoreBooking[]
}) {
  const [tab, setTab] = useState('all')

  const items: Item[] = [
    ...diningBookings.map(b => ({
      kind: 'dining' as const,
      key: `dining-${b.id}`,
      when: new Date(`${b.booking_date}T${(b.booking_time ?? '00:00').slice(0, 5)}`).getTime() || 0,
      category: 'dining' as const,
      booking: b,
    })),
    ...storeBookings.map(b => ({
      kind: 'store' as const,
      key: `store-${b.id}`,
      when: new Date(b.slot_start_at ?? b.created_at).getTime() || 0,
      category: categoryOf(b),
      booking: b,
    })),
  ].sort((a, b) => b.when - a.when)

  const others = [...new Set(items.filter(i => i.category !== 'dining').map(i => i.category))].sort()
  const tabs = ['all', ...(items.some(i => i.category === 'dining') ? ['dining'] : []), ...others]
  const activeTab = tabs.includes(tab) ? tab : 'all'
  const visible = activeTab === 'all' ? items : items.filter(i => i.category === activeTab)

  return (
    <div>
      <div className="flex justify-center gap-2 py-5 overflow-x-auto scrollbar-hide px-4">
        {tabs.map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'shrink-0 px-5 py-1.5 rounded-full text-sm font-medium transition-colors',
              activeTab === t ? 'bg-brand-tint-strong text-brand-dark' : 'text-gray-500 hover:text-gray-700',
            )}
          >
            {tabLabel(t)}
          </button>
        ))}
      </div>

      <div className="px-4 pb-10 flex flex-col gap-4 max-w-xl mx-auto">
        {visible.length === 0 ? (
          <EmptyState />
        ) : (
          visible.map(i =>
            i.kind === 'dining'
              ? <BookingCard key={i.key} booking={i.booking} />
              : <StoreBookingCard key={i.key} booking={i.booking} />,
          )
        )}
      </div>
    </div>
  )
}
