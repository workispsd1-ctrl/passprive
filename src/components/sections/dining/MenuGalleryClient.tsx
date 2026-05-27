'use client'

import { useState, useCallback, useEffect, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface MenuGalleryCtx {
  openAt: (index: number) => void
}
const MenuGalleryContext = createContext<MenuGalleryCtx | null>(null)

function useMenuGallery() {
  const ctx = useContext(MenuGalleryContext)
  if (!ctx) throw new Error('useMenuGallery must be used inside MenuGalleryProvider')
  return ctx
}

export function MenuGalleryProvider({
  images,
  children,
}: {
  images: string[]
  children: ReactNode
}) {
  const [current, setCurrent] = useState(-1)
  const isOpen = current >= 0

  const openAt = useCallback((i: number) => setCurrent(i), [])
  const close = useCallback(() => setCurrent(-1), [])
  const prev = useCallback(
    () => setCurrent(c => (c - 1 + images.length) % images.length),
    [images.length],
  )
  const next = useCallback(
    () => setCurrent(c => (c + 1) % images.length),
    [images.length],
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
    <MenuGalleryContext.Provider value={{ openAt }}>
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
              {current + 1} / {images.length}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close menu"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Main image */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden">
            <Image
              key={current}
              src={images[current]}
              alt={`Menu ${current + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous"
                  className="absolute left-3 md:left-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next"
                  className="absolute right-3 md:right-6 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/25 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail strip */}
          <div className="flex justify-center gap-2 overflow-x-auto px-4 py-3 shrink-0 scrollbar-hide">
            {images.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`View menu image ${i + 1}`}
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
    </MenuGalleryContext.Provider>
  )
}

export function MenuGalleryImageButton({
  src,
  alt,
  index,
  className,
  sizes,
  children,
}: {
  src: string | null
  alt: string
  index: number
  className?: string
  sizes?: string
  children?: ReactNode
}) {
  const { openAt } = useMenuGallery()
  return (
    <button
      type="button"
      onClick={() => { if (src && index >= 0) openAt(index) }}
      className={`block relative overflow-hidden bg-gray-200 ${className ?? ''}`}
    >
      {src && (
        <Image src={src} alt={alt} fill className="object-cover" sizes={sizes ?? '100vw'} />
      )}
      {children}
    </button>
  )
}

export function MenuImageCard({
  src,
  alt,
  index,
  label,
  sublabel,
}: {
  src: string | null
  alt: string
  index: number
  label: string
  sublabel: string
}) {
  const { openAt } = useMenuGallery()

  return (
    <div className="shrink-0 w-36">
      <button
        type="button"
        onClick={() => src && openAt(index)}
        className={`relative w-36 h-48 rounded-xl overflow-hidden bg-gray-900 block ${src ? 'cursor-pointer group' : 'cursor-default'}`}
        disabled={!src}
        aria-label={src ? `View ${alt}` : undefined}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
            sizes="144px"
          />
        ) : (
          <MenuPlaceholder />
        )}
      </button>
      <p className="text-[12px] font-semibold text-gray-800 mt-2">{label}</p>
      <p className="text-[11px] text-gray-400">{sublabel}</p>
    </div>
  )
}

function MenuPlaceholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-3">
      <div className="border border-white/30 rounded px-2.5 py-0.5">
        <p className="text-white text-[9px] tracking-[0.2em] font-semibold">MENU</p>
      </div>
      <div className="text-center space-y-1">
        {['STARTER', 'MAIN COURSE', 'DESSERT', 'DRINKS'].map(t => (
          <p key={t} className="text-white/40 text-[8px] tracking-wider">{t}</p>
        ))}
      </div>
    </div>
  )
}
