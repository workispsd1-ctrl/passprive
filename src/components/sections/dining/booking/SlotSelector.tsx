'use client'

import { ChevronDown, CalendarX } from 'lucide-react'
import { TermsList } from '@/components/shared/TermsList'
import { DownloadAppCard } from '@/components/shared/DownloadAppCard'
import { BOOKING_TERMS } from './constants'
import type { DateOption, SlotOption } from './types'

interface Props {
  restaurantName: string
  date: string
  guests: number
  guestOptions: number[]
  isClosed: boolean
  selectedTime: string | null
  showAllSlots: boolean
  visibleSlots: SlotOption[]
  allSlots: SlotOption[]
  dateOptions: DateOption[]
  onDateChange: (v: string) => void
  onGuestsChange: (v: number) => void
  onTimeSelect: (v: string | null) => void
  onToggleSlots: () => void
  onProceed: () => void
}

export function SlotSelector({ restaurantName, date, guests, guestOptions, isClosed, selectedTime, showAllSlots, visibleSlots, allSlots, dateOptions, onDateChange, onGuestsChange, onTimeSelect, onToggleSlots, onProceed }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-extrabold text-gray-900">Book a table</h2>
            <p className="text-xs text-gray-400 mt-0.5">{restaurantName}</p>
          </div>

          <div className="p-6 flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</span>
                <div className="relative">
                  <select
                    title="Select date"
                    value={date}
                    onChange={e => onDateChange(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-800 bg-white pr-8 cursor-pointer focus:outline-none focus:border-violet-400"
                  >
                    {dateOptions.map(o => (
                      <option key={o.value} value={o.value} disabled={o.isClosed}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">No. of guests</span>
                <div className="relative">
                  <select
                    title="Select guests"
                    value={guests}
                    onChange={e => onGuestsChange(Number(e.target.value))}
                    className="w-full appearance-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-800 bg-white pr-8 cursor-pointer focus:outline-none focus:border-violet-400"
                  >
                    {guestOptions.map((n: number) => <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {isClosed ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CalendarX className="w-10 h-10 text-gray-300" />
                <p className="text-sm font-semibold text-gray-500">Restaurant is closed on this day</p>
                <p className="text-xs text-gray-400">Please select a different date</p>
              </div>
            ) : allSlots.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <CalendarX className="w-10 h-10 text-gray-300" />
                <p className="text-sm font-semibold text-gray-500">No available slots for this date</p>
                <p className="text-xs text-gray-400">All slots for today may have passed — try a different date</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-gray-900 mb-3">Select time slot</p>
                <div className="grid grid-cols-4 gap-2">
                  {visibleSlots.map(slot => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => onTimeSelect(slot.value)}
                      className={`flex items-center justify-center py-2.5 px-1 rounded-xl border text-center transition-all ${
                        selectedTime === slot.value
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      <span className="text-[13px] font-bold leading-tight">{slot.label}</span>
                    </button>
                  ))}
                </div>

                {allSlots.length > 8 && (
                  <button
                    type="button"
                    onClick={onToggleSlots}
                    className="mt-3 text-sm font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    {showAllSlots ? 'View fewer slots ↑' : 'View all slots ↓'}
                  </button>
                )}
              </div>
            )}

            <div>
              <p className="text-sm font-bold text-gray-900 mb-3">Terms &amp; Conditions</p>
              <TermsList items={BOOKING_TERMS} />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!selectedTime || isClosed}
                onClick={onProceed}
                className="px-8 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Proceed to book
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <DownloadAppCard />
        </div>
      </div>
    </div>
  )
}
