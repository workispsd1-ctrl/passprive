import { CreditCard, Tag } from 'lucide-react'
import { DetailSection } from './DetailSection'

export type OfferTicket = {
  id: string
  /** the saving, big — "20% OFF", "MUR 100 OFF" */
  headline: string
  title?: string | null
  /** "Min spend MUR 1,000", a code, … */
  footnote?: string | null
}

export type BankOffer = { id: string; title: string }

/**
 * Offers — app parity: FigmaOffersForYou. Each offer is a ticket: the saving
 * on the orange stub, the detail on the cream body, notches between.
 */
export function DetailOffers({
  tickets,
  bankOffers = [],
  subtitle,
}: {
  tickets: OfferTicket[]
  bankOffers?: BankOffer[]
  subtitle?: string
}) {
  if (!tickets.length && !bankOffers.length) return null

  return (
    <DetailSection id='offers' title='Offers' subtitle={subtitle}>
      {tickets.length > 0 && (
        <div className='scrollbar-hide -mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0'>
          {tickets.map(t => (
            <article
              key={t.id}
              className='relative flex min-h-28 w-[min(20rem,82vw)] shrink-0 snap-start overflow-hidden rounded-2xl shadow-[0_6px_18px_rgba(255,72,0,0.12)] md:w-auto'
            >
              <div className='flex w-30 shrink-0 flex-col justify-center bg-linear-to-br from-[#FF6A30] to-[#FF4800] px-4 py-3 text-white'>
                <Tag className='mb-1.5 size-4 opacity-80' />
                <p className='text-[19px] leading-tight font-black tracking-[-0.3px] break-words'>{t.headline}</p>
              </div>
              <div className='flex min-w-0 flex-1 flex-col justify-center border-y border-r border-[#FFE3D6] bg-[#FFF8F4] py-3 pr-4 pl-5'>
                {t.title && <p className='line-clamp-2 text-[14px] leading-5 font-semibold text-gray-900'>{t.title}</p>}
                {t.footnote && <p className='mt-1 text-[12px] text-gray-500'>{t.footnote}</p>}
              </div>
              {/* ticket notches */}
              <span className='absolute top-0 left-30 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white' />
              <span className='absolute bottom-0 left-30 size-4 -translate-x-1/2 translate-y-1/2 rounded-full bg-white' />
            </article>
          ))}
        </div>
      )}

      {bankOffers.length > 0 && (
        <div className={tickets.length ? 'mt-6' : ''}>
          <p className='mb-3 text-[13px] font-semibold text-gray-500'>Bank &amp; card offers</p>
          <div className='scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0'>
            {bankOffers.map(o => (
              <div key={o.id} className='flex w-60 shrink-0 items-start gap-3 rounded-2xl border border-gray-100 bg-white p-3.5'>
                <span className='flex size-9 shrink-0 items-center justify-center rounded-xl bg-gray-50'>
                  <CreditCard className='size-4 text-gray-500' />
                </span>
                <p className='line-clamp-3 text-[12.5px] leading-snug font-medium text-gray-700'>{o.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </DetailSection>
  )
}
