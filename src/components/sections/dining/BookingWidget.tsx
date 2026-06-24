'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { resolveSessionId, resolveMerchantTrace, resolveGatewayUrl, submitGatewayForm } from '@/lib/utils/payment'
import type { RestaurantHours } from '@/lib/types/dining'
import { PPCoinsPayment } from '@/components/shared/PPCoinsPayment'
import { TermsList } from '@/components/shared/TermsList'
import { DownloadAppCard } from '@/components/shared/DownloadAppCard'
import { SESSION_KEY_COVER_CHARGE } from '@/lib/constants/sessionKeys'
import { BOOKING_TERMS, RESTAURANT_TERMS } from './booking/constants'
import type { BookingResult, DateOption, SlotOption } from './booking/types'
import { CoverChargeCard } from './booking/CoverChargeCard'
import { BookingConfirmedCard } from './booking/BookingConfirmedCard'
import { PayBillCard } from './booking/PayBillCard'
import { BookingDetailsCard } from './booking/BookingDetailsCard'
import { BookingCodeBar } from './booking/BookingCodeBar'
import { GuestDetailsForm } from './booking/GuestDetailsForm'
import { SlotSelector } from './booking/SlotSelector'

const COVER_CHARGE_SESSION_KEY = SESSION_KEY_COVER_CHARGE

function getDateOptions(restaurantHours: RestaurantHours[]): DateOption[] {
  const options: DateOption[] = []
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    const dayOfWeek = d.getDay()
    const hoursEntry = restaurantHours.find(h => h.day_of_week === dayOfWeek)
    // Only mark closed if hours are configured — restaurants without any hours get all days open
    const isClosed = restaurantHours.length > 0 && (hoursEntry?.is_closed ?? false)
    const baseLabel =
      i === 0
        ? `Today, ${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`
        : i === 1
          ? `Tomorrow, ${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`
          : `${d.toLocaleString('en', { weekday: 'long' })}, ${d.getDate()} ${d.toLocaleString('en', { month: 'short' })}`
    options.push({
      label: isClosed ? `${baseLabel} — Closed` : baseLabel,
      value: d.toISOString().split('T')[0],
      isClosed,
    })
  }
  return options
}

function generateSlotsFromHours(openTime: string, closeTime: string, date: string): SlotOption[] {
  const [openH, openM] = openTime.split(':').map(Number)
  const [closeH, closeM] = closeTime.split(':').map(Number)
  const openMinutes = openH * 60 + (openM ?? 0)
  const closeMinutes = closeH * 60 + (closeM ?? 0)

  const now = new Date()
  const isToday = date === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const cutoff = isToday ? now.getHours() * 60 + now.getMinutes() + 30 : -1

  const slots: SlotOption[] = []
  for (let min = openMinutes; min + 30 <= closeMinutes; min += 30) {
    if (min <= cutoff) continue
    const h = Math.floor(min / 60)
    const m = min % 60
    const displayH = h % 12 === 0 ? 12 : h % 12
    const period12 = h < 12 ? 'AM' : 'PM'
    slots.push({
      label: `${displayH}:${String(m).padStart(2, '0')} ${period12}`,
      value: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
    })
  }
  return slots
}

function getSlotsForDate(date: string, restaurantHours: RestaurantHours[]): SlotOption[] {
  if (restaurantHours.length === 0) {
    // No hours configured — fall back to a full-day range
    return generateSlotsFromHours('11:00', '22:00', date)
  }
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay()
  const entry = restaurantHours.find(h => h.day_of_week === dayOfWeek)
  if (!entry || entry.is_closed || !entry.open_time || !entry.close_time) return []
  return generateSlotsFromHours(entry.open_time, entry.close_time, date)
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
  cashbackRate?: number
  ppBalance?: number
  restaurantHours?: RestaurantHours[]
  maxPartySize?: number | null
}

type Step = 'slots' | 'details' | 'success'

export function BookingWidget({ restaurantId, restaurantName, restaurantLocation, backHref, defaultName = '', defaultPhone = '', cashbackRate = 0, ppBalance = 0, restaurantHours = [], maxPartySize }: Props) {
  const router = useRouter()
  const dateOptions = getDateOptions(restaurantHours)

  // If user returns from iVeri without "Return to PassPrive" working, detect the pending session
  // and redirect to the return page so cashback is still credited.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(COVER_CHARGE_SESSION_KEY)
      if (raw) {
        const stored = JSON.parse(raw) as { sessionId?: string; bookingId?: string }
        if (stored?.sessionId && stored?.bookingId) {
          router.push('/dining/cover-charge-return')
        }
      }
    } catch { /* ignore */ }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [step, setStep] = useState<Step>('slots')
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelled, setCancelled] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BookingResult | null>(null)
  const [coverChargeLoading, setCoverChargeLoading] = useState(false)
  const [coverChargeError, setCoverChargeError] = useState<string | null>(null)

  const [date, setDate] = useState(dateOptions[0].value)
  const [guests, setGuests] = useState(2)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [showAllSlots, setShowAllSlots] = useState(false)

  const [name, setName] = useState(defaultName)
  const [phone, setPhone] = useState(defaultPhone)
  const [request, setRequest] = useState('')
  const [livePpBalance, setLivePpBalance] = useState(ppBalance)

  function handleDateChange(newDate: string) {
    setDate(newDate)
    setSelectedTime(null)
    setShowAllSlots(false)
  }

  const maxGuests = maxPartySize ?? 10
  const guestOptions = Array.from({ length: maxGuests }, (_, i) => i + 1)

  const allSlots = getSlotsForDate(date, restaurantHours)
  const isClosed = restaurantHours.length > 0 && allSlots.length === 0
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

  /* ── Success ──────────────────────────────────────────────────── */
  if (step === 'success' && result) {
    return (
      <div className="flex flex-col gap-5">

        {result.coverChargeRequired && !cancelled && (
          <CoverChargeCard
            total={result.coverChargeTotal}
            loading={coverChargeLoading}
            error={coverChargeError}
            onPay={handlePayCoverCharge}
          />
        )}

        {!result.coverChargeRequired && (
          <div className="rounded-xl bg-violet-50 border border-violet-100 px-4 py-3">
            <p className="text-sm text-violet-700 leading-snug">
              You will be able to redeem your cover charge when you pay your bill using the PassPrivé app
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 flex flex-col gap-5">
            <BookingConfirmedCard
              result={result}
              restaurantName={restaurantName}
              restaurantLocation={restaurantLocation}
              backHref={backHref}
              cancelled={cancelled}
              cancelling={cancelling}
              onCancel={handleCancel}
            />

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm font-bold text-gray-900 mb-3">Restaurant Terms</p>
              <TermsList items={RESTAURANT_TERMS} />
            </div>

            <BookingDetailsCard
              name={result.name}
              phone={result.phone}
              bookingId={result.bookingId}
              transactionDate={transactionDate}
            />

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-sm font-bold text-gray-900 mb-3">Terms &amp; Conditions</p>
              <TermsList items={BOOKING_TERMS} />
            </div>

            <button
              type="button"
              className="flex items-center gap-2.5 w-full bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-gray-400" />
              Chat with support
            </button>
          </div>

          <div className="lg:col-span-1 flex flex-col gap-5">
            {!cancelled && cashbackRate > 0 && (
              <PayBillCard bookingId={result.bookingId} cashbackRate={cashbackRate} />
            )}

            {!cancelled && cashbackRate > 0 && livePpBalance > 0 && (
              <PPCoinsPayment
                restaurantId={restaurantId}
                ppBalance={livePpBalance}
                onPaid={(paid: number) => setLivePpBalance(b => b - paid)}
              />
            )}

            <DownloadAppCard />
          </div>
        </div>

        <BookingCodeBar code={result.bookingCode} />
      </div>
    )
  }

  /* ── Step 2: Guest details ────────────────────────────────────── */
  if (step === 'details') {
    return (
      <GuestDetailsForm
        name={name}
        phone={phone}
        request={request}
        date={date}
        selectedTime={selectedTime}
        guests={guests}
        dateOptions={dateOptions}
        allSlots={allSlots}
        loading={loading}
        error={error}
        onBack={() => setStep('slots')}
        onNameChange={setName}
        onPhoneChange={setPhone}
        onRequestChange={setRequest}
        onSubmit={handleBook}
      />
    )
  }

  /* ── Step 1: Slot selection ───────────────────────────────────── */
  return (
    <SlotSelector
      restaurantName={restaurantName}
      date={date}
      guests={guests}
      isClosed={isClosed}
      selectedTime={selectedTime}
      showAllSlots={showAllSlots}
      visibleSlots={visibleSlots}
      allSlots={allSlots}
      dateOptions={dateOptions}
      guestOptions={guestOptions}
      onDateChange={handleDateChange}
      onGuestsChange={setGuests}
      onTimeSelect={setSelectedTime}
      onToggleSlots={() => setShowAllSlots(v => !v)}
      onProceed={() => setStep('details')}
    />
  )
}
