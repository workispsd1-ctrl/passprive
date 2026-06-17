'use client'

import { useState } from 'react'
import { ChevronDown, QrCode, CheckCircle, Loader2 } from 'lucide-react'

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8]

function getDateOptions() {
  const options: { label: string; value: string }[] = []
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    const label =
      i === 0
        ? `Today, ${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`
        : i === 1
          ? `Tomorrow, ${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`
          : `${d.toLocaleString('en', { weekday: 'short' })}, ${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`
    options.push({ label, value: d.toISOString().split('T')[0] })
  }
  return options
}

function getTimeSlots() {
  const slots: { label: string; value: string }[] = []
  for (let h = 11; h <= 22; h++) {
    for (const m of [0, 30]) {
      if (h === 22 && m === 30) break
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const period = h < 12 ? 'AM' : 'PM'
      const displayH = h % 12 === 0 ? 12 : h % 12
      slots.push({ label: `${displayH}:${mm} ${period}`, value: `${hh}:${mm}` })
    }
  }
  return slots
}

interface Props {
  restaurantId: string
  restaurantName: string
}

type Step = 'form' | 'success'

export function BookingWidget({ restaurantId, restaurantName }: Props) {
  const dateOptions = getDateOptions()
  const timeSlots = getTimeSlots()

  const [step, setStep] = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [bookingCode, setBookingCode] = useState('')

  const [date, setDate] = useState(dateOptions[0].value)
  const [time, setTime] = useState('19:00')
  const [guests, setGuests] = useState(2)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [request, setRequest] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) {
      setError('Please enter your name and phone number.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/bookings/dining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          booking_date: date,
          booking_time: time,
          party_size: guests,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          special_request: request.trim() || null,
        }),
      })
      const json = await res.json() as { booking_code?: string; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Booking failed')
      setBookingCode(json.booking_code ?? '')
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (step === 'success') {
    return (
      <div className="rounded-2xl border border-gray-200 p-6 shadow-sm bg-white flex flex-col items-center text-center gap-3">
        <CheckCircle className="w-12 h-12 text-green-500" />
        <h2 className="text-[17px] font-bold text-gray-900">Booking Confirmed!</h2>
        <p className="text-sm text-gray-500">
          Your table at <span className="font-semibold text-gray-800">{restaurantName}</span> is reserved.
        </p>
        {bookingCode && (
          <div className="mt-1 px-4 py-2 rounded-xl bg-violet-50 border border-violet-100">
            <p className="text-[11px] font-semibold text-violet-400 uppercase tracking-wider">Booking Code</p>
            <p className="text-2xl font-extrabold text-violet-700 tracking-widest mt-0.5">{bookingCode}</p>
          </div>
        )}
        <p className="text-xs text-gray-400">Show this code at the restaurant. Check <a href="/bookings" className="underline text-gray-500">My Bookings</a> for details.</p>
        <button
          type="button"
          onClick={() => { setStep('form'); setBookingCode('') }}
          className="mt-1 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          Make another booking
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-gray-200 p-5 shadow-sm bg-white">
        <h2 className="text-[17px] font-bold text-gray-900 mb-4">Book a table</h2>

        {/* Date + Guests */}
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Date</span>
            <div className="relative">
              <select
                title="Select date"
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

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Guests</span>
            <div className="relative">
              <select
                title="Select number of guests"
                value={guests}
                onChange={e => setGuests(Number(e.target.value))}
                className="w-full appearance-none rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] font-semibold text-gray-800 bg-white pr-7 cursor-pointer focus:outline-none focus:border-gray-400"
              >
                {GUEST_OPTIONS.map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Time */}
        <div className="flex flex-col gap-1 mb-2.5">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Time</span>
          <div className="relative">
            <select
              title="Select time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] font-semibold text-gray-800 bg-white pr-7 cursor-pointer focus:outline-none focus:border-gray-400"
            >
              {timeSlots.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Name + Phone */}
        <div className="grid grid-cols-2 gap-2.5 mb-2.5">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Your name</span>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Full name"
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] font-semibold text-gray-800 placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-gray-400"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Phone</span>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+230 5XXX XXXX"
              className="rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] font-semibold text-gray-800 placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-gray-400"
            />
          </div>
        </div>

        {/* Special request */}
        <div className="flex flex-col gap-1 mb-3">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">Special request <span className="normal-case font-normal">(optional)</span></span>
          <textarea
            value={request}
            onChange={e => setRequest(e.target.value)}
            placeholder="Allergies, celebrations, seating preference…"
            rows={2}
            className="rounded-xl border border-gray-200 px-3 py-2.5 text-[13px] text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:border-gray-400"
          />
        </div>

        {error && (
          <p className="text-[12px] text-red-500 font-medium mb-2.5">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-[14px] transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Booking…' : 'Book a table'}
        </button>
      </form>

      {/* Download app card */}
      <div className="rounded-2xl border border-gray-200 p-4 shadow-sm bg-white">
        <div className="flex items-start gap-3">
          <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
            <QrCode className="w-9 h-9 text-gray-500" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-gray-900">Download PassPrivé</p>
            <ul className="mt-1.5 space-y-1">
              {['Exclusive offers and deals', 'Pay & earn rewards', 'Book tables instantly'].map(t => (
                <li key={t} className="flex items-center gap-1.5 text-[12px] text-gray-500">
                  <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
