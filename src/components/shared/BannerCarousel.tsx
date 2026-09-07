'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { WebsiteBanner } from '@/lib/types/websiteBanners'

type Props = {
  banners: WebsiteBanner[]
  /** Sizing/aspect-ratio classes for the carousel frame — callers control this per page. */
  className?: string
  intervalMs?: number
  /** Absolutely fill the nearest positioned ancestor instead of sizing itself via `className` (e.g. layering behind a search bar). */
  fill?: boolean
}

function resolveHref(banner: WebsiteBanner): string | null {
  const urlParam = banner.action?.type === 'URL' ? banner.action.params?.url : null
  if (typeof urlParam === 'string' && urlParam) return urlParam
  if (banner.cta_link) return banner.cta_link
  return null
}

export function BannerCarousel({ banners, className = '', intervalMs = 5000, fill = false }: Props) {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Reset to the first slide whenever the banner set itself changes (not on every
  // render) — adjusting state during render, per React's docs, instead of an effect.
  const [trackedBanners, setTrackedBanners] = useState(banners)
  if (banners !== trackedBanners) {
    setTrackedBanners(banners)
    setActive(0)
  }

  useEffect(() => {
    if (paused || banners.length <= 1) return
    timerRef.current = setInterval(() => {
      setActive((current) => (current + 1) % banners.length)
    }, intervalMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [paused, banners.length, intervalMs])

  if (banners.length === 0) return null

  const banner = banners[active]
  const href = resolveHref(banner)
  const isExternal = href ? /^https?:\/\//.test(href) : false

  const media =
    banner.type === 'video' ? (
      <video
        key={banner.id}
        src={banner.media_url}
        poster={banner.thumbnail_url ?? undefined}
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
      />
    ) : (
      <Image
        key={banner.id}
        src={banner.media_url}
        alt={banner.title ?? 'Banner'}
        fill
        sizes="100vw"
        priority={active === 0}
        className="object-cover object-center"
      />
    )

  return (
    <div
      className={`${fill ? 'absolute inset-0' : 'relative w-full'} overflow-hidden rounded-2xl bg-slate-100 ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {href ? (
        isExternal ? (
          <a href={href} target="_blank" rel="noreferrer" className="absolute inset-0">
            {media}
          </a>
        ) : (
          <Link href={href} className="absolute inset-0">
            {media}
          </Link>
        )
      ) : (
        media
      )}

      {banners.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1.5">
          {banners.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Show banner ${index + 1}`}
              onClick={() => setActive(index)}
              className={`pointer-events-auto h-1.5 rounded-full transition-all ${
                index === active ? 'w-6 bg-white' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
