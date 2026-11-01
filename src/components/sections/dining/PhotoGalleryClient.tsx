'use client'

import { useState, useCallback, useEffect, createContext, useContext, useRef } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { X, ChevronLeft, ChevronRight, Grid2x2, Heart, Share2, Check, Image as ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { shareLink, useSaveMerchant } from '@/components/shared/detail/MerchantActions'
import type { SavedEntityType } from '@/lib/services/savedEntities'
import { DetailSection } from '@/components/shared/detail/DetailSection'


interface GalleryCtx {
  openAt: (index: number) => void
}
const GalleryContext = createContext<GalleryCtx | null>(null)

export function useGallery() {
  const ctx = useContext(GalleryContext)
  if (!ctx) throw new Error('useGallery must be used inside PhotoGalleryProvider')
  return ctx
}


export function PhotoGalleryProvider({
  photos: rawPhotos,
  children,
}: {
  photos: string[]
  children: ReactNode
}) {
  const photos = rawPhotos.filter(Boolean)
  const [current, setCurrent] = useState(-1)
  const isOpen = current >= 0

  const openAt = useCallback((i: number) => setCurrent(i), [])
  const close = useCallback(() => setCurrent(-1), [])
  const prev = useCallback(
    () => setCurrent(c => (c - 1 + photos.length) % photos.length),
    [photos.length],
  )
  const next = useCallback(
    () => setCurrent(c => (c + 1) % photos.length),
    [photos.length],
  )

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKey)
    }
  }, [isOpen, prev, next, close])

  return (
    <GalleryContext.Provider value={{ openAt }}>
      {children}

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
          aria-modal="true"
          role="dialog"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 shrink-0">
            <span className="text-white/60 text-[13px] font-medium tabular-nums">
              {current + 1} / {photos.length}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close gallery"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            {photos[current] && (
              <Image
                key={current}
                src={photos[current]}
                alt=""
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            )}

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous photo"
                  className="absolute left-3 md:left-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next photo"
                  className="absolute right-3 md:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          <div className="flex justify-center gap-2 overflow-x-auto px-4 py-3 shrink-0 scrollbar-hide">
              {photos.map((url, i) => url && (
                <button
                  key={`${url}-${i}`}
                  type="button"
                  onClick={() => setCurrent(i)}
                  aria-label={`View photo ${i + 1}`}
                  className={`relative shrink-0 w-14 h-14 rounded-lg overflow-hidden transition-all duration-150 ${
                    i === current
                      ? 'ring-2 ring-white opacity-100'
                      : 'opacity-40 hover:opacity-70'
                  }`}
                >
                  <Image src={url} alt="" fill className="object-cover" sizes="56px" />
                </button>
              ))}
          </div>
        </div>
      )}
    </GalleryContext.Provider>
  )
}


const HERO_BTN =
  'flex h-10 w-10 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/50'

/**
 * Back / save / share over the mobile hero — app parity: the detail screens'
 * "BACK & ICON BUTTONS". Back returns to the previous page when there is one.
 */
function HeroNav({ backHref, name, save }: { backHref: string; name: string; save?: { id: string; type: SavedEntityType } }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const saver = useSaveMerchant(save?.id ?? '', save?.type ?? 'RESTAURANT')

  function back() {
    // same-site history → go back; a shared link opened cold → the listing
    if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) router.back()
    else router.push(backHref)
  }

  return (
    <>
      <button type="button" onClick={back} aria-label="Back" className={cn(HERO_BTN, 'absolute top-4 left-4 z-10')}>
        <ChevronLeft className="h-6 w-6" />
      </button>
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        {save && (
          <button type="button" onClick={saver.onSave} aria-label={saver.saved ? 'Edit saved lists' : 'Save'} aria-pressed={saver.saved} className={HERO_BTN}>
            <Heart className={cn('h-5 w-5', saver.saved && 'fill-brand text-brand')} />
          </button>
        )}
        <button
          type="button"
          onClick={async () => {
            if (await shareLink(name)) { setCopied(true); setTimeout(() => setCopied(false), 2000) }
          }}
          aria-label={copied ? 'Link copied' : 'Share'}
          className={HERO_BTN}
        >
          {copied ? <Check className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
        </button>
      </div>
      {save && saver.sheet(name)}
    </>
  )
}

/** Tile layouts per photo count: [grid template, class per tile]. */
const LAYOUTS: Record<number, { grid: string; tiles: string[] }> = {
  1: { grid: 'grid-cols-1', tiles: [''] },
  2: { grid: 'grid-cols-[1.6fr_1fr]', tiles: ['', ''] },
  3: { grid: 'grid-cols-[2fr_1fr] grid-rows-2', tiles: ['row-span-2', '', ''] },
  4: { grid: 'grid-cols-[2fr_1fr_1fr] grid-rows-2', tiles: ['row-span-2', 'col-span-2', '', ''] },
  5: { grid: 'grid-cols-[2fr_1fr_1fr] grid-rows-2', tiles: ['row-span-2', '', '', '', ''] },
}

function DesktopGallery({ photos, name, onOpen }: { photos: string[]; name: string; onOpen: (i: number) => void }) {
  if (!photos.length) {
    return (
      <div className="mx-6 mt-4 hidden h-60 items-end rounded-3xl bg-linear-to-br from-[#FFE3D6] via-[#FFF1EB] to-[#F6E7FF] p-8 md:flex">
        <p className="text-[32px] font-bold tracking-[-0.6px] text-[#141414]/80">{name}</p>
      </div>
    )
  }
  const shown = photos.slice(0, 5)
  const layout = LAYOUTS[shown.length]
  return (
    <div className="relative mx-6 mt-4 hidden md:block">
    <div className={`grid h-[26rem] gap-2 overflow-hidden rounded-3xl ${layout.grid}`}>
      {shown.map((src, i) => (
        <button
          key={src + i}
          type="button"
          onClick={() => onOpen(i)}
          aria-label={i === 0 ? `View photos of ${name}` : `View photo ${i + 1}`}
          className={`group relative overflow-hidden bg-gray-100 before:absolute before:inset-0 before:animate-pulse before:bg-gray-200 focus-visible:outline-none ${layout.tiles[i]}`}
        >
          <Image
            src={src}
            alt={i === 0 ? name : ''}
            fill
            priority={i === 0}
            sizes={i === 0 ? '60vw' : '25vw'}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
          <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
        </button>
      ))}
    </div>
      {photos.length > 1 && (
        <button
          type="button"
          onClick={() => onOpen(0)}
          className="absolute right-4 bottom-4 flex items-center gap-1.5 rounded-full bg-white/95 px-4 py-2 text-[13px] font-semibold text-gray-900 shadow-[0_4px_14px_rgba(0,0,0,0.15)] backdrop-blur transition-colors hover:bg-white"
        >
          <Grid2x2 className="size-3.5" /> Show all {photos.length} photos
        </button>
      )}
    </div>
  )
}

export function PhotoGrid({
  photos,
  restaurantName,
  backHref = '/dining',
  save,
  cover,
  desktop = true,
}: {
  photos: string[]
  restaurantName: string
  backHref?: string
  /** shows the hero heart — the merchant to save */
  save?: { id: string; type: SavedEntityType }
  /** phones show the cover image as the hero, like the app (falls back to the first photo) */
  cover?: string | null
  /** false when the page draws its own desktop hero (restaurant detail) */
  desktop?: boolean
}) {
  const { openAt } = useGallery()
  const hero = cover || photos[0]

  return (
    <>
      {/* Desktop — the layout follows the photo count, so there are never empty tiles */}
      {desktop && <DesktopGallery photos={photos} name={restaurantName} onOpen={openAt} />}

      {/* Mobile hero — app parity: RestaurantDetails HEADER GALLERY: the cover
          image (~38% of the screen), back / heart / share over it, and
          "View Gallery" sitting just above the overlapping title card. */}
      <div className="relative h-[38svh] min-h-64 w-full bg-gray-200 md:hidden">
        {hero ? (
          <button type="button" onClick={() => openAt(0)} aria-label={`View photos of ${restaurantName}`} className="absolute inset-0">
            <Image src={hero} alt={restaurantName} fill sizes="100vw" className="object-cover" priority />
          </button>
        ) : (
          <div className="h-full w-full bg-linear-to-br from-brand/30 to-pink-200" />
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-linear-to-b from-black/40 to-transparent" />
        <HeroNav backHref={backHref} name={restaurantName} save={save} />
        {photos.length > 0 && (
          <button
            type="button"
            onClick={() => openAt(0)}
            className="absolute right-3.5 bottom-20.75 z-1 flex h-8.5 items-center gap-2 rounded-full bg-black/35 pr-3.25 pl-3.5 text-[14px] leading-5 font-medium text-white"
          >
            <ImageIcon className="size-4" />
            View Gallery
          </button>
        )}
      </div>
    </>
  )
}


export function PhotoStrip({ photos }: { photos: string[] }) {
  const { openAt } = useGallery();
  const scrollRef = useRef<HTMLDivElement>(null);

  if (photos.length <= 1) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollRef.current) return;

    const scrollAmount = 500;

    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const arrow = 'hidden size-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50 md:flex'

  return (
    <DetailSection
      id='gallery'
      title='Photos'
      subtitle={`${photos.length} photos`}
      action={
        <div className='flex items-center gap-2'>
          <button type='button' onClick={() => scroll('left')} aria-label='Scroll photos left' className={arrow}>
            <ChevronLeft className='size-4.5' />
          </button>
          <button type='button' onClick={() => scroll('right')} aria-label='Scroll photos right' className={arrow}>
            <ChevronRight className='size-4.5' />
          </button>
          <button type='button' onClick={() => openAt(0)} className='ml-1 text-[13px] font-semibold text-brand hover:underline'>
            See all
          </button>
        </div>
      }
    >
      {/* Carousel Wrapper */}
      <div className='relative w-full overflow-hidden'>
        <div
          ref={scrollRef}
          className='flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-1 min-w-0 w-full'
        >
          {photos.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type='button'
              onClick={() => openAt(i)}
              aria-label={`View photo ${i + 1}`}
              className='group relative h-32 w-44 shrink-0 overflow-hidden rounded-2xl bg-gray-100 focus-visible:outline-none md:h-44 md:w-60'
            >
              <Image
                src={url}
                alt={`Photo ${i + 1}`}
                fill
                className='object-cover group-hover:scale-105 transition-transform duration-300'
                sizes='(max-width: 768px) 144px, (max-width: 1024px) 224px, 240px'
              />
            </button>
          ))}
        </div>
      </div>
    </DetailSection>
  );
}
