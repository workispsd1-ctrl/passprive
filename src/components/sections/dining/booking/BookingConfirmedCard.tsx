'use client'

import Link from 'next/link'
import { CalendarDays, Users, MapPin, CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { formatDateShort, formatTime } from '@/lib/utils/format'
import type { BookingResult } from './types'

interface Props {
  result: BookingResult
  restaurantName: string
  restaurantLocation?: string
  backHref?: string
  cancelled: boolean
  cancelling: boolean
  onCancel: () => void
}

export function BookingConfirmedCard({ result, restaurantName, restaurantLocation, backHref, cancelled, cancelling, onCancel }: Props) {
  if (cancelled) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 flex flex-col items-center text-center gap-3">
          <XCircle className="w-10 h-10 text-red-400" />
          <p className="font-bold text-gray-800">Booking Cancelled</p>
          <p className="text-sm text-gray-500">Your reservation has been cancelled.</p>
          {backHref && (
            <Link href={backHref} className="text-sm font-semibold text-violet-600 hover:underline">
              Back to restaurant
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-0.5">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <h2 className="text-lg font-extrabold text-gray-900">Booking Confirmed</h2>
        </div>
        <p className="text-xs text-gray-400 ml-7">Reach restaurant 15 mins before your slot</p>
      </div>

      <div className="divide-y divide-gray-50">
        <div className="flex items-center gap-3 px-5 py-4">
          <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date &amp; Time</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">
              {formatDateShort(result.date)} at {formatTime(result.time)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 px-5 py-4">
          <Users className="w-4 h-4 text-gray-400 shrink-0" />
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Number of Guests</p>
            <p className="text-sm font-semibold text-gray-800 mt-0.5">{result.guests}</p>
          </div>
        </div>

        <div className="flex items-center px-5 py-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Location</p>
              <p className="text-sm font-semibold text-gray-800 mt-0.5">{restaurantName}</p>
              {restaurantLocation && (
                <p className="text-xs text-gray-400 mt-0.5">{restaurantLocation}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-gray-100">
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelling}
          className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
        >
          {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
          Cancel booking
        </button>
      </div>
    </div>
  )
}
