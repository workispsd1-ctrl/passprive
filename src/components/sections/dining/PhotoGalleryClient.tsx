'use client'

import { useState, useCallback, useEffect, createContext, useContext, useRef } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { X, ChevronLeft, ChevronRight, Grid2x2, Navigation } from 'lucide-react'

// ── Shared gallery context so grid + strip share one dialog ──────────────────
interface GalleryCtx {
  openAt: (index: number) => void
}
const GalleryContext = createContext<GalleryCtx | null>(null)

function useGallery() {
  const ctx = useContext(GalleryContext)
  if (!ctx) throw new Error('useGallery must be used inside PhotoGalleryProvider')
  return ctx
}

// ── Provider + Dialog ─────────────────────────────────────────────────────────
export function PhotoGalleryProvider({
  photos,
  children,
}: {
  photos: string[]
  children: ReactNode
}) {
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

          {/* Main photo */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <Image
              key={current}
              src={photos[current]}
              alt=""
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />

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
              {photos.map((url, i) => (
                <button
                  key={url}
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


export function PhotoGrid({
  photos,
  restaurantName,
  backHref = '/dining',
}: {
  photos: string[]
  restaurantName: string
  backHref?: string
}) {
  const { openAt } = useGallery()

  return (
    <>
      {/* Desktop 1 large + 2×2 grid */}
      <div className="hidden md:grid grid-cols-[3fr_1fr_1fr] grid-rows-2 gap-1.5 h-105 px-6 pt-4">
        <button
          type="button"
          onClick={() => openAt(0)}
          className="row-span-2 rounded-l-2xl overflow-hidden bg-gray-200 relative focus-visible:outline-none group"
        >
          {photos[0] ? (
            <Image
              src={photos[0]}
              alt={restaurantName}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
              priority
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-brand/30 to-pink-200" />
          )}
        </button>

        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            className={`relative overflow-hidden bg-gray-100 ${
              i === 1 ? 'rounded-tr-2xl' : i === 4 ? 'rounded-br-2xl' : ''
            }`}
          >
            {photos[i] ? (
              <button
                type="button"
                onClick={() => openAt(i)}
                aria-label={`View photo ${i + 1}`}
                className="absolute inset-0 w-full h-full group focus-visible:outline-none"
              >
                <Image
                  src={photos[i]}
                  alt=""
                  fill
                  className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  sizes="200px"
                />
              </button>
            ) : (
              <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-200" />
            )}

            {i === 4 && (
              <button
                type="button"
                onClick={() => openAt(4)}
                className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-[12px] font-semibold text-gray-800 shadow backdrop-blur-sm transition-colors"
              >
                <Grid2x2 className="w-3.5 h-3.5" />
                {photos.length > 5
                  ? `+${photos.length - 5} photos`
                  : 'Show all photos'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Mobile cover */}
      <div className="md:hidden relative w-full aspect-video bg-gray-200">
        {photos[0] ? (
          <Image
            src={photos[0]}
            alt={restaurantName}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-linear-to-br from-brand/30 to-pink-200" />
        )}
        <Link
          href={backHref}
          className="absolute top-4 left-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/90 shadow"
          aria-label="Back"
        >
          <Navigation className="w-4 h-4 text-gray-800 rotate-225" />
        </Link>
        {photos.length > 1 && (
          <button
            type="button"
            onClick={() => openAt(0)}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 text-[12px] font-semibold text-white backdrop-blur-sm"
          >
            <Grid2x2 className="w-3.5 h-3.5" />
            {photos.length} photos
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

  return (
    <section className='mt-8 border-t border-gray-100 pt-6 overflow-hidden'>
      {/* Header */}
      <div className='flex items-center justify-between mb-4'>
        <h2 className='text-[20px] font-bold text-gray-900'>Photos</h2>

        <div className='flex items-center gap-3'>
          {/* Left Arrow */}
          <button
            type='button'
            onClick={() => scroll('left')}
            aria-label='Scroll left'
            className='hidden md:flex w-10 h-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition'
          >
            <ChevronLeft className='w-5 h-5 text-gray-700' />
          </button>

          {/* Right Arrow */}
          <button
            type='button'
            onClick={() => scroll('right')}
            aria-label='Scroll right'
            className='hidden md:flex w-10 h-10 items-center justify-center rounded-full border border-gray-200 bg-white shadow-sm hover:bg-gray-50 transition'
          >
            <ChevronRight className='w-5 h-5 text-gray-700' />
          </button>

          {/* See All */}
          <button
            type='button'
            onClick={() => openAt(0)}
            className='text-[13px] font-semibold text-brand hover:underline'
          >
            See all {photos.length}
          </button>
        </div>
      </div>

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
              className='relative shrink-0 w-36 h-28 md:w-56 lg:w-60 md:h-40 rounded-2xl overflow-hidden bg-gray-100 focus-visible:outline-none group'
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
    </section>
  );
}
