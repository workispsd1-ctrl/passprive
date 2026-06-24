'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  CheckCircle2, Clock, MapPin, Users, Tag,
  PenLine, Ban, User, Wallet, Globe, Smartphone, CalendarDays,
  Coins, ArrowRight,
} from 'lucide-react'
import type { DiningBooking } from '@/lib/types/bookings'
import { formatDateFull, formatTime } from '@/lib/utils/format'
import { PPCoinsPayment } from '@/components/shared/PPCoinsPayment'
import { CollapsibleCard } from '@/components/shared/CollapsibleCard'
import { TermsList } from '@/components/shared/TermsList'
import { StatusBanner } from '@/components/shared/StatusBanner'

const TERMS = [
  'Please arrive 15 minutes prior to your reservation time.',
  'Booking valid for the specified number of guests entered during reservation.',
  'Cover charges upon entry are subject to the discretion of the restaurant.',
  'Additional service charges on the bill are at the restaurant\'s discretion.',
  'House rules are to be observed at all times.',
  'Special requests will be accommodated at the restaurant\'s discretion.',
  'Offers can be availed only by paying via PassPrivé.',
  'Cover charges cannot be refunded if slot is cancelled within 30 minutes of slot start time.',
  'Other T&Cs may apply.',
]

function StatusBadge({ status }: { status: string }) {
  if (status === 'confirmed') return (
    <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-full">
      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed
    </span>
  )
  if (status === 'pending') return (
    <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full">
      <Clock className="w-3.5 h-3.5" /> Pending
    </span>
  )
  if (status === 'cancelled') return (
    <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-full">
      <Ban className="w-3.5 h-3.5" /> Cancelled
    </span>
  )
  return <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-full">{status}</span>
}

interface Props {
  booking: DiningBooking
  userName: string
  ppBalance: number
  cashbackRate: number
  membershipTier: string
}


export function BookingDetailClient({ booking, userName, ppBalance: initialBalance, cashbackRate }: Props) {
  const searchParams = useSearchParams()
  const billJustPaid = searchParams.get('bill_paid') === '1'
  const coverJustPaid = searchParams.get('cover_paid') === '1'
  const earnedFromUrl = parseFloat(searchParams.get('earned') ?? '0') || 0

  const [liveBalance, setLiveBalance] = useState(initialBalance)
  const restaurant = booking.restaurants
  const location = restaurant?.full_address ?? restaurant?.area ?? '—'
  const isActive = booking.status === 'confirmed' || booking.status === 'pending'
  const costForTwo = restaurant?.cost_for_two ?? 0
  const estimatedBill = costForTwo > 0 ? Math.round(costForTwo * booking.party_size / 2) : 0

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pb-16">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
        <div>
          <p className="text-xs text-gray-400 font-medium mb-1 uppercase tracking-wider">Booking Details</p>
          <h1 className="text-2xl font-extrabold text-gray-900">{restaurant?.name ?? 'Restaurant Booking'}</h1>
          <p className="text-sm text-gray-500 mt-1">{formatDateFull(booking.booking_date)} · {formatTime(booking.booking_time)}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={booking.status} />
          <span className="font-mono text-sm font-bold text-violet-600 bg-violet-50 px-3 py-1.5 rounded-full border border-violet-100">
            {booking.booking_code}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left / Main column ──────────────────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-5">

          {/* Restaurant hero */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {restaurant?.cover_image && (
              <div className="relative w-full h-44">
                <Image
                  src={restaurant.cover_image}
                  alt={restaurant.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 66vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-4 left-5">
                  <p className="text-white font-extrabold text-xl">{restaurant.name}</p>
                  <p className="text-white/70 text-sm mt-0.5">{location}</p>
                </div>
              </div>
            )}
            {!restaurant?.cover_image && (
              <div className="px-5 py-4 border-b border-gray-100">
                <p className="font-bold text-gray-900 text-base">{restaurant?.name ?? '—'}</p>
                <p className="text-sm text-gray-500 mt-0.5">{location}</p>
              </div>
            )}

            {/* Detail rows grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
              {[
                { icon: <CalendarDays className="w-4 h-4 text-violet-400" />, label: 'Date', value: formatDateFull(booking.booking_date) },
                { icon: <Clock className="w-4 h-4 text-violet-400" />, label: 'Time', value: formatTime(booking.booking_time) },
                { icon: <MapPin className="w-4 h-4 text-violet-400" />, label: 'Location', value: location },
                { icon: <Users className="w-4 h-4 text-violet-400" />, label: 'Guests', value: `${booking.party_size} ${booking.party_size === 1 ? 'guest' : 'guests'}` },
              ].map(row => (
                <div key={row.label} className="flex items-start gap-3 px-5 py-4">
                  <div className="mt-0.5 shrink-0">{row.icon}</div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{row.label}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1 leading-snug">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-5 py-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-400">
                {booking.source === 'app' ? <Smartphone className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                Booked via {booking.source === 'app' ? 'App' : 'Web'}
            </div>
          </div>

          <CollapsibleCard
            title="Special instructions"
            icon={<PenLine className="w-4 h-4 text-gray-400" />}
            badge={booking.special_request ? 'Added' : undefined}
          >
            <p className="text-sm text-gray-600 leading-relaxed">
              {booking.special_request?.trim() || 'No special instructions provided.'}
            </p>
          </CollapsibleCard>

          <CollapsibleCard
            title="Terms & Conditions"
            icon={<Tag className="w-4 h-4 text-gray-400" />}
            defaultOpen
          >
            <TermsList items={TERMS} />
          </CollapsibleCard>
        </div>

        {/* ── Right / Sidebar ─────────────────────────────────── */}
        <div className="flex flex-col gap-5">

          {coverJustPaid && (
            <StatusBanner status="success" title="Cover Charge Paid — Booking Confirmed!" />
          )}

          {billJustPaid && (
            <StatusBanner status="success" title="Bill Paid!">
              {earnedFromUrl > 0 && (
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-violet-500" />
                    <p className="text-sm font-semibold text-gray-700">PP Coins credited</p>
                  </div>
                  <p className="text-sm font-extrabold text-violet-600">₨{earnedFromUrl.toFixed(2)}</p>
                </div>
              )}
            </StatusBanner>
          )}


          {isActive && !billJustPaid && cashbackRate > 0 && (
            <div className="bg-linear-to-br from-violet-600 to-purple-700 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-1">
                <Wallet className="w-4 h-4 text-white/80" />
                <p className="text-sm font-bold">Pay Bill &amp; Earn PP Coins</p>
              </div>
              <p className="text-xs text-white/70 leading-relaxed mb-4">
                Pay your bill securely via card and earn {cashbackRate}% back as PP Coins. 1 coin = ₨1.
              </p>
              <Link
                href={`/bookings/${booking.id}/pay${estimatedBill > 0 ? `?amount=${estimatedBill}` : ''}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white text-violet-700 text-sm font-bold hover:bg-violet-50 transition-colors"
              >
                <Coins className="w-4 h-4" />
                Pay Bill &amp; Earn Coins
                <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[10px] text-white/40 text-center mt-2">Secured by iVeri · 3D Secure</p>
            </div>
          )}

          {/* Pay with PP Points */}
          {isActive && !billJustPaid && cashbackRate > 0 && (
            <PPCoinsPayment
              restaurantId={booking.restaurant_id}
              ppBalance={liveBalance}
              onPaid={amt => setLiveBalance(b => b - amt)}
            />
          )}

          {/* Booking reference */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Booking Reference
            </p>
            <p className="font-mono text-xl font-extrabold text-violet-600 tracking-widest">{booking.booking_code}</p>
            <p className="text-xs text-gray-400 mt-1">Present this code at the restaurant</p>
          </div>

          {/* Guest details */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Guest Details
            </p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                <User className="w-4 h-4 text-violet-500" />
              </div>
              <p className="text-sm font-semibold text-gray-800">{userName}</p>
            </div>
          </div>

          {/* Policies */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-100">
            <div className="flex items-start gap-3 px-5 py-4">
              <PenLine className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Modification unavailable</p>
                <p className="text-xs text-gray-400 mt-0.5">Not eligible for modification</p>
              </div>
            </div>
            <div className="flex items-start gap-3 px-5 py-4">
              <Ban className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-700">Cancellation not available</p>
                <p className="text-xs text-gray-400 mt-0.5">Not eligible for cancellation</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
