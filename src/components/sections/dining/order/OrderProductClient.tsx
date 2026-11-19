'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Award, ChevronLeft, ChevronRight, Share } from 'lucide-react'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCashbackPct, type MerchantCapabilityFields } from '@/lib/cashback'
import type { OrderItem } from '@/lib/orderCollect'
import { DetailSectionTabs, type DetailTab } from '@/components/shared/detail/DetailSectionTabs'
import { cn } from '@/lib/utils'
import { OC_PAGE, OC_UNIT } from './unit'
import { ItemImage, QtyControl, ShareButton, VegMark, mur, productHref, shareLink } from './OrderParts'
import { useOrderCart } from './useOrderCart'

/** Figma price tag: #2247FF block with a column of punched dots on its left edge. */
function PriceTag({ price, size }: { price: number; size: 'md' | 'lg' }) {
  const lg = size === 'lg'
  return (
    <span
      className={cn(
        'relative inline-flex items-center justify-center bg-[#2247FF] font-bold text-white',
        lg ? 'h-61 min-w-168 px-14 text-[calc(33.6*var(--u))] leading-[calc(44*var(--u))] max-lg:h-48 max-lg:min-w-120 max-lg:text-[24px]' : 'h-[calc(43.5*var(--u))] min-w-120 px-10 text-[calc(24*var(--u))] leading-[calc(31*var(--u))]',
      )}
    >
      <span aria-hidden className={cn('absolute top-1/2 flex -translate-y-1/2 flex-col', lg ? '-left-4 gap-[calc(6.3*var(--u))]' : '-left-3 gap-[calc(4.5*var(--u))]')}>
        {Array.from({ length: lg ? 6 : 5 }, (_, i) => (
          <span key={i} className={cn('rounded-full bg-white', lg ? 'size-[calc(8.4*var(--u))]' : 'size-6')} />
        ))}
      </span>
      {mur(price)}
    </span>
  )
}

/**
 * Figma "Product information" — app parity: OrderProductDetailScreen.jsx.
 * Server sections (offers row, stamp card, photos, reviews) come in as slots
 * so this component only owns the cart, shared with the menu through
 * useOrderCart.
 */
export function OrderProductClient({
  restaurant,
  slug,
  item,
  items,
  similar,
  browseOnly,
  cashback,
  stamps,
  offers,
  photos,
  reviews,
}: {
  restaurant: MerchantCapabilityFields & { id: string; name: string }
  slug: string
  item: OrderItem
  items: OrderItem[]
  similar: OrderItem[]
  browseOnly: boolean
  /** UpsellBannerPager — the "Earn Nx more cashback" banner */
  cashback: React.ReactNode
  stamps: React.ReactNode
  offers: React.ReactNode
  photos: React.ReactNode
  reviews: React.ReactNode
}) {
  const plan = useUserPlan()
  const { cart, add, remove } = useOrderCart(restaurant.id, items)
  const [photo, setPhoto] = useState(0)
  const qty = cart[item.id] ?? 0
  const inCart = Object.values(cart).reduce((a, b) => a + b, 0)
  const menuHref = `/dining/${slug}/order`
  const href = productHref(slug, item)

  // app parity: the cashback this order earns
  const pct = getCashbackPct(restaurant, plan)
  const credits = Number(((item.price * Math.max(qty, 1) * pct) / 100).toFixed(2))

  const gallery = item.images.length ? item.images : item.image ? [item.image] : []
  // a tab drops out on its own when its section isn't on the page (DetailSectionTabs)
  const tabs = [
    { id: 'offers', label: 'Offers' },
    similar.length > 0 && { id: 'similar', label: 'Similar products' },
    { id: 'gallery', label: 'Photos' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'details', label: 'Details' },
  ].filter((t): t is DetailTab => !!t)

  const scrollToDetails = () => document.querySelector('[data-section="details"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <main className={cn(OC_PAGE, OC_UNIT, '[--t:0.62px] lg:[--t:var(--u)] px-172 pt-40 pb-80 max-lg:px-16 max-lg:pt-12 max-lg:pb-140')}>
      {/* Figma "Desktop header": back + "Product Information", share on the right */}
      <header className='flex h-64 items-start justify-between max-lg:h-auto max-lg:pb-8'>
        <span className='flex items-start'>
          <Link href={menuHref} aria-label='Back to the menu' className='-ml-8 flex size-40 items-center justify-center rounded-full text-[#938F96] transition-colors hover:bg-black/5 max-lg:-ml-10 max-lg:size-36'>
            <ChevronLeft className='size-24' />
          </Link>
          <h1 className='ml-8 text-[calc(32*var(--u))] leading-[calc(40*var(--u))] font-bold text-[#2C2D32] max-lg:text-[22px] max-lg:leading-36'>Product Information</h1>
        </span>
        <button type='button' onClick={() => { void shareLink(item.name, href) }} aria-label={`Share ${item.name}`} className='flex size-40 items-center justify-center rounded-full text-[#2C2D32] transition-colors hover:bg-black/5 max-lg:size-36'>
          <Share className='size-24 max-lg:size-20' />
        </button>
      </header>

      {/* Figma: gallery 680 wide + details 832, 64 apart, 48 under the header. The photo is as
          tall as the details beside it (up to Figma's 660, at least 440), so a short item — no
          upsell banner, few facts — doesn't leave a tall photo next to empty space */}
      <section className='mt-48 grid grid-cols-[calc(680*var(--u))_minmax(0,1fr)] gap-64 max-lg:mt-12 max-lg:grid-cols-1 max-lg:gap-20'>
        <div className='flex flex-col'>
          <ItemImage
            src={gallery[photo] ?? null}
            sizes='(min-width: 1024px) 36vw, 92vw'
            className='w-full rounded-[calc(24*var(--u))] max-lg:aspect-680/660 max-lg:rounded-[20px] lg:max-h-660 lg:min-h-440 lg:flex-1'
          />
          {gallery.length > 1 && (
            <div className='mt-16 flex gap-12 max-lg:mt-10 max-lg:gap-8'>
              {gallery.map((src, i) => (
                <button
                  key={src}
                  type='button'
                  onClick={() => setPhoto(i)}
                  aria-label={`Photo ${i + 1}`}
                  aria-pressed={i === photo}
                  className={cn('relative size-80 overflow-hidden rounded-[calc(14*var(--u))] border-2 max-lg:size-56 max-lg:rounded-[10px]', i === photo ? 'border-[#FF4800]' : 'border-transparent')}
                >
                  <Image src={src} alt='' fill sizes='80px' className='object-cover' />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className='flex min-w-0 flex-col self-start'>
          <div className='flex items-center justify-between gap-16'>
            {item.isBestseller ? (
              <span className='flex h-[calc(30.8*var(--u))] items-center gap-[calc(2.8*var(--u))] rounded-full bg-[#FFF1EB] px-[calc(11.2*var(--u))] text-[calc(16.8*var(--u))] leading-[calc(22*var(--u))] font-medium text-[#FF4800] max-lg:h-28 max-lg:px-10 max-lg:text-[13px]'>
                <Award className='size-[calc(19.6*var(--u))] max-lg:size-16' /> Top seller
              </span>
            ) : <span />}
            <button
              type='button'
              onClick={scrollToDetails}
              className='flex h-[calc(30.8*var(--u))] items-center rounded-full border-[calc(1.05*var(--u))] border-[#FF4800] px-[calc(11.2*var(--u))] text-[calc(16.8*var(--u))] leading-[calc(22*var(--u))] font-bold text-[#FF4800] transition-colors hover:bg-[#FFF1EB] max-lg:h-28 max-lg:border max-lg:px-12 max-lg:text-[13px]'
            >
              View Details
            </button>
          </div>

          <h2 className='mt-[calc(33.2*var(--u))] text-[calc(32*var(--u))] leading-[calc(40*var(--u))] font-bold text-[#2C2D32] max-lg:mt-14 max-lg:text-[22px] max-lg:leading-30'>{item.name}</h2>

          {/* Figma attribute rows (two columns of 16/24) — the item's real facts */}
          <dl className='mt-36 grid grid-cols-2 gap-x-32 gap-y-16 text-[calc(16*var(--u))] leading-[calc(24*var(--u))] text-[#2C2D32] max-lg:mt-14 max-lg:gap-y-8 max-lg:text-[14px] max-lg:leading-20'>
            <div className='flex gap-4'><dt>Category:</dt><dd className='min-w-0 truncate'>{item.category}</dd></div>
            <div className='flex items-center gap-8'><VegMark veg={item.isVeg} /><dd>{item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}</dd></div>
          </dl>
          {item.description && (
            <p className='mt-16 line-clamp-2 text-[calc(16*var(--u))] leading-[calc(24*var(--u))] text-[#595B61] max-lg:text-[14px] max-lg:leading-20'>{item.description}</p>
          )}

          {/* Figma "Earn 6x cashback": the shared tier upsell banner (hidden for Black members) */}
          <div className='mt-32 w-[calc(751.8*var(--u))] max-w-full empty:hidden max-lg:mt-16 max-lg:w-full'>{cashback}</div>

          {/* Figma "Price and add to cart" (747.6×100.8) */}
          <div className='mt-48 flex w-[calc(747.6*var(--u))] max-w-full items-end justify-between gap-[calc(58.8*var(--u))] max-lg:mt-20 max-lg:w-full max-lg:flex-col max-lg:items-stretch max-lg:gap-16'>
            <span className='flex items-start gap-[calc(10.5*var(--u))] max-lg:items-center max-lg:gap-12'>
              <PriceTag price={item.price} size='lg' />
              <span className='text-[calc(25.2*var(--u))] leading-[calc(33*var(--u))] text-[#595B61] max-lg:text-[15px] max-lg:leading-20'>Inclusive of all taxes</span>
            </span>
            {!browseOnly && (
              qty === 0 ? (
                <button
                  type='button'
                  onClick={() => add(item.id)}
                  className='flex h-[calc(100.8*var(--u))] w-[calc(277.2*var(--u))] shrink-0 items-center justify-center rounded-full bg-[#FF4800] text-[calc(33.6*var(--u))] leading-[calc(44*var(--u))] font-semibold tracking-[-0.02em] text-white transition-colors hover:bg-[#E64200] max-lg:h-56 max-lg:w-full max-lg:text-[18px]'
                >
                  Add to cart
                </button>
              ) : (
                <span className='flex h-[calc(100.8*var(--u))] w-[calc(277.2*var(--u))] shrink-0 items-center justify-between overflow-hidden rounded-full bg-[#FF4800] text-[calc(33.6*var(--u))] font-semibold text-white max-lg:h-56 max-lg:w-full max-lg:text-[20px]'>
                  <button type='button' onClick={() => remove(item.id)} aria-label={`Remove one ${item.name}`} className='flex h-full flex-1 items-center justify-center hover:bg-black/10'>−</button>
                  <span aria-live='polite'>{qty}</span>
                  <button type='button' onClick={() => add(item.id)} aria-label={`Add another ${item.name}`} className='flex h-full flex-1 items-center justify-center hover:bg-black/10'>+</button>
                </span>
              )
            )}
          </div>
          {credits > 0 && (
            // under Add to cart (Figma); under the price when the item can only be browsed
            <p className={cn('mt-16 w-[calc(747.6*var(--u))] max-w-full font-(family-name:--font-inter) text-[calc(18.2*var(--u))] leading-[calc(26*var(--u))] font-semibold text-[#424144] max-lg:w-full max-lg:text-center max-lg:text-[14px]', browseOnly ? 'text-left' : 'text-right')}>
              Earn <span className='text-[#2247FF]'>{credits.toLocaleString('en-US')} Privé credits</span> on bill payment
            </p>
          )}
          {!browseOnly && inCart > 0 && (
            <Link href={menuHref} className='mt-12 flex w-[calc(747.6*var(--u))] max-w-full items-center justify-end gap-4 text-[calc(18*var(--u))] font-semibold text-[#FF4800] hover:underline max-lg:w-full max-lg:justify-center max-lg:text-[15px]'>
              View your order · {inCart} {inCart === 1 ? 'item' : 'items'} <ChevronRight className='size-18' />
            </Link>
          )}
        </div>
      </section>

      {/* Figma "Product section navigation" */}
      <DetailSectionTabs tabs={tabs} title={item.name} variant='wellness' className='mt-64 max-lg:mt-28' />

      {/* Figma "Rewards and offers": the stamp card beside "Offers for today" */}
      <div className={cn('mt-32 max-lg:mt-16', stamps && 'grid grid-cols-[calc(358*var(--u))_minmax(0,1fr)] items-start gap-42 max-lg:grid-cols-1 max-lg:gap-16')}>
        {stamps && <div className='lg:mt-[calc(48*var(--u))]'>{stamps}</div>}
        <div className='min-w-0 [&>section]:mt-0!'>{offers}</div>
      </div>

      {similar.length > 0 && (
        <section data-section='similar' className='mt-48 scroll-mt-140 max-lg:mt-28'>
          <div className='flex items-center justify-between gap-16'>
            <h2 className='text-[calc(24*var(--u))] leading-[calc(32*var(--u))] font-bold text-[#2C2D32] max-lg:text-[18px] max-lg:leading-24'>Similar products</h2>
            <Link href={menuHref} className='flex h-[calc(26.4*var(--u))] items-center rounded-full border-[calc(1.2*var(--u))] border-[#E5E5E5] px-[calc(9.6*var(--u))] text-[calc(13.65*var(--u))] text-[#252427] hover:bg-gray-50 max-lg:h-28 max-lg:border max-lg:px-12 max-lg:text-[13px]'>View all</Link>
          </div>
          <ul className='mt-32 grid grid-cols-3 gap-[calc(34.8*var(--u))] max-lg:mt-14 max-lg:grid-cols-1 max-lg:gap-12'>
            {similar.map(s => {
              const sHref = productHref(slug, s)
              return (
                <li key={s.id} className='relative flex h-[calc(145.6*var(--u))] items-center gap-[calc(16.8*var(--u))] rounded-[calc(22.4*var(--u))] border-[calc(1.4*var(--u))] border-[#EBEBEB] bg-white pr-[calc(16.8*var(--u))] pl-[calc(16.8*var(--u))] shadow-[0_calc(5.6*var(--u))_calc(16.8*var(--u))_rgba(0,0,0,0.02)] max-lg:h-auto max-lg:gap-12 max-lg:rounded-[18px] max-lg:border max-lg:p-12'>
                  <Link href={sHref} className='shrink-0' aria-label={s.name}>
                    <ItemImage src={s.image} sizes='112px' className='size-112 rounded-[calc(16.8*var(--u))] border-[calc(0.7*var(--u))] border-[#F2F2F2] max-lg:size-88 max-lg:rounded-[14px]' />
                  </Link>
                  <div className='flex min-w-0 flex-1 flex-col self-stretch py-[calc(22*var(--u))] max-lg:py-2'>
                    <Link href={sHref} className='truncate pr-[calc(84*var(--u))] text-[calc(21*var(--u))] leading-[calc(27*var(--u))] font-bold text-[#2C2D32] hover:underline max-lg:pr-28 max-lg:text-[16px] max-lg:leading-22'>{s.name}</Link>
                    <span className='mt-[calc(4.4*var(--u))] text-[calc(16.8*var(--u))] leading-[calc(22*var(--u))] font-semibold text-[#2C2D32] max-lg:text-[14px] max-lg:leading-20'>{mur(s.price)}</span>
                    <span className='mt-auto flex items-center justify-between gap-8'>
                      <VegMark veg={s.isVeg} />
                      {!browseOnly && <QtyControl size='lg' qty={cart[s.id] ?? 0} name={s.name} onAdd={() => add(s.id)} onRemove={() => remove(s.id)} />}
                    </span>
                  </div>
                  <ShareButton title={s.name} path={sHref} className='absolute top-[calc(11.2*var(--u))] right-[calc(11.2*var(--u))] size-[calc(33.6*var(--u))] max-lg:top-8 max-lg:right-8 max-lg:size-28' iconClassName='size-[70%]' />
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Figma: Photos (680) beside Reviews (832), 64 apart */}
      <div className={cn('mt-56 items-start gap-64 max-lg:mt-28 max-lg:flex max-lg:flex-col max-lg:gap-28', photos ? 'grid grid-cols-[calc(680*var(--u))_minmax(0,1fr)]' : 'block')}>
        {photos && <div className='min-w-0 w-full'>{photos}</div>}
        <div className='min-w-0 w-full'>{reviews}</div>
      </div>

      <section data-section='details' className='mt-56 scroll-mt-140 max-lg:mt-28'>
        <h2 className='text-[calc(24*var(--u))] leading-[calc(32*var(--u))] font-bold text-[#2C2D32] max-lg:text-[18px] max-lg:leading-24'>Details</h2>
        <dl className='mt-24 grid grid-cols-[auto_1fr] gap-x-32 gap-y-12 text-[calc(16*var(--u))] leading-[calc(24*var(--u))] text-[#2C2D32] max-lg:mt-12 max-lg:gap-x-16 max-lg:text-[14px] max-lg:leading-20'>
          <dt className='text-[#595B61]'>Name</dt><dd>{item.name}</dd>
          <dt className='text-[#595B61]'>Category</dt><dd>{item.category}</dd>
          <dt className='text-[#595B61]'>Dietary</dt><dd>{item.isVeg ? 'Vegetarian' : 'Non-vegetarian'}</dd>
          <dt className='text-[#595B61]'>Price</dt><dd>{mur(item.price)} · inclusive of all taxes</dd>
          <dt className='text-[#595B61]'>From</dt><dd><Link href={`/dining/${slug}`} className='text-[#FF4800] hover:underline'>{restaurant.name}</Link></dd>
          {item.description && (<><dt className='text-[#595B61]'>About</dt><dd>{item.description}</dd></>)}
        </dl>
      </section>

      {/* Figma "Support" strip */}
      <Link href='/help' className='mt-56 flex min-h-[calc(84*var(--u))] items-center justify-between gap-16 rounded-[calc(16.8*var(--u))] bg-[#FFF1CF] px-[calc(25.2*var(--u))] py-[calc(16.8*var(--u))] max-lg:mt-28 max-lg:rounded-[14px] max-lg:px-16 max-lg:py-14'>
        <span className='flex flex-col gap-4 text-[calc(16.8*var(--u))] leading-[calc(23*var(--u))] font-medium max-lg:text-[14px] max-lg:leading-20'>
          <span className='text-[#252525]'>Have queries or need help?</span>
          <span className='flex items-center gap-2 text-[#FF4800]'>Contact help &amp; support <ChevronRight className='size-16' /></span>
        </span>
      </Link>
    </main>
  )
}
