'use client'

import Image from 'next/image'
import { useLocation } from '@/lib/context/LocationContext'
import { cn, formatDistanceKm, haversineKm } from '@/lib/utils'
import { t, u } from './designUnit'

/**
 * Figma "Flow Pay Bill" / "Flow Book Table" building blocks: the restaurant
 * panel on the left of both flows, the 81-tall pill button and the capsule
 * option. Sized in `t` units like the restaurant detail page.
 */

const D = '/figma/detail'
const P = '/figma/paybill'
const INTER = 'font-(family-name:--font-inter)'

export type MerchantPanelData = {
  id: string
  name: string
  area: string | null
  city: string | null
  lat: number | null
  lng: number | null
  cover: string | null
  cuisines: string[]
  costForTwo: number | null
  rating: { avg: number; count: number }
  stampSheet: boolean
  trending: boolean
  exclusive: boolean
}


/** Figma 81-tall pill button — orange, or #d5d5d5 while it can't be pressed. */
export function CardButton({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap text-white transition-colors max-md:w-full!',
        disabled ? 'cursor-not-allowed bg-[#d5d5d5]' : 'bg-[#ff4800] hover:bg-brand-dark',
      )}
      style={{ minWidth: t(328), height: t(81), padding: `0 ${t(40)}`, fontSize: t(24), letterSpacing: t(-0.48) }}
    >
      {children}
    </button>
  )
}

/** Figma "Capsule Button" — 81 tall, 1.5 #d5d5d5 border, 36 icon, 24 Bold label. */
export function Capsule({
  icon,
  title,
  sub,
  trailing,
  selected = false,
  onClick,
  disabled,
  role,
}: {
  icon: React.ReactNode
  title: string
  sub?: string
  trailing: React.ReactNode
  selected?: boolean
  onClick?: () => void
  disabled?: boolean
  role?: 'switch' | 'radio'
}) {
  return (
    <button
      type='button'
      role={role}
      aria-checked={role ? selected : undefined}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center border-solid bg-white text-left transition-colors disabled:opacity-55',
        selected ? 'border-[#ff4800] bg-[#fff8f5]' : 'border-[#d5d5d5] hover:border-[#bdbdbd]',
      )}
      style={{ maxWidth: t(513), minHeight: t(81), borderWidth: t(1.5), borderRadius: t(40.5), padding: `${t(10)} ${t(30)}`, gap: t(18) }}
    >
      {icon}
      <span className='min-w-0 flex-1'>
        <span className='block truncate font-bold text-[#2c2d32]' style={{ fontSize: t(24) }}>{title}</span>
        {sub && <span className='block truncate text-[#8e8e93]' style={{ fontSize: t(18) }}>{sub}</span>}
      </span>
      {trailing}
    </button>
  )
}

export function Radio({ on }: { on: boolean }) {
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full border-solid', on ? 'border-[#ff4800]' : 'border-[#c7c7cc]')} style={{ width: t(28), height: t(28), borderWidth: t(2.5) }}>
      {on && <span className='rounded-full bg-[#ff4800]' style={{ width: t(14), height: t(14) }} />}
    </span>
  )
}


/** Left column — the restaurant (Figma: photo 560×340, name 44, facts with 40 icons, rating, tags). */
export function RestaurantPanel({ r, distance }: { r: MerchantPanelData; distance: string | null }) {
  const facts = [
    distance && { icon: 'location.svg', text: distance },
    r.cuisines.length > 0 && { icon: 'cuisine.svg', text: r.cuisines.join(', ') },
    r.costForTwo != null && { icon: 'cost.svg', text: `MUR ${r.costForTwo.toLocaleString('en-US')} for two` },
  ].filter((f): f is { icon: string; text: string } => !!f)
  const tags = [
    r.stampSheet && { icon: 'tag-stamp.svg', label: 'Stamp sheet', color: '#ff4800', w: 24, h: 26 },
    r.trending && { icon: 'tag-trending.svg', label: 'Trending', color: '#ff6a30', w: 18, h: 24 },
    r.exclusive && { icon: 'tag-exclusive.svg', label: 'Exclusive', color: '#ff6a30', w: 24, h: 21 },
  ].filter((x): x is { icon: string; label: string; color: string; w: number; h: number } => !!x)
  const ratings = r.rating.count >= 1000 ? `${(r.rating.count / 1000).toFixed(1).replace(/\.0$/, '')}k` : String(r.rating.count)

  return (
    <aside className='hidden min-w-0 flex-col md:flex'>
      <div className='relative w-full overflow-hidden bg-[#f1f1f1]' style={{ aspectRatio: '560 / 340', borderRadius: t(25) }}>
        {r.cover && <Image src={r.cover} alt={r.name} fill sizes='(min-width: 1920px) 560px, 30vw' className='object-cover' priority />}
      </div>
      <div className='flex flex-col' style={{ marginTop: t(44), gap: t(32) }}>
        <div>
          <p className='font-semibold text-[#2c2d32]' style={{ fontSize: t(44) }}>{r.name}</p>
          {r.area && <p className='font-medium text-[#5b5a5a]' style={{ fontSize: t(28) }}>{r.area}</p>}
        </div>
        {facts.length > 0 && (
          <ul className='flex flex-col' style={{ gap: t(16) }}>
            {facts.map(f => (
              <li key={f.icon} className='flex items-center font-medium text-[#5b5a5a]' style={{ gap: t(25), fontSize: t(28) }}>
                <Image src={`${P}/${f.icon}`} alt='' width={40} height={40} style={{ width: t(40), height: t(40) }} />
                <span className='truncate'>{f.text}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      {(r.rating.avg > 0 || tags.length > 0) && (
        <div className='flex flex-col' style={{ marginTop: t(48), gap: t(32) }}>
          {r.rating.avg > 0 && (
            <div className='flex items-center' style={{ gap: t(16) }}>
              <span className={`flex items-center justify-center rounded-full bg-[#3aa456] font-bold text-white ${INTER}`} style={{ width: t(120), height: t(48), gap: t(7), fontSize: t(28) }}>
                {r.rating.avg.toFixed(1)}
                <Image src={`${D}/rating-star.svg`} alt='' width={20} height={18} style={{ width: t(20), height: t(18) }} />
              </span>
              <span className={`font-medium text-[#787575] underline ${INTER}`} style={{ fontSize: t(16) }}>{ratings} ratings</span>
            </div>
          )}
          {tags.length > 0 && (
            <div className='flex flex-wrap' style={{ gap: t(13) }}>
              {tags.map(tg => (
                <span key={tg.label} className='inline-flex items-center rounded-full bg-[#fff1eb] font-semibold whitespace-nowrap' style={{ height: t(46), paddingLeft: t(15), paddingRight: t(18), gap: t(9), fontSize: t(24), color: tg.color }}>
                  <Image src={`${D}/${tg.icon}`} alt='' width={tg.w} height={tg.h} style={{ width: t(tg.w), height: t(tg.h) }} />
                  {tg.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </aside>
  )
}


/** Distance from the member's saved location, as "5.3 km". */
export function useDistance(r: Pick<MerchantPanelData, 'lat' | 'lng'>) {
  const { location } = useLocation()
  const km =
    location.lat != null && location.lng != null && r.lat != null && r.lng != null
      ? haversineKm(location.lat, location.lng, Number(r.lat), Number(r.lng))
      : null
  return { km, label: km != null ? formatDistanceKm(km) : null }
}

/**
 * Page frame of the Figma flows — the peach glow, Back, the restaurant on the
 * left and the current step in a white card on the right (phones: a compact
 * header over the card). Must sit inside a TYPE_SCALE + --u wrapper.
 */
export function FlowLayout({
  r,
  label,
  onBack,
  children,
  wide = false,
}: {
  r: MerchantPanelData
  /** small line over the name on phones, e.g. "Booking table at" */
  label: string
  onBack: () => void
  children: React.ReactNode
  /** no restaurant panel — the card takes the width (receipts) */
  wide?: boolean
}) {
  const { label: distance } = useDistance(r)
  return (
    <div className='relative overflow-x-clip'>
      <Image
        src={`${D}/peach-glow.svg`}
        alt=''
        width={1750}
        height={1750}
        aria-hidden='true'
        className='pointer-events-none absolute max-w-none'
        style={{ left: u(-988), top: u(-1150), width: u(1750), height: u(1750) }}
      />
      <div className='relative mx-auto px-4 md:px-[calc(172*var(--u))]' style={{ maxWidth: u(1920), paddingTop: t(48), paddingBottom: t(120) }}>
        <button type='button' onClick={onBack} className='flex items-center font-semibold text-[#ff4800] hover:text-brand-dark' style={{ fontSize: t(24), height: t(40) }}>
          <Image src={`${D}/back-chevron.svg`} alt='' width={40} height={40} style={{ width: t(40), height: t(40), marginRight: t(-12) }} />
          Back
        </button>

        {!wide && (
          <div className='mt-3 text-center md:hidden'>
            <p className='text-[14px] font-medium text-[#8e8e93]'>{label}</p>
            <p className='truncate text-[22px] font-bold text-[#1c1c1e]'>{r.name}</p>
            {(r.area || r.city) && <p className='text-[14px] text-[#636366]'>{[r.area, r.city].filter(Boolean).join(', ')}</p>}
          </div>
        )}

        <div className={cn('mt-5 grid md:mt-0 md:items-start', !wide && 'md:grid-cols-[calc(560*var(--u))_minmax(0,1fr)] md:gap-[calc(43*var(--u))]')}>
          {!wide && (
            <div className='hidden md:block' style={{ marginTop: t(45) }}>
              <RestaurantPanel r={r} distance={distance} />
            </div>
          )}
          <section
            aria-live='polite'
            className='flex min-w-0 flex-col bg-white md:shadow-[4px_4px_47px_rgba(0,0,0,0.1)] max-md:rounded-3xl! max-md:border max-md:border-[#efefef] max-md:p-5!'
            style={{ marginTop: t(45), borderRadius: t(40), padding: t(48), minHeight: t(549) }}
          >
            {children}
          </section>
        </div>
      </div>
    </div>
  )
}
