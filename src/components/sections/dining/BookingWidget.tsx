'use client'

import { useState } from 'react'
import { ChevronDown, QrCode } from 'lucide-react'

const GUEST_OPTIONS = ['1 guest', '2 guests', '3 guests', '4 guests', '5 guests', '6+ guests']

function getDateOptions() {
  const options: { label: string; value: string }[] = []
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    const label = i === 0
      ? `Today, ${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`
      : i === 1
      ? `Tomorrow, ${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`
      : `${d.toLocaleString('en', { weekday: 'short' })}, ${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`
    options.push({ label, value: d.toISOString().split('T')[0] })
  }
  return options
}

interface Props {
  restaurantName: string
}

export function BookingWidget({ restaurantName }: Props) {
  const dateOptions = getDateOptions()
  const [date, setDate] = useState(dateOptions[0].value)
  const [guests, setGuests] = useState('2 guests')

  return (
    <div className="flex flex-col gap-3">
      {/* Book a table card */}
      <div className="rounded-2xl border border-gray-200 p-5 shadow-sm bg-white">
        <h2 className="text-[17px] font-bold text-gray-900 mb-4">Book a table</h2>

        <div className="grid grid-cols-2 gap-2.5 mb-3">
          {/* Date */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Date</span>
            <div className="relative">
              <select
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] font-semibold text-gray-800 bg-white pr-7 cursor-pointer focus:outline-none focus:border-gray-400"
              >
                {dateOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Guests */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Guests</span>
            <div className="relative">
              <select
                value={guests}
                onChange={e => setGuests(e.target.value)}
                className="w-full appearance-none rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] font-semibold text-gray-800 bg-white pr-7 cursor-pointer focus:outline-none focus:border-gray-400"
              >
                {GUEST_OPTIONS.map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        <button
          type="button"
          className="w-full py-3.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-[14px] transition-colors"
        >
          Book a table
        </button>
      </div>

      {/* Download app card */}
      <div className="rounded-2xl border border-gray-200 p-4 shadow-sm bg-white">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <QrCode className="w-9 h-9 text-gray-500" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-gray-900">Download PassPrivé</p>
            <ul className="mt-1.5 space-y-1">
              <li className="flex items-center gap-1.5 text-[12px] text-gray-500">
                <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                Exclusive offers and deals
              </li>
              <li className="flex items-center gap-1.5 text-[12px] text-gray-500">
                <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                Pay & earn rewards
              </li>
              <li className="flex items-center gap-1.5 text-[12px] text-gray-500">
                <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                Book tables instantly
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
