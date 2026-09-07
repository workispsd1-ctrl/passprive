'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { BannerCarousel } from '@/components/shared/BannerCarousel'
import type { WebsiteBanner } from '@/lib/types/websiteBanners'

/**
 * Home-page hero, shown under the top bar (inside the sticky <header>, which
 * paints the #FF4800 background). The category-nav pill overlaps its bottom edge.
 *
 * When the CMS has `home` banners we render those full-bleed. Until
 * `sql/website-banners.sql` is run `getWebsiteBanners('home')` returns [] and we
 * fall back to the stubbed orange hero below.
 *
 * TODO(design): the fallback's Privé Credits ticket + coin art and the CSS palm
 * silhouette are placeholders.
 */
export function HomeHero({ banners }: { banners: WebsiteBanner[] }) {
  const pathname = usePathname()
  if (pathname !== '/') return null

  if (banners.length > 0) {
    return (
      <BannerCarousel
        banners={banners}
        // spec: 1920 × 600 → 16/5; min height guards narrow screens
        className="aspect-16/5 min-h-55 rounded-none!"
      />
    )
  }

  return (
    <div className="relative overflow-hidden">
      {/* palm silhouette stub */}
      <svg
        aria-hidden="true"
        viewBox="0 0 200 300"
        className="pointer-events-none absolute -left-6 top-0 h-full w-auto opacity-[0.08]"
        fill="#000"
      >
        <path d="M96 300h8l-6-150h-4z" />
        <path d="M100 150C60 120 20 130 4 150c30-6 56 0 74 18-8-30-30-52-60-60 34-2 62 10 82 34-2-34-20-64-50-84 34 8 58 32 70 66 8-32 2-66-18-96 30 20 46 54 42 90 20-16 32-42 32-72 10 30 4 64-16 88 26-4 48-22 60-48-4 34-28 62-62 74z" />
      </svg>

      <div className="relative mx-auto flex max-w-350 flex-col gap-8 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-12 md:py-12 2xl:py-16">
        <div className="max-w-xl">
          <h1 className="text-[32px] font-semibold leading-[1.15] text-white md:text-[44px] 2xl:text-[56px]">
            Where{' '}
            <em className="font-(family-name:--font-playfair) font-bold italic">
              Mauritius
            </em>{' '}
            goes next.
          </h1>
          <Link
            href="/dining"
            className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#2C55D4] px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
          >
            Book Now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Privé Credits ticket — stub */}
        <div className="hidden w-95 shrink-0 lg:block">
          <div className="relative rounded-2xl bg-linear-to-br from-[#D98A4E] to-[#B4652F] p-6 text-white shadow-lg ring-1 ring-white/15">
            <p className="text-[13px] tracking-wide text-white/80">Introducing</p>
            <p className="font-(family-name:--font-playfair) text-[34px] font-bold italic leading-tight">
              Privé Credits
            </p>
            <span className="mt-3 inline-block rounded-md bg-[#2C55D4] px-2 py-1 text-[11px] font-semibold">
              Get 8x cashback of up to 4% with every bill payment
            </span>
            <p className="mt-4 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-[#B4652F]">
              Learn more <ArrowRight className="h-3.5 w-3.5" />
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
