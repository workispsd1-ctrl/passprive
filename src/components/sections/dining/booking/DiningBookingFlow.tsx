'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronLeft, Loader2, CheckCircle2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserPlan } from '@/lib/context/PlanContext'
import { useAuthPrompt } from '@/lib/context/AuthPromptContext'
import { canPayBill, getCashbackPct, type CashbackPlan, type MerchantCapabilityFields } from '@/lib/cashback'
import { buildDates, buildSlots, dayLabel, defaultMeal, longDate, type HoursRow, type Meal, type Slot } from '@/lib/booking/slots'
import type { BookingOption, DiningBooking } from '@/lib/booking/payload'
import { confirmBooking, startBookingPayment } from '@/lib/booking/client'
import { DateStrip, SlotGrid, TermsBlock } from '@/components/sections/booking/BookingPickers'
import type { DiningOffer } from '@/lib/types/dining'

const GUESTS = Array.from({ length: 15 }, (_, i) => i + 1)
const MEALS: Meal[] = ['Lunch', 'Dinner']
// app parity: BookTableModal.jsx DATE_COUNT
const DATE_COUNT = 14
const NEXT_PLAN: Partial<Record<CashbackPlan, CashbackPlan>> = { free: 'premiere', premiere: 'black' }
const PLAN_LABEL: Record<CashbackPlan, string> = { free: 'Free', premiere: 'Plus', black: 'Black' }

// app parity: ReviewRestaurantBooking.jsx default terms
const TERMS = [
  'Please arrive 15 minutes prior to your reservation time.',
  'Booking valid for the specified number of guests entered during reservation',
  'Cover charges upon entry are subject to the discretion of the restaurant',
  'Additional service charges on the bill are at the restaurant’s discretion',
  'House rules are to be observed at all times',
  'Special requests will be accommodated at the restaurant’s discretion',
  'Offers can be availed only by paying via PassPrivé',
  'Cover charges cannot be refunded if slot is cancelled within 30 minutes of slot start time',
  'Other T&Cs may apply',
]

/** app parity: `mapRestaurantOfferToCardOffer` + `getOfferLabel` */
function offerLabel(o: DiningOffer): string {
  const type = (o.offer_type ?? '').toLowerCase()
  const v = Number(o.discount_value)
  if (Number.isFinite(v) && v > 0) return type === 'percentage' || type === 'percent' ? `${v}% OFF` : `MUR ${v} OFF`
  return o.title
}

type Option = { key: string; label: string; offer: DiningOffer | null }

export interface DiningBookingRestaurant extends MerchantCapabilityFields {
  id: string
  name: string
  cover_charge_enabled: boolean
  cover_charge_amount: number | null
}

interface Props {
  restaurant: DiningBookingRestaurant
  hours: HoursRow[]
  offers: DiningOffer[]
  isLoggedIn: boolean
  backHref: string
}

export function DiningBookingFlow({ restaurant, hours, offers, isLoggedIn, backHref }: Props) {
  const router = useRouter()
  const plan = useUserPlan()
  const { promptLogin } = useAuthPrompt()
  const dates = useMemo(() => buildDates(DATE_COUNT), [])

  const [step, setStep] = useState<'select' | 'review'>('select')
  const [guests, setGuests] = useState(2)
  const [dateId, setDateId] = useState(dates[0].id)
  const [pickedMeal, setPickedMeal] = useState<Meal>(defaultMeal)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [optionKey, setOptionKey] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmedOffline, setConfirmedOffline] = useState(false)

  const date = dates.find(d => d.id === dateId) ?? dates[0]
  const slots = useMemo(() => buildSlots(hours, date), [hours, date])
  const lunch = slots.filter(s => s.meal === 'Lunch')
  const dinner = slots.filter(s => s.meal === 'Dinner')

  // app parity: fall over to the other meal when the chosen one has no slots
  const meal: Meal =
    pickedMeal === 'Lunch' && !lunch.length && dinner.length ? 'Dinner'
      : pickedMeal === 'Dinner' && !dinner.length && lunch.length ? 'Lunch'
        : pickedMeal

  function clearSlot() {
    setSlot(null)
    setOptionKey(null)
  }

  const mealSlots = meal === 'Lunch' ? lunch : dinner
  const payBillLive = canPayBill(restaurant)
  const cashbackPct = payBillLive ? getCashbackPct(restaurant, plan) : 0
  const nextPlan = NEXT_PLAN[plan]
  const nextCashbackPct = nextPlan && payBillLive ? getCashbackPct(restaurant, nextPlan) : 0

  const coverAmount = Number(restaurant.cover_charge_amount)
  const hasCoverCharge = restaurant.cover_charge_enabled && Number.isFinite(coverAmount) && coverAmount > 0

  // app parity: BookTableModal `offerOptions` — offers only when pay-bill is live
  const options: Option[] = useMemo(() => {
    const fromOffers = payBillLive
      ? offers.map(o => ({ key: `offer-${o.id}`, label: offerLabel(o), offer: o })).filter(o => o.label)
      : []
    return fromOffers.length ? fromOffers : [{ key: 'regular', label: 'Regular table reservation', offer: null }]
  }, [offers, payBillLive])

  const chosen = options.find(o => o.key === optionKey) ?? null

  function pickSlot(s: Slot) {
    setSlot(s)
    setOptionKey(k => k ?? options[0]?.key ?? null)
  }

  /** app parity: RestaurantDetails.jsx BookTableModal `onSelectSlot` option shape. */
  const bookingOption: BookingOption | null = chosen
    ? chosen.offer
      ? {
          type: 'Discount for selected time',
          label: chosen.label,
          id: chosen.offer.id,
          offerId: chosen.offer.id,
          offer_id: chosen.offer.id,
          title: chosen.offer.title,
          benefitLabel: chosen.label,
          upgradePlan: null,
          coverChargeRequired: hasCoverCharge,
          coverChargeAmount: hasCoverCharge ? coverAmount : null,
        }
      : {
          type: 'Regular table reservation',
          label: hasCoverCharge ? `MUR ${coverAmount} cover charge required` : 'No cover charge required',
          coverChargeRequired: hasCoverCharge,
          coverChargeAmount: hasCoverCharge ? coverAmount : null,
        }
    : null

  const payAmount = bookingOption?.coverChargeRequired ? (bookingOption.coverChargeAmount ?? 0) : 0
  const isFree = payAmount <= 0
  const ctaLabel = isFree
    ? 'Book Now'
    : chosen?.offer
      ? `Pay MUR ${payAmount} • ${chosen.label} on final bill`
      : 'Proceed to Payment'

  async function handleConfirm() {
    if (!slot || !bookingOption) return
    if (!isLoggedIn) { promptLogin(); return }
    setError(null)
    setSubmitting(true)
    const booking: DiningBooking = {
      kind: 'restaurant',
      restaurantId: restaurant.id,
      guests,
      dateId,
      time24: slot.time24,
      meal,
      option: bookingOption,
      notes: notes.trim(),
    }
    try {
      if (isFree) {
        const { booking: row } = await confirmBooking(booking)
        if (row?.id) { router.push(`/bookings/${row.id}`); return }
        setConfirmedOffline(true)
      } else {
        await startBookingPayment(booking)
        return // navigating to the gateway
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not confirm your booking right now.')
    }
    setSubmitting(false)
  }

  if (confirmedOffline && slot) {
    return (
      <div className='mx-auto flex max-w-md flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-8 text-center'>
        <CheckCircle2 className='h-14 w-14 text-green-600' />
        <p className='text-xl font-extrabold text-gray-900'>Table booked</p>
        <p className='text-sm text-gray-500'>
          {restaurant.name} · {dayLabel(dateId)}, {slot.label} · {guests} guest{guests === 1 ? '' : 's'}
        </p>
        <Link href='/bookings' className='mt-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-dark'>
          View my bookings
        </Link>
      </div>
    )
  }

  /* ── Review (app parity: ReviewRestaurantBooking.jsx) ─────────────── */
  if (step === 'review' && slot && bookingOption) {
    return (
      <div className='mx-auto flex max-w-2xl flex-col gap-4'>
        <button type='button' onClick={() => setStep('select')} className='flex w-fit items-center gap-1 text-sm font-semibold text-gray-600 hover:text-gray-900'>
          <ChevronLeft className='h-4 w-4' /> Change slot
        </button>

        <div className='rounded-2xl border border-gray-200 bg-white p-5'>
          <p className='text-[12px] font-semibold tracking-wide text-gray-400 uppercase'>Booking summary</p>
          <div className='mt-3 grid grid-cols-3 divide-x divide-gray-100 text-center'>
            <div className='px-2'>
              <p className='text-[15px] font-bold text-gray-900'>{dayLabel(dateId)}</p>
              <p className='text-[12px] text-gray-500'>{longDate(dateId)}</p>
            </div>
            <div className='px-2'>
              <p className='text-[15px] font-bold text-gray-900'>{slot.label}</p>
              <p className='text-[12px] text-gray-500'>{meal}</p>
            </div>
            <div className='px-2'>
              <p className='text-[15px] font-bold text-gray-900'>{guests}</p>
              <p className='text-[12px] text-gray-500'>Guest{guests === 1 ? '' : 's'}</p>
            </div>
          </div>
        </div>

        <div className='rounded-2xl border border-gray-200 bg-white p-5'>
          <p className='text-[12px] font-semibold tracking-wide text-gray-400 uppercase'>Benefits</p>
          <p className='mt-2 text-[15px] font-bold text-gray-900'>{chosen?.offer ? chosen.label : bookingOption.label}</p>
          {chosen?.offer && (
            <p className='mt-0.5 text-[12px] text-gray-500'>
              {hasCoverCharge ? `MUR ${coverAmount} cover charge required` : 'No cover charge required'}
            </p>
          )}
          {cashbackPct > 0 && (
            <p className='mt-2 inline-flex rounded-full bg-brand-tint px-2.5 py-1 text-[12px] font-semibold text-brand-dark'>
              + {cashbackPct}% cashback when you pay your bill via PassPrivé
            </p>
          )}
        </div>

        {hasCoverCharge && (
          <div className='rounded-2xl border border-gray-200 bg-white p-5'>
            <div className='flex items-center justify-between text-[14px]'>
              <span className='text-gray-600'>Cover charge</span>
              <span className='font-bold text-gray-900'>MUR {payAmount}</span>
            </div>
            <p className='mt-2 flex items-start gap-1.5 text-[12px] text-gray-500'>
              <Info className='mt-0.5 h-3.5 w-3.5 shrink-0' />
              Cover charge is redeemable when you pay your bill via PassPrivé.
            </p>
          </div>
        )}

        <div className='rounded-2xl border border-gray-200 bg-white p-5'>
          <button type='button' onClick={() => setShowNotes(v => !v)} className='text-[14px] font-semibold text-brand'>
            {showNotes ? 'Hide special request' : '+ Add special request'}
          </button>
          {showNotes && (
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              maxLength={300}
              placeholder='Birthday, window seat, allergies…'
              className='mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none'
            />
          )}
        </div>

        <TermsBlock terms={TERMS} />

        {error && <p className='rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600'>{error}</p>}

        <button
          type='button'
          disabled={submitting}
          onClick={handleConfirm}
          className='flex items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-60'
        >
          {submitting && <Loader2 className='h-4 w-4 animate-spin' />}
          {isLoggedIn ? ctaLabel : 'Log in to book'}
        </button>
      </div>
    )
  }

  /* ── Select (app parity: BookTableModal.jsx) ──────────────────────── */
  return (
    <div className='mx-auto flex max-w-2xl flex-col gap-6 rounded-2xl border border-gray-200 bg-white p-5 md:p-6'>
      <p className='text-[16px] text-gray-700'>
        Booking table at <span className='font-bold text-gray-900'>{restaurant.name}</span>
      </p>

      {!slot ? (
        <>
          <section>
            <p className='mb-3 text-[14px] font-bold text-gray-900'>Number of guest(s)</p>
            <div className='scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1'>
              {GUESTS.map(g => (
                <button
                  key={g}
                  type='button'
                  onClick={() => setGuests(g)}
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[14px] font-semibold transition-colors',
                    g === guests ? 'border-brand bg-brand text-white' : 'border-gray-200 text-gray-800 hover:border-gray-400',
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className='mb-3 text-[14px] font-bold text-gray-900'>When are you visiting?</p>
            <DateStrip dates={dates} selectedId={dateId} onSelect={id => { setDateId(id); clearSlot() }} />
          </section>

          <section>
            <div className='mb-3 flex gap-2'>
              {MEALS.map(m => {
                const count = (m === 'Lunch' ? lunch : dinner).length
                return (
                  <button
                    key={m}
                    type='button'
                    disabled={!count}
                    onClick={() => { setPickedMeal(m); clearSlot() }}
                    className={cn(
                      'rounded-full border px-5 py-1.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                      meal === m ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-400',
                    )}
                  >
                    {m}
                  </button>
                )
              })}
            </div>
            <SlotGrid
              slots={mealSlots}
              selected={null}
              onSelect={pickSlot}
              emptyText={slots.length ? `No ${meal.toLowerCase()} slots on this day` : 'No slots available on this day'}
            />
          </section>
        </>
      ) : (
        <>
          <div className='flex flex-wrap gap-2'>
            {[`${guests} guest${guests === 1 ? '' : 's'}`, `${date.day} ${date.month}`, meal].map(label => (
              <button
                key={label}
                type='button'
                onClick={() => setSlot(null)}
                className='flex items-center gap-1 rounded-full border border-brand/30 bg-brand/5 px-3 py-1.5 text-[13px] font-semibold text-gray-900'
              >
                {label} <ChevronDown className='h-3.5 w-3.5 text-brand' />
              </button>
            ))}
          </div>

          <div className='scrollbar-hide -mx-1 flex gap-2 overflow-x-auto px-1 pb-1'>
            {mealSlots.map(s => (
              <button
                key={s.absoluteMinutes}
                type='button'
                onClick={() => setSlot(s)}
                className={cn(
                  'shrink-0 rounded-xl border px-4 py-2 text-[13px] font-bold transition-colors',
                  s.time24 === slot.time24 ? 'border-brand bg-brand text-white' : 'border-gray-200 text-gray-800 hover:border-gray-400',
                )}
              >
                {s.label}
              </button>
            ))}
          </div>

          <section>
            <p className='mb-3 text-[14px] font-bold text-gray-900'>Choose preferred option for {slot.label}</p>
            <div className='flex flex-col gap-3'>
              {options.map(o => {
                const active = o.key === optionKey
                return (
                  <div key={o.key}>
                    <button
                      type='button'
                      onClick={() => setOptionKey(o.key)}
                      className={cn(
                        'flex w-full items-start justify-between gap-3 rounded-2xl border p-4 text-left transition-colors',
                        active ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-gray-400',
                      )}
                    >
                      <div>
                        <p className='text-[15px] font-bold text-gray-900'>{o.label}</p>
                        {hasCoverCharge && <p className='mt-0.5 text-[12px] text-gray-500'>Redeemable cover charge: MUR {coverAmount}</p>}
                        {cashbackPct > 0 && (
                          <span className='mt-2 inline-flex rounded-full bg-brand-tint px-2 py-0.5 text-[11px] font-semibold text-brand-dark'>
                            + {cashbackPct}% cashback
                          </span>
                        )}
                      </div>
                      <span className={cn('mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', active ? 'border-brand' : 'border-gray-300')}>
                        {active && <span className='h-2.5 w-2.5 rounded-full bg-brand' />}
                      </span>
                    </button>
                    {/* app parity: one-tier-up upsell under each offer */}
                    {o.offer && nextPlan && nextCashbackPct > cashbackPct && (
                      <Link
                        href='/membership'
                        className='-mt-2 flex items-center justify-between rounded-b-2xl bg-linear-to-r from-[#211B1B] to-[#685125] px-4 pt-4 pb-3 text-[13px] font-semibold text-white'
                      >
                        <span>{nextCashbackPct}% cashback with {PLAN_LABEL[nextPlan]}</span>
                        <span className='text-brand'>Upgrade &amp; Apply →</span>
                      </Link>
                    )}
                  </div>
                )
              })}
              {!payBillLive && (
                <p className='text-[12px] text-gray-400'>Offers and cashback aren’t available at this restaurant yet.</p>
              )}
            </div>
          </section>

          {hasCoverCharge && (
            <p className='text-center text-[12px] text-gray-500'>
              Cover charge is <span className='font-semibold text-blue-600'>redeemable</span> when you pay bill via PassPrivé
            </p>
          )}

          <button
            type='button'
            disabled={!optionKey}
            onClick={() => setStep('review')}
            className='rounded-full bg-brand py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-40'
          >
            Proceed
          </button>
        </>
      )}

      <Link href={backHref} className='text-center text-[13px] text-gray-500 hover:text-gray-800'>Back to {restaurant.name}</Link>
    </div>
  )
}
