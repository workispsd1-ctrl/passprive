import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BannerCarousel } from '@/components/shared/BannerCarousel'
import type { WebsiteBanner } from '@/lib/types/websiteBanners'

/**
 * Wellness-page hero, shown under the top bar (mirrors HomeHero's full-bleed
 * treatment) — the category-nav pill sits below it, not overlapping.
 *
 * app parity: `wellnesshomebanners` (WellnessHome.jsx's `HomeOffers` with
 * `supabaseTable="wellnesshomebanners"`). Falls back to a "Time for a Glow
 * Up" gradient card when the CMS has no active banner.
 */
export function WellnessHero({ banners }: { banners: WebsiteBanner[] }) {
  if (banners.length > 0) {
    return (
      <BannerCarousel
        banners={banners}
        // CMS wellness banner art is a wide 7680×1584 (160/33) strip — matching
        // that ratio exactly means `cover` needs no crop and `contain` needs
        // no letterbox.
        className="aspect-160/33 min-h-35 rounded-none!"
      />
    )
  }

  return (
    <div className="relative flex min-h-70 items-center overflow-hidden bg-linear-to-br from-[#E0834A] via-[#B4657A] to-[#5A3E8B] px-6 py-10 md:min-h-90 md:px-16">
      <div className="max-w-lg">
        <h1 className="text-[32px] leading-[1.15] font-semibold text-white md:text-[44px]">
          Time for a{' '}
          <em className="font-(family-name:--font-playfair) font-bold italic text-[#F6D999]">
            Glow Up
          </em>
        </h1>
        <p className="mt-3 text-[16px] text-white/85 md:text-[18px]">
          Curated rituals, just for you
        </p>
        <Link
          href="#all-salons"
          className="mt-6 inline-flex h-12 items-center gap-2 rounded-full bg-[#2C55D4] px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          Learn more
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
