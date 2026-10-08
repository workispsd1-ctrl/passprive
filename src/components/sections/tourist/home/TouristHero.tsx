import Image from 'next/image'
import { BannerCarousel } from '@/components/shared/BannerCarousel'
import type { WebsiteBanner } from '@/lib/types/websiteBanners'

/**
 * Tourist-page hero, shown full-bleed under the top bar like the Home and
 * Wellness heroes (rendered from HeaderHeroNav): the `websitetouristbanners`
 * CMS banners when any are live, otherwise a static "Explore with trust" panel.
 */
export function TouristHero({ banners }: { banners: WebsiteBanner[] }) {
  if (banners.length > 0) {
    return (
      <BannerCarousel
        banners={banners}
        // CMS tourist banner art is 7680×1584 (160/33), same as wellness —
        // matching the ratio means no crop and no letterbox.
        className="aspect-160/33 min-h-35 rounded-none!"
      />
    )
  }

  return (
    <section
      aria-labelledby="tourist-hero-heading"
      className="flex min-h-56 items-center justify-center bg-[#D6EFFB] px-4 md:min-h-80"
    >
      <h1
        id="tourist-hero-heading"
        className="text-center text-[40px] leading-none tracking-tight md:text-[64px]"
      >
        <span className="font-(family-name:--font-dm-sans) font-medium text-[#E4703C]">Explore </span>
        <em className="font-(family-name:--font-libre-baskerville) font-bold italic text-[#2946E8]">with trust</em>
      </h1>
    </section>
  )
}

type WideArt = { src: string; width: number; height: number }

/**
 * Static promo artwork (Hire Taxis / Explore Area / the house ad). Phones get
 * the app's 1432×500 art (`src`); from `md` up, the full-width desktop strip
 * (`desktop`) when there is one. Pass `mobile={false}` for desktop-only art
 * whose text would be unreadably small on a phone.
 */
export function TouristImageBanner({
  src,
  alt,
  desktop,
  mobile = true,
}: {
  src?: string
  alt: string
  desktop?: WideArt
  mobile?: boolean
}) {
  const showMobile = mobile && !!src
  if (!showMobile && !desktop) return null

  return (
    <div className={showMobile ? 'py-4' : 'hidden py-4 md:block'}>
      {showMobile && src && (
        // Capped so it reads as a promo strip rather than a second hero.
        <div className={desktop ? 'mx-auto max-w-3xl px-4 md:hidden' : 'mx-auto max-w-3xl px-4 md:px-8'}>
          <Image
            src={src}
            alt={alt}
            width={1432}
            height={500}
            sizes="(max-width: 768px) 100vw, 768px"
            className="h-auto w-full rounded-2xl"
          />
        </div>
      )}
      {desktop && (
        <div className="mx-auto hidden max-w-7xl px-8 md:block 2xl:max-w-394">
          <Image
            src={desktop.src}
            alt={alt}
            width={desktop.width}
            height={desktop.height}
            sizes="(max-width: 1600px) 100vw, 1576px"
            className="h-auto w-full rounded-2xl"
          />
        </div>
      )}
    </div>
  )
}
