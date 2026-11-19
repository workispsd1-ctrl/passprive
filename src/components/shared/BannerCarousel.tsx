'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { WebsiteBanner } from '@/lib/types/websiteBanners'

type Props = {
  banners: WebsiteBanner[]
  /** Sizing/aspect-ratio classes for the carousel frame — callers control this per page. */
  className?: string
  /** How long each banner stays — app parity: HomeOffers IMAGE_STAY_MS (10s). */
  intervalMs?: number
  /** Absolutely fill the nearest positioned ancestor instead of sizing itself via `className` (e.g. layering behind a search bar). */
  fill?: boolean
  /** 'cover' (default) crops to fill the frame; 'contain' shows the whole image, letterboxed. */
  fit?: 'cover' | 'contain'
  /**
   * Room left at the top for a header lying over the banner (a CSS length).
   * The banner keeps its full size below it; the strip behind the header is a
   * soft, blurred continuation of the same banner, so its colours run up into
   * the header without cropping the artwork.
   */
  topInset?: string
}

/** app parity: HomeOffers AUTOPLAY_SLIDE_MS — the slide to the next banner. */
const SLIDE_MS = 900

function resolveHref(banner: WebsiteBanner): string | null {
  const urlParam = banner.action?.type === 'URL' ? banner.action.params?.url : null
  if (typeof urlParam === 'string' && urlParam) return urlParam
  if (banner.cta_link) return banner.cta_link
  return null
}

function Slide({ banner, fit, priority, topInset }: { banner: WebsiteBanner; fit: 'cover' | 'contain'; priority: boolean; topInset?: string }) {
  const href = resolveHref(banner)
  const objectFit = fit === 'contain' ? 'object-contain' : 'object-cover'
  const art =
    banner.type === 'video' ? (
      <video
        src={banner.media_url}
        poster={banner.thumbnail_url ?? undefined}
        className={`absolute inset-0 h-full w-full ${objectFit}`}
        autoPlay
        muted
        loop
        playsInline
      />
    ) : (
      <Image src={banner.media_url} alt={banner.title ?? 'Banner'} fill sizes='100vw' priority={priority} className={`${objectFit} object-center`} />
    )
  const still = banner.type === 'video' ? banner.thumbnail_url : banner.media_url
  const media = topInset ? (
    <>
      {still && (
        <Image src={still} alt='' aria-hidden fill sizes='100vw' className='scale-125 object-cover object-top blur-2xl' />
      )}
      {/* the banner at its own size under the header; its top edge fades into the blurred strip */}
      <span className='absolute inset-x-0 bottom-0 mask-[linear-gradient(to_bottom,transparent,black_12%)]' style={{ top: topInset }}>
        {art}
      </span>
    </>
  ) : art
  if (!href) return media
  return /^https?:\/\//.test(href) ? (
    <a href={href} target='_blank' rel='noreferrer' className='absolute inset-0'>{media}</a>
  ) : (
    <Link href={href} className='absolute inset-0'>{media}</Link>
  )
}

/**
 * Hero banners — app parity: components/Home/HomeOffers.jsx. Each banner stays
 * for `intervalMs`, then the row slides to the next over 900ms; after the last
 * it slides on to a copy of the first and jumps back unseen, so the loop always
 * moves forward. Paused while hovered; no slide for reduced-motion visitors.
 */
export function BannerCarousel({ banners, className = '', intervalMs = 10000, fill = false, fit = 'cover', topInset }: Props) {
  // position on the track: 0…n-1 are the banners, n is the copy of the first
  const [pos, setPos] = useState(0)
  const [animate, setAnimate] = useState(true)
  const [paused, setPaused] = useState(false)
  const jumpRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const count = banners.length

  // Back to the first slide whenever the banner set itself changes (the mobile
  // header swaps sets between routes) — adjusted during render, per React's docs.
  const [trackedBanners, setTrackedBanners] = useState(banners)
  if (banners !== trackedBanners) {
    setTrackedBanners(banners)
    setPos(0)
    setAnimate(false)
  }

  useEffect(() => {
    if (paused || count <= 1) return
    const timer = setTimeout(() => {
      setAnimate(true)
      setPos(p => p + 1)
    }, intervalMs)
    return () => clearTimeout(timer)
  }, [paused, count, intervalMs, pos])

  // reached the copy of the first banner: once the slide ends, jump to the real one
  useEffect(() => {
    if (pos !== count || count <= 1) return
    jumpRef.current = setTimeout(() => {
      setAnimate(false)
      setPos(0)
    }, SLIDE_MS)
    return () => {
      if (jumpRef.current) clearTimeout(jumpRef.current)
    }
  }, [pos, count])

  if (count === 0) return null

  const active = pos % count
  const slides = count > 1 ? [...banners, banners[0]] : banners

  function go(index: number) {
    setAnimate(true)
    setPos(index)
  }

  return (
    <div
      className={`${fill ? 'absolute inset-0' : 'relative w-full'} overflow-hidden rounded-2xl ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className={`absolute inset-0 flex ${animate ? 'transition-transform ease-in-out motion-reduce:transition-none' : ''}`}
        style={{ transform: `translateX(-${pos * 100}%)`, transitionDuration: animate ? `${SLIDE_MS}ms` : undefined }}
      >
        {slides.map((banner, i) => (
          <div key={`${banner.id}-${i}`} className='relative h-full w-full shrink-0 overflow-hidden' aria-hidden={i % count !== active || i === count}>
            <Slide banner={banner} fit={fit} priority={i === 0} topInset={topInset} />
          </div>
        ))}
      </div>

      {count > 1 && (
        <div className='pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5'>
          {banners.map((item, index) => (
            <button
              key={item.id}
              type='button'
              aria-label={`Show banner ${index + 1}`}
              onClick={() => go(index)}
              className={`pointer-events-auto h-1.5 rounded-full transition-all duration-500 ${index === active ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
