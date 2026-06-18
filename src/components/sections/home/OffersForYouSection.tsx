'use client'

import { useRef, useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const OFFERS = [
  {
    id: '1',
    logo: 'HSBC',
    title: 'Unlock exclusive benefits with HSBC Debit/Credit Cards',
    gradient: 'from-[#0c1d3e] to-[#1a3a6e]',
  },
  {
    id: '2',
    logo: 'HDFC',
    title: 'Unlock exclusive benefits with HDFC Bank Cards',
    gradient: 'from-[#1a0a2e] to-[#3d1a6b]',
  },
  {
    id: '3',
    logo: 'ICICI',
    title: 'Unlock exclusive benefits with ICICI Bank Cards',
    gradient: 'from-[#0a1f2e] to-[#0e4c6e]',
  },
]

const SCROLL_BY = 300

export function OffersForYouSection() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  function updateArrows() {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateArrows()
    el.addEventListener('scroll', updateArrows, { passive: true })
    return () => el.removeEventListener('scroll', updateArrows)
  }, [])

  function scrollLeft() {
    scrollRef.current?.scrollBy({ left: -SCROLL_BY, behavior: 'smooth' })
  }

  function scrollRight() {
    scrollRef.current?.scrollBy({ left: SCROLL_BY, behavior: 'smooth' })
  }

  return (
    <section className="bg-white py-5 md:py-8">
      <div className="flex items-center justify-between px-4 md:px-6 mb-4">
        <h2 className="text-[17px] md:text-[19px] font-bold text-gray-900">Offers for you</h2>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={scrollLeft}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={scrollRight}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4 md:px-6 pb-2"
      >
        {OFFERS.map(offer => (
          <div
            key={offer.id}
            className={`shrink-0 w-[72vw] max-w-[280px] rounded-2xl bg-linear-to-r ${offer.gradient} p-4 flex items-center gap-4 cursor-pointer`}
          >
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-extrabold tracking-wider">{offer.logo}</span>
            </div>
            <p className="text-white text-[12px] font-semibold leading-snug flex-1">
              {offer.title}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
