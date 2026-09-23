import Image from 'next/image';
import { BannerCarousel } from '@/components/shared/BannerCarousel';
import { getWebsiteBanners } from '@/lib/services/websiteBanners';

// TODO(design): stub coin placements + gradient banner — swap for the real
// food-spread photo + scattered coin illustration once that asset exists.
// Only shown when there's no real `dining` website banner.
const COINS = [
  { top: '8%', left: '4%', size: 56, opacity: 0.9, rotate: -12 },
  { top: '4%', left: '33%', size: 44, opacity: 0.85, rotate: 8 },
  { top: '2%', right: '30%', size: 48, opacity: 0.9, rotate: -6 },
  { top: '10%', right: '4%', size: 60, opacity: 0.85, rotate: 14 },
  { bottom: '10%', left: '10%', size: 50, opacity: 0.8, rotate: 10 },
  { bottom: '6%', right: '12%', size: 66, opacity: 0.9, rotate: -10 },
] as const;

export async function HeroSection() {
  const banners = await getWebsiteBanners('dining');

  return (
    <section
      aria-labelledby='hero-heading'
      className='bg-white px-4 pt-10 pb-6 text-center md:px-6 md:pt-16 md:pb-10'
    >
      <h1
        id='hero-heading'
        className='mx-auto max-w-3xl text-[26px] leading-none tracking-normal text-[#424242] md:text-[42px] 2xl:text-[60px]'
      >
        <span className='font-(family-name:--font-dm-sans) font-bold'>
          Discover Mauritius&apos;{' '}
        </span>
        <em className='font-(family-name:--font-libre-baskerville) italic font-bold text-[#FF6A19]'>
          Best Dining
        </em>
        <br className='hidden md:block' />
        <span className='font-(family-name:--font-dm-sans) font-normal'> with </span>
        <em className='font-(family-name:--font-libre-baskerville) italic font-bold text-[#FF6A19]'>
          Exclusive Cashback
        </em>
      </h1>

      <div className='relative mx-auto mt-8 w-full max-w-6xl overflow-hidden rounded-[28px] min-h-[320px] md:min-h-[420px] flex items-center justify-center 2xl:max-w-394 2xl:min-h-129 2xl:rounded-[40px]'>
        {banners.length > 0 ? (
          <BannerCarousel banners={banners} fill />
        ) : (
          <>
            <div className='absolute inset-0 bg-linear-to-br from-[#4B2E7A] via-[#8B4A6B] to-[#E0834A]' />
            {COINS.map((c, i) => (
              <Image
                key={i}
                src='/membership/Wallet.webp'
                alt=''
                width={129}
                height={129}
                aria-hidden='true'
                className='pointer-events-none absolute drop-shadow-lg'
                style={{
                  top: 'top' in c ? c.top : undefined,
                  bottom: 'bottom' in c ? c.bottom : undefined,
                  left: 'left' in c ? c.left : undefined,
                  right: 'right' in c ? c.right : undefined,
                  width: c.size,
                  height: c.size,
                  opacity: c.opacity,
                  transform: `rotate(${c.rotate}deg)`,
                }}
              />
            ))}
          </>
        )}

        <div className='relative z-10 w-full max-w-2xl px-4 2xl:max-w-49'>
          {banners.length === 0 && (
            <p className='mb-6 text-[22px] leading-none tracking-normal md:text-[34px] 2xl:text-[40px]'>
              <em className='font-(family-name:--font-libre-baskerville) italic font-bold text-[#FF6B1C]'>
                Dine More,
              </em>{' '}
              <em className='font-(family-name:--font-libre-baskerville) italic font-bold text-[#0E295E]'>
                Experience More!
              </em>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
