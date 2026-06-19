'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  ArrowLeft, ShieldCheck, Coins, CreditCard, Check,
  MapPin, CalendarDays, Clock, Users, Loader2,
} from 'lucide-react'
import type { DiningBooking } from '@/lib/types/bookings'

const SESSION_KEY = 'pp_dining_payment_session'

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

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatTime(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  const period = hour >= 12 ? 'PM' : 'AM'
  const h = hour % 12 === 0 ? 12 : hour % 12
  return `${h}:${minute.toString().padStart(2, '0')} ${period}`
}

interface Props {
  booking: DiningBooking
  cashbackRate: number
  membershipTier: string
  defaultAmount: number
}

export function PayCheckoutClient({ booking, cashbackRate, defaultAmount }: Props) {
  const router = useRouter()
  const restaurant = booking.restaurants
  const location = restaurant?.full_address ?? restaurant?.area ?? ''

  const [amount, setAmount] = useState(defaultAmount > 0 ? String(defaultAmount) : '')
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const numAmount = parseFloat(amount) || 0
  const cashbackEarned = numAmount > 0 ? Math.round(numAmount * cashbackRate / 100 * 100) / 100 : 0

  function handleAmountInput(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value.replace(/[^0-9.]/g, '')
    const parts = v.split('.')
    if (parts.length > 2) return
    if (parts[1] && parts[1].length > 2) return
    setAmount(v)
    setError(null)
  }

  async function handlePay() {
    if (!agreed) {
      setError('Please agree to the terms before proceeding.')
      return
    }
    if (numAmount <= 0) {
      setError('Please enter a valid bill amount.')
      return
    }
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/payments/dining/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dining_payload: {
            restaurant_id: booking.restaurant_id,
            booking_id: booking.id,
            amount: parseFloat(numAmount.toFixed(2)),
            currency_code: 'MUR',
          },
        }),
      })

      const data = await res.json() as Record<string, unknown>
      if (!res.ok) throw new Error((data.error as string) ?? 'Payment initiation failed')

      const sessionId = resolveSessionId(data)
      const merchantTrace = resolveMerchantTrace(data)
      if (!sessionId) throw new Error('No payment session returned. Please try again.')

      sessionStorage.setItem(SESSION_KEY, JSON.stringify({
        sessionId,
        merchantTrace,
        bookingId: booking.id,
        restaurantId: booking.restaurant_id,
        billAmount: numAmount,
        cashbackRate,
      }))

      const gateway = data?.gateway as { url?: string; fields?: Record<string, string> } | undefined
      if (gateway?.url && gateway?.fields && typeof gateway.fields === 'object') {
        submitGatewayForm(gateway.url, gateway.fields)
        return
      }
      const launchUrl = resolveGatewayUrl(data)
      if (launchUrl) {
        window.location.href = launchUrl
        return
      }
      throw new Error('No payment URL returned by the gateway. Please try again.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 pb-16">

      {/* Header */}
      <div className="flex items-center gap-3 py-5">
        <button type="button" onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Pay Bill</p>
          <h1 className="text-lg font-extrabold text-gray-900 leading-tight">{restaurant?.name ?? 'Restaurant'}</h1>
        </div>
      </div>

      {/* Restaurant card */}
      <div className="rounded-3xl overflow-hidden bg-gray-900 text-white mb-4">
        {restaurant?.cover_image && (
          <div className="relative w-full h-32">
            <Image src={restaurant.cover_image} alt={restaurant?.name ?? ''} fill className="object-cover opacity-60" sizes="448px" />
            <div className="absolute inset-0 bg-linear-to-t from-gray-900/80 to-transparent" />
          </div>
        )}
        <div className="px-5 pb-5 pt-3">
          <p className="font-extrabold text-lg">{restaurant?.name}</p>
          {location && (
            <p className="text-sm text-white/60 flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" /> {location}
            </p>
          )}
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-white/60">
            <div className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              <span>{formatDate(booking.booking_date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(booking.booking_time)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{booking.party_size} {booking.party_size === 1 ? 'guest' : 'guests'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bill amount input */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-4">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Total Bill Amount</p>
        <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl px-4 py-3 focus-within:border-violet-500 transition-colors">
          <span className="text-base font-bold text-gray-400">Rs</span>
          <input
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            value={amount}
            onChange={handleAmountInput}
            className="flex-1 text-2xl font-extrabold text-gray-900 bg-transparent focus:outline-none placeholder:text-gray-200"
          />
        </div>
      </div>

      {/* Cashback preview */}
      {cashbackEarned > 0 && (
        <div className="bg-violet-50 border border-violet-100 rounded-2xl px-5 py-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-violet-500" />
            <div>
              <p className="text-sm font-bold text-violet-700">You&apos;ll earn</p>
              <p className="text-xs text-violet-400">{cashbackRate}% cashback as PP Coins</p>
            </div>
          </div>
          <p className="text-xl font-extrabold text-violet-600">Rs {cashbackEarned.toFixed(2)}</p>
        </div>
      )}

      {/* Payment method */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 mb-4 flex items-center gap-3">
        <CreditCard className="w-5 h-5 text-gray-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-gray-800">Credit / Debit Card</p>
          <p className="text-xs text-gray-400 mt-0.5">Visa, Mastercard — secured by iVeri · 3D Secure</p>
        </div>
      </div>

      {/* T&Cs */}
      <label className="flex items-start gap-3 mb-5 cursor-pointer">
        <div
          onClick={() => setAgreed(v => !v)}
          className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${agreed ? 'bg-violet-600 border-violet-600' : 'border-gray-300 bg-white'}`}
        >
          {agreed && <Check className="w-3 h-3 text-white" />}
        </div>
        <span className="text-sm text-gray-600 leading-snug">
          I agree to the PassPrivé{' '}
          <a href="/terms" className="underline text-gray-800" target="_blank" rel="noopener noreferrer">payment terms</a>{' '}
          and confirm the bill amount is correct.
        </span>
      </label>

      {error && <p className="text-sm text-red-500 font-medium mb-3">{error}</p>}

      {/* Pay button */}
      <button
        type="button"
        onClick={handlePay}
        disabled={loading || numAmount <= 0}
        className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
      >
        {loading
          ? <><Loader2 className="w-5 h-5 animate-spin" /> Redirecting to payment…</>
          : <><ShieldCheck className="w-5 h-5" /> Pay Rs {numAmount > 0 ? numAmount.toLocaleString() : '—'}</>}
      </button>

      <p className="mt-3 text-center text-xs text-gray-400">
        You will be redirected to iVeri to complete payment securely.
      </p>

      <button
        type="button"
        onClick={() => router.back()}
        className="mt-3 w-full text-center text-sm text-gray-400 hover:text-gray-600"
      >
        Cancel
      </button>
    </div>
  )
}
