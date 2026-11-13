'use client'

import { useState } from 'react'
import type { CardChipKey } from '@/lib/cardChips'
import { CardChips } from '@/components/shared/CardChips'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Check, ChevronDown, ChevronLeft, Flame, Gem, Globe, Heart, Phone, Share, Signpost } from 'lucide-react'
import { useGallery } from '@/components/sections/dining/PhotoGalleryClient'
import { OpeningHoursPill } from '@/components/shared/detail/OpeningHours'
import { areaLabel } from '@/components/shared/detail/MobileTitleCard'
import { directionsUrl, shareLink, useSaveMerchant } from '@/components/shared/detail/MerchantActions'
import { UpsellBannerPager } from '@/components/shared/detail/UpsellBannerPager'
import { canPayBill, getCashbackPct, isCashbackEnabled } from '@/lib/cashback'
import { useLocation } from '@/lib/context/LocationContext'
import type { HoursRow } from '@/lib/openingHours'
import type { DiscountCaps } from '@/lib/services/membershipCaps'
import type { ServiceStore, Store } from '@/lib/types/stores'
import { isPickupPremium, isSubscribed } from '@/lib/storeBadges'
import { cn, formatDistanceKm, haversineKm } from '@/lib/utils'
import { AuthLink } from '@/components/shared/AuthLink'
import { HuntSpot } from '@/components/hunt/HuntSpot'

/*
 * Figma "Salon details – Desktop" (1920 frame). Every length is in design px
 * via `--u` (1px at 1920, proportional at any other width) — see the page.
 */

const A = '/assets/merchant-detail'

/** A salon or a shopping store — both screens share this hero. */
type HeroStore = Store & Partial<Pick<ServiceStore, 'store_subscriptions' | 'is_advertised'>>
const ROUND = 'flex size-[calc(40*var(--u))] shrink-0 items-center justify-center rounded-full bg-[#f4f4f4] text-[#717171] hover:bg-[#ebebeb]'

function Tag({ icon: Icon, label }: { icon: typeof Flame; label: string }) {
  return (
    <span className='inline-flex h-[calc(26*var(--u))] items-center gap-[calc(5*var(--u))] rounded-full border-[calc(0.7*var(--u))] border-[#dcceb6] bg-white px-[calc(12*var(--u))] text-[calc(12*var(--u))] leading-[calc(16*var(--u))] font-medium whitespace-nowrap text-[#717171]'>
      <Icon className='size-[calc(12*var(--u))]' />
      {label}
    </span>
  )
}

/** Earn line + "Book a slot" / "Pay bill" — app parity: ServiceStoreDetails.jsx bottom actions. */
function Actions({ store, bookHref }: { store: HeroStore; bookHref: string | null }) {
  const showPay = canPayBill(store)
  // "up to" — what a Black member earns here
  const upTo = showPay ? getCashbackPct(store, 'black') : 0
  const button = 'flex h-[calc(48*var(--u))] w-[calc(200*var(--u))] items-center justify-center rounded-full px-[calc(28*var(--u))] text-[calc(16*var(--u))] leading-[calc(21*var(--u))] font-bold whitespace-nowrap transition-colors'
  if (!bookHref && !showPay) return null

  return (
    <>
      {upTo > 0 && (
        <p className='flex items-center gap-[calc(16*var(--u))]'>
          {/* the coin's art says "6x": Black's 3% against the free 0.5% */}
          {upTo === 3 && <Image src={`${A}/earn-coin.png`} alt='' width={52} height={52} className='size-[calc(52*var(--u))] shrink-0' />}
          <span className='min-w-0 text-[calc(18*var(--u))] leading-[calc(23*var(--u))] font-semibold text-[#424144]'>
            Earn up to <span className='text-[#0248f6]'>{upTo}% cashback</span> on bill payment
          </span>
        </p>
      )}
      <div className='flex gap-[calc(16*var(--u))]'>
        {bookHref && (
          <AuthLink href={bookHref} className={cn(button, 'border border-[#ff4800] bg-white text-[#ff4800] hover:bg-[#fff1eb]')}>
            Book a slot
          </AuthLink>
        )}
        {showPay && (
          // app parity: ServiceStoreDetails "Pay bill" → Paybill with paymentSource 'store'
          <AuthLink href={`/pay-bill?store_id=${store.id}`} className={cn(button, 'bg-[#ff4800] text-white hover:bg-brand-dark')}>
            Pay bill
          </AuthLink>
        )}
      </div>
    </>
  )
}

/** "‹ Back" above the hero — Figma: 24/31 SemiBold #FF4800 beside a 40px chevron. */
export function WellnessBackLink({ backHref = '/wellness' }: { backHref?: string }) {
  const router = useRouter()
  return (
    <button
      type='button'
      onClick={() => (history.length > 1 ? router.back() : router.push(backHref))}
      className='mt-4 flex h-[calc(40*var(--u))] items-center self-start text-[calc(24*var(--u))] leading-[calc(31*var(--u))] font-semibold text-[#ff4800] hover:opacity-80 max-md:h-8 max-md:text-[16px] md:mt-[calc(60*var(--u))] md:ml-[calc(-10*var(--u))] max-md:[&>svg]:size-5'
    >
      <ChevronLeft className='size-[calc(40*var(--u))]' strokeWidth={1.8} />
      Back
    </button>
  )
}

/** Top of the salon page on desktop: the photo beside the details and the cashback banner. */
export function WellnessDesktopHero({
  store,
  address,
  hours,
  bookHref,
  offerPct,
  caps,
  chips = [],
  backHref = '/wellness',
  trending = store.is_advertised === true,
  website = null,
}: {
  store: HeroStore
  address: string
  hours: HoursRow[]
  bookHref: string | null
  offerPct: number
  caps: DiscountCaps
  chips?: CardChipKey[]
  /** where Back goes when there's no history */
  backHref?: string
  /** the shopping screen flags promoted stores, the salon screen advertised ones */
  trending?: boolean
  /** shopping stores link their site (app parity: StoreDetails website action) */
  website?: string | null
}) {
  const { openAt } = useGallery()
  const { location } = useLocation()
  const router = useRouter()
  const saver = useSaveMerchant(store.id, 'STORE')
  const [copied, setCopied] = useState(false)
  const [showAddress, setShowAddress] = useState(false)

  const { lat, lng, name, phone } = store
  const distance =
    location.lat != null && location.lng != null && lat != null && lng != null
      ? formatDistanceKm(haversineKm(location.lat, location.lng, Number(lat), Number(lng)))
      : null
  const subtitle = [store.category, store.subcategory].filter(Boolean).join(' • ')
  const place = [distance, areaLabel(store.location_name, store.city)].filter(Boolean).join(' • ')
  const logo = store.logo_url ?? store.cover_image
  const exclusiveZone = isPickupPremium(store)
  // the same "Exclusive" tag this salon's card shows
  const exclusive = isSubscribed(store)

  return (
    <section className='grid grid-cols-1 gap-y-4 pt-[calc(24*var(--u))] font-(family-name:--font-dm-sans) max-md:pt-3 md:grid-cols-[minmax(0,980fr)_minmax(0,568fr)] md:gap-x-[calc(28*var(--u))] md:gap-y-0'>
      {/* Salon photograph — 980×480, 18 radius, actions in a 24px-padded row */}
      <div className='relative min-h-[calc(480*var(--u))] overflow-hidden rounded-[calc(18*var(--u))] bg-[#f1f1f1] max-md:aspect-16/10 max-md:min-h-0'>
        <button type='button' onClick={() => openAt(0)} aria-label={`View photos of ${name}`} className='group absolute inset-0'>
          {store.cover_image && <Image src={store.cover_image} alt={name} fill priority sizes='52vw' className='object-cover transition-transform duration-500 group-hover:scale-[1.02]' />}
        </button>
        <div className='pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-[calc(24*var(--u))]'>
          <button
            type='button'
            onClick={() => (history.length > 1 ? router.back() : router.push(backHref))}
            aria-label='Back'
            className='pointer-events-auto flex size-[calc(44*var(--u))] items-center justify-center rounded-full text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]'
          >
            <ChevronLeft className='size-[calc(24*var(--u))]' strokeWidth={2} />
          </button>
          <div className='pointer-events-auto flex items-center gap-[calc(12*var(--u))]'>
            <button
              type='button'
              onClick={saver.onSave}
              aria-label={saver.saved ? 'Edit saved lists' : 'Save'}
              aria-pressed={saver.saved}
              className='flex size-[calc(40*var(--u))] items-center justify-center rounded-[calc(20*var(--u))] bg-[rgba(217,217,217,0.1)] text-white'
            >
              <Heart className={cn('size-[calc(22*var(--u))]', saver.saved && 'fill-brand text-brand')} strokeWidth={1.4} />
            </button>
            <button
              type='button'
              onClick={async () => { if (await shareLink(name)) { setCopied(true); setTimeout(() => setCopied(false), 2000) } }}
              aria-label={copied ? 'Link copied' : 'Share'}
              className='flex size-[calc(40*var(--u))] items-center justify-center rounded-full bg-white/20 text-white'
            >
              {copied ? <Check className='size-[calc(18*var(--u))]' strokeWidth={1.4} /> : <Share className='size-[calc(18*var(--u))]' strokeWidth={1.4} />}
            </button>
          </div>
        </div>
        {saver.sheet(name)}
      </div>

      {/* Salon information and reward — 568 wide, 20 apart */}
      <div className='flex min-w-0 flex-col gap-[calc(20*var(--u))]'>
        <div className='relative flex flex-1 flex-col gap-[calc(12*var(--u))] rounded-[calc(18*var(--u))] bg-white px-[calc(28*var(--u))] pt-[calc(28*var(--u))] pb-[calc(14*var(--u))] shadow-[0_calc(4*var(--u))_calc(24*var(--u))_rgba(0,0,0,0.05)]'>
          {/* app parity: ServiceStoreDetails MerchantInfoCard HuntSpot */}
          <HuntSpot slot='merchant-card' />
          <div className='flex items-center gap-[calc(18*var(--u))]'>
            {logo && (
              <span className='relative h-[calc(88*var(--u))] w-[calc(82*var(--u))] max-md:h-16 max-md:w-15 shrink-0 overflow-hidden rounded-[calc(16*var(--u))] bg-gray-100'>
                <Image src={logo} alt='' fill sizes='82px' className='object-cover' />
              </span>
            )}
            <div className='flex min-w-0 flex-1 flex-col gap-[calc(8*var(--u))]'>
              <h1 className='text-[calc(30*var(--u))] leading-[calc(39*var(--u))] max-md:text-[22px] max-md:leading-7 font-bold tracking-[calc(-0.7*var(--u))] wrap-break-word text-[#2c2d32]'>{name}</h1>
              {subtitle && <p className='text-[calc(14*var(--u))] leading-[calc(20*var(--u))] font-medium wrap-break-word text-[#717171]'>{subtitle}</p>}
              {place && (
                <button
                  type='button'
                  onClick={() => setShowAddress(v => !v)}
                  aria-expanded={showAddress}
                  disabled={!address}
                  className='flex items-center gap-[calc(8*var(--u))] text-left text-[calc(14*var(--u))] leading-[calc(20*var(--u))] font-medium text-[#9b969d]'
                >
                  <span className='min-w-0 wrap-break-word'>{place}</span>
                  {address && <ChevronDown className={cn('size-[calc(14*var(--u))] shrink-0 text-[#ff4800] transition-transform', !showAddress && '-rotate-90')} strokeWidth={2.4} />}
                </button>
              )}
              {showAddress && address && <p className='text-[calc(14*var(--u))] leading-[calc(20*var(--u))] wrap-break-word text-[#767677]'>{address}</p>}
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-[calc(8*var(--u))]'>
            <OpeningHoursPill hours={hours} variant='wellness' />
            {(address || (lat != null && lng != null)) && (
              <a href={directionsUrl(lat, lng, address)} target='_blank' rel='noreferrer' aria-label='Get directions' className={ROUND}>
                <Signpost className='size-[calc(18*var(--u))]' strokeWidth={1.3} />
              </a>
            )}
            {phone && (
              <a href={`tel:${phone}`} aria-label={`Call ${name}`} className={ROUND}>
                <Phone className='size-[calc(18*var(--u))]' strokeWidth={1.3} />
              </a>
            )}
            {website && (
              <a href={website} target='_blank' rel='noreferrer' aria-label='Visit website' className={ROUND}>
                <Globe className='size-[calc(18*var(--u))]' strokeWidth={1.3} />
              </a>
            )}
          </div>

          {/* app parity: ServiceStoreDetails.jsx MerchantInfoCard pills */}
          {(trending || exclusive || exclusiveZone) && (
            <div className='flex flex-wrap items-center gap-[calc(8*var(--u))]'>
              {trending && <Tag icon={Flame} label='Trending' />}
              {exclusive && <Tag icon={Gem} label='Exclusive' />}
              {exclusiveZone && <Tag icon={Gem} label='Exclusive Zone' />}
            </div>
          )}
          {/* app parity: MerchantInfoCard.jsx CardChips */}
          <CardChips chips={chips} height='calc(21*var(--u))' className='gap-[calc(6*var(--u))]' />

          {/*
            pinned to the card's foot: the card stretches to the photo's 480 when
            the cashback banner below isn't showing (Black members, no cashback),
            so the gap opens above the actions instead of under them
          */}
          <div className='mt-auto flex flex-col gap-[calc(12*var(--u))]'>
            <Actions store={store} bookHref={bookHref} />
          </div>
        </div>

        <UpsellBannerPager
          eligible={isCashbackEnabled(store)}
          merchantType={store.merchant_type}
          merchantId={store.id}
          kind='store'
          offerPct={offerPct}
          caps={caps}
          variant='figma'
        />
      </div>
    </section>
  )
}
