'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDecimalInput } from '@/lib/hooks/useDecimalInput'
import Image from 'next/image'
import {
  ArrowLeft, ShieldCheck, Coins,
  MapPin, CalendarDays, Clock, Users, Loader2,
} from 'lucide-react'
import type { DiningBooking } from '@/lib/types/bookings'
import { formatDateMedium, formatTime } from '@/lib/utils/format'
import { resolveSessionId, resolveMerchantTrace, resolveGatewayUrl, submitGatewayForm } from '@/lib/utils/payment'
import { SESSION_KEY_DINING_PAYMENT as SESSION_KEY } from '@/lib/constants/sessionKeys'
import { CurrencyInput } from '@/components/shared/CurrencyInput'
import { PaymentMethodCard } from '@/components/shared/PaymentMethodCard'
import { TermsCheckbox } from '@/components/shared/TermsCheckbox'

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

  const amountInput = useDecimalInput(defaultAmount)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const numAmount = amountInput.numericValue
  const cashbackEarned = numAmount > 0 ? Math.round(numAmount * cashbackRate / 100 * 100) / 100 : 0

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
              <span>{formatDateMedium(booking.booking_date)}</span>
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
        <CurrencyInput
          label="Total Bill Amount"
          value={amountInput.value}
          onChange={e => { amountInput.onChange(e); setError(null) }}
          size="md"
        />
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
          <p className="text-xl font-extrabold text-violet-600">₨{cashbackEarned.toFixed(2)}</p>
        </div>
      )}

      <PaymentMethodCard />

      <div className="mb-5">
        <TermsCheckbox checked={agreed} onChange={setAgreed}>
          I agree to the PassPrivé{' '}
          <a href="/terms" className="underline text-gray-800" target="_blank" rel="noopener noreferrer">payment terms</a>{' '}
          and confirm the bill amount is correct.
        </TermsCheckbox>
      </div>

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
          : <><ShieldCheck className="w-5 h-5" /> Pay ₨{numAmount > 0 ? numAmount.toLocaleString() : '—'}</>}
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
