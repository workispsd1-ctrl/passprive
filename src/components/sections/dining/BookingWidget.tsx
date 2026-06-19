'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronDown, QrCode, CheckCircle2, Loader2, MapPin, Users, CalendarDays, MessageCircle, XCircle, CreditCard } from 'lucide-react'

const COVER_CHARGE_SESSION_KEY = 'pp_cover_charge_session'

function resolveSessionId(payload: Record<string, unknown>): string {
  const session = (payload?.payment_session ?? payload?.session ?? payload) as Record<string, unknown>
  return String(session?.id ?? session?.session_id ?? payload?.session_id ?? payload?.id ?? '')
}

function resolveMerchantTrace(payload: Record<string, unknown>): string {
  const session = (payload?.payment_session ?? payload?.session ?? payload) as Record<string, unknown>
  return String(session?.merchant_trace ?? session?.merchantTrace ?? payload?.merchant_trace ?? payload?.merchantTrace ?? '')
}

function resolveGatewayUrl(payload: Record<string, unknown>): string {
  const session = (payload?.payment_session ?? payload?.session ?? payload) as Record<string, unknown>
  const candidates = [
    payload?.redirect_url, payload?.redirectUrl, payload?.payment_url, payload?.paymentUrl,
    payload?.hosted_url, payload?.hostedUrl, payload?.launch_url, payload?.launchUrl,
    session?.redirect_url, session?.redirectUrl, session?.payment_url, session?.paymentUrl,
    session?.hosted_url, session?.hostedUrl, session?.launch_url, session?.launchUrl,
    payload?.gateway_url, payload?.gatewayUrl, session?.gateway_url, session?.gatewayUrl,
    payload?.url, session?.url,
  ]
  return String(candidates.find(v => typeof v === 'string' && (v as string).trim()) ?? '')
}

function submitGatewayForm(url: string, fields: Record<string, string>) {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = url
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  })
  document.body.appendChild(form)
  form.submit()
}

const GUEST_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8]

const TERMS = [
  'You should be above the legal drinking age to book slots with complimentary item(s).',
  'The choice of brand provided as part of this promotion is solely at the discretion of the restaurant.',
  'If there are more guests than seats booked, you will receive complimentary item(s) equivalent to the number of seats booked.',
  'Offers can be availed only by paying via PassPrivé.',
  'Cover charges cannot be refunded if slot is cancelled within 30 minutes of slot start time.',
  'Other T&Cs may apply.',
]

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
          : `${d.toLocaleString('en', { weekday: 'long' })}, ${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`
    options.push({ label, value: d.toISOString().split('T')[0] })
  }
  return options
}

type MealPeriod = 'lunch' | 'dinner'

function generateSlots(period: MealPeriod) {
  const slots: { label: string; value: string }[] = []
  const [startH, endH] = period === 'lunch' ? [11, 15] : [18, 22]
  for (let h = startH; h < endH; h++) {
    for (const m of [0, 15, 30, 45]) {
      const hh = String(h).padStart(2, '0')
      const mm = String(m).padStart(2, '0')
      const displayH = h % 12 === 0 ? 12 : h % 12
      const period12 = h < 12 ? 'AM' : 'PM'
      slots.push({ label: `${displayH}:${mm} ${period12}`, value: `${hh}:${mm}` })
    }
  }
  return slots
}

function formatBookingDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function formatTime(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const displayH = h % 12 === 0 ? 12 : h % 12
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`
}

function DownloadAppCard() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-start gap-3">
      <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
        <QrCode className="w-9 h-9 text-gray-400" />
      </div>
      <div>
        <p className="text-sm font-bold text-gray-900">Download PassPrivé</p>
        <ul className="mt-1.5 space-y-1">
          {['Exclusive offers and deals', 'Pay via District'].map(t => (
            <li key={t} className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

interface Props {
  restaurantId: string
  restaurantName: string
  restaurantLocation?: string
  backHref?: string
  defaultName?: string
  defaultPhone?: string
  coverChargeEnabled?: boolean
  coverChargeAmount?: number | null
}

type Step = 'slots' | 'details' | 'success'

interface BookingResult {
  bookingCode: string
  bookingId: string
  date: string
  time: string
  guests: number
  name: string
  phone: string
  coverChargeRequired: boolean
  coverChargeTotal: number
}

export function BookingWidget({ restaurantId, restaurantName, restaurantLocation, backHref, defaultName = '', defaultPhone = '', coverChargeEnabled = false, coverChargeAmount = null }: Props) {
  const dateOptions = getDateOptions()

  const [step, setStep] = useState<Step>('slots')
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BookingResult | null>(null)
  const [coverChargeLoading, setCoverChargeLoading] = useState(false)
  const [coverChargeError, setCoverChargeError] = useState<string | null>(null)

  // Step 1
  const [date, setDate] = useState(dateOptions[0].value)
  const [guests, setGuests] = useState(2)
  const [mealPeriod, setMealPeriod] = useState<MealPeriod>('dinner')
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [showAllSlots, setShowAllSlots] = useState(false)

  // Step 2
  const [name, setName] = useState(defaultName)
  const [phone, setPhone] = useState(defaultPhone)
  const [request, setRequest] = useState('')

  const allSlots = generateSlots(mealPeriod)
  const visibleSlots = showAllSlots ? allSlots : allSlots.slice(0, 8)

  const now = new Date()
  const transactionDate = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) +
    ', ' + now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()

  async function handleBook(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!name.trim() || !phone.trim()) { setError('Please enter your name and phone number.'); return }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/bookings/dining', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: restaurantId,
          booking_date: date,
          booking_time: selectedTime,
          party_size: guests,
          customer_name: name.trim(),
          customer_phone: phone.trim(),
          special_request: request.trim() || null,
        }),
      })
      const json = await res.json() as { booking_code?: string; id?: string; error?: string; cover_charge_required?: boolean; cover_charge_amount?: number }
      if (!res.ok) throw new Error(json.error ?? 'Booking failed')
      setResult({
        bookingCode: json.booking_code ?? '',
        bookingId: json.id ?? '',
        date,
        time: selectedTime ?? '',
        guests,
        name: name.trim(),
        phone: phone.trim(),
        coverChargeRequired: json.cover_charge_required ?? false,
        coverChargeTotal: json.cover_charge_amount ?? 0,
      })
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleCancel() {
    if (!result?.bookingId) return
    setCancelling(true)
    try {
      await fetch(`/api/bookings/dining/${result.bookingId}/cancel`, { method: 'PATCH' })
      setCancelled(true)
    } catch {
      // silently fail — booking still shows
    } finally {
      setCancelling(false)
    }
  }

  async function handlePayCoverCharge() {
    if (!result) return
    setCoverChargeLoading(true)
    setCoverChargeError(null)
    try {
      const res = await fetch('/api/payments/booking/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: result.bookingId,
          restaurant_id: restaurantId,
          amount: result.coverChargeTotal,
          currency_code: 'MUR',
        }),
      })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) throw new Error((data?.error as string) ?? 'Could not initiate payment')

      const sessionId = resolveSessionId(data)
      const merchantTrace = resolveMerchantTrace(data)
      const gatewayUrl = resolveGatewayUrl(data)

      sessionStorage.setItem(COVER_CHARGE_SESSION_KEY, JSON.stringify({
        sessionId,
        merchantTrace,
        bookingId: result.bookingId,
        restaurantId,
        amount: result.coverChargeTotal,
      }))

      if (gatewayUrl) {
        const formFields = (data?.form_fields ?? data?.fields ?? {}) as Record<string, string>
        if (Object.keys(formFields).length > 0) {
          submitGatewayForm(gatewayUrl, formFields)
        } else {
          window.location.href = gatewayUrl
        }
      } else {
        throw new Error('Payment gateway URL not returned. Please try again.')
      }
    } catch (err) {
      setCoverChargeError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setCoverChargeLoading(false)
    }
  }

  /* ── Success state ────────────────────────────────────────────── */
  if (step === 'success' && result) {
    return (
      <div className="flex flex-col gap-5">

        {/* Cover charge payment card — shown when restaurant requires upfront cover charge */}
        {result.coverChargeRequired && !cancelled && (
          <div className="rounded-2xl bg-white border border-violet-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-violet-100 bg-violet-50">
              <p className="text-sm font-bold text-violet-800">Cover Charge Required</p>
              <p className="text-xs text-violet-600 mt-0.5">Pay your cover charge to secure this booking</p>
            </div>
            <div className="px-5 py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Amount Due</p>
                <p className="text-2xl font-extrabold text-gray-900 mt-0.5">Rs {result.coverChargeTotal.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-0.5">Redeemable at the restaurant on your visit</p>
              </div>
              <button
                type="button"
                onClick={handlePayCoverCharge}
                disabled={coverChargeLoading}
                className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm transition-colors disabled:opacity-60"
              >
                {coverChargeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {coverChargeLoading ? 'Redirecting…' : 'Pay Now'}
              </button>
            </div>
            {coverChargeError && (
              <p className="px-5 pb-4 text-sm text-red-500 font-medium">{coverChargeError}</p>
            )}
          </div>
        )}

        {/* Info banner — only shown when no cover charge required */}
        {!result.coverChargeRequired && (
          <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3">
            <p className="text-sm text-violet-700 leading-snug">
              You will be able to redeem your cover charge when you pay your bill using the PassPrivé app
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left: booking detail */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* Booking confirmed card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              {cancelled ? (
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
              ) : (
                <>
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
                          {formatBookingDate(result.date)} at {formatTime(result.time)}
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

                    <div className="flex items-center justify-between px-5 py-4">
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

                  {/* Cancel */}
                  <div className="px-5 py-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="flex items-center gap-1.5 text-sm font-semibold text-red-500 hover:text-red-600 disabled:opacity-50"
                    >
                      {cancelling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                      Cancel booking
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Restaurant Terms */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm font-bold text-gray-900 mb-3">Restaurant Terms</p>
              <ul className="flex flex-col gap-2">
                {['Staff contributions is on the discretion of the restaurant',
                  'Discounts not applicable on btl, tower, beer bucket, pitchers and platters'].map(t => (
                  <li key={t} className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Your details */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm font-bold text-gray-900 mb-3">Your details</p>
              <div className="flex items-center gap-3 py-2 border border-gray-100 rounded-xl px-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <span className="text-xs text-gray-500">👤</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{result.name}</p>
                  <p className="text-xs text-gray-400">{result.phone}</p>
                </div>
              </div>
              {result.bookingId && (
                <div className="mt-3 flex flex-col gap-0.5">
                  <p className="text-xs text-gray-400">Transaction ID: {result.bookingId}</p>
                  <p className="text-xs text-gray-400">Transaction date: {transactionDate}</p>
                </div>
              )}
            </div>

            {/* T&Cs */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm font-bold text-gray-900 mb-3">Terms &amp; Conditions</p>
              <ul className="flex flex-col gap-2">
                {TERMS.map(term => (
                  <li key={term} className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                    {term}
                  </li>
                ))}
              </ul>
            </div>

            {/* Chat with support */}
            <button
              type="button"
              className="flex items-center gap-2.5 w-full bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-gray-400" />
              Chat with support
            </button>
          </div>

          {/* Right: QR panel */}
          <div className="lg:col-span-1">
            <DownloadAppCard />
          </div>
        </div>

        {/* Booking code bar */}
        <div className="mt-2 rounded-2xl bg-gray-900 text-white px-6 py-4 flex items-center justify-center gap-4">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={`bg-white h-8 rounded-full ${i % 3 === 0 ? 'w-0.75' : i % 2 === 0 ? 'w-0.5' : 'w-px'}`}
              />
            ))}
          </div>
          <p className="font-mono text-xl font-extrabold tracking-widest shrink-0">{result.bookingCode}</p>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={`bg-white h-8 rounded-full ${i % 2 === 0 ? 'w-0.5' : 'w-px'}`}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  /* ── Step 2: Guest details ────────────────────────────────────── */
  if (step === 'details') {
    return (
      <form onSubmit={handleBook} className="flex flex-col gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <button
              type="button"
              aria-label="Go back"
              onClick={() => setStep('slots')}
              className="text-sm font-medium text-gray-500 hover:text-gray-800 mb-1"
            >
              ← Back
            </button>
            <p className="text-base font-extrabold text-gray-900">Your details</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {dateOptions.find(d => d.value === date)?.label} ·{' '}
              {allSlots.find(s => s.value === selectedTime)?.label} ·{' '}
              {guests} {guests === 1 ? 'guest' : 'guests'}
            </p>
          </div>

          <div className="p-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Your name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Full name"
                  required
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-800 placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-violet-400"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+230 5XXX XXXX"
                  required
                  className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-800 placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-violet-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Special request <span className="normal-case font-normal">(optional)</span>
              </label>
              <textarea
                value={request}
                onChange={e => setRequest(e.target.value)}
                placeholder="Allergies, celebrations, seating preference…"
                rows={2}
                className="rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 resize-none focus:outline-none focus:border-violet-400"
              />
            </div>

            {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-sm transition-colors disabled:opacity-60"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Booking…' : 'Confirm booking'}
              </button>
            </div>
          </div>
        </div>
      </form>
    )
  }

  /* ── Step 1: Slot selection ───────────────────────────────────── */
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Main form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Form header */}
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-extrabold text-gray-900">Book a table</h2>
            <p className="text-xs text-gray-400 mt-0.5">{restaurantName}</p>
          </div>

          <div className="p-6 flex flex-col gap-6">

            {/* Date + Guests */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Date</span>
                <div className="relative">
                  <select
                    title="Select date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full appearance-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-800 bg-white pr-8 cursor-pointer focus:outline-none focus:border-violet-400"
                  >
                    {dateOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
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
                    onChange={e => setGuests(Number(e.target.value))}
                    className="w-full appearance-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-800 bg-white pr-8 cursor-pointer focus:outline-none focus:border-violet-400"
                  >
                    {GUEST_OPTIONS.map(n => <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Time slots */}
            <div>
              <p className="text-sm font-bold text-gray-900 mb-3">Select time slot</p>
              <div className="flex items-center gap-2 mb-4">
                {(['lunch', 'dinner'] as MealPeriod[]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => { setMealPeriod(p); setSelectedTime(null) }}
                    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors capitalize ${
                      mealPeriod === p
                        ? 'bg-gray-900 text-white'
                        : 'border border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-2">
                {visibleSlots.map(slot => (
                  <button
                    key={slot.value}
                    type="button"
                    onClick={() => setSelectedTime(slot.value)}
                    className={`flex flex-col items-center py-2.5 px-1 rounded-xl border text-center transition-all ${
                      selectedTime === slot.value
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    <span className="text-[13px] font-bold leading-tight">{slot.label}</span>
                    <span className={`text-[10px] mt-0.5 ${selectedTime === slot.value ? 'text-white/60' : 'text-violet-500'}`}>
                      2 offers
                    </span>
                  </button>
                ))}
              </div>

              {allSlots.length > 8 && (
                <button
                  type="button"
                  onClick={() => setShowAllSlots(v => !v)}
                  className="mt-3 text-sm font-semibold text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  {showAllSlots ? 'View fewer slots ↑' : 'View all slots ↓'}
                </button>
              )}
            </div>

            {/* T&Cs */}
            <div>
              <p className="text-sm font-bold text-gray-900 mb-3">Terms &amp; Conditions</p>
              <ul className="flex flex-col gap-2">
                {TERMS.map(term => (
                  <li key={term} className="flex items-start gap-2 text-xs text-gray-500 leading-relaxed">
                    <span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                    {term}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={!selectedTime}
                onClick={() => setStep('details')}
                className="px-8 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Proceed to book
              </button>
            </div>
          </div>
        </div>

        {/* Right: QR panel */}
        <div className="lg:col-span-1">
          <DownloadAppCard />
        </div>
      </div>
    </div>
  )
}
