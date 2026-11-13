import type { ServiceOffer } from '@/lib/types/stores'

/** An offer card's headline, terms line and (bank offers) logo — usable on the server and the client. */
export type OfferBodyText = { main: string; sub: string; logo?: string | null }

/** app parity: ServiceStoreDetails.jsx `exclusiveOfferItems` */
export function exclusiveBody(o: ServiceOffer): OfferBodyText {
  const main = o.discount_value
    ? o.discount_type === 'PERCENT'
      ? `Flat ${o.discount_value}% OFF`
      : `Flat MUR ${o.discount_value} OFF`
    : o.title
  return { main, sub: o.description || o.title || '' }
}

/** app parity: OffersForYouSection.jsx `bankOfferBody` */
export function bankBody(o: ServiceOffer): OfferBodyText {
  const bank = o.sponsor_name?.trim() || 'Bank'
  return { main: o.title, sub: o.description || `using ${bank} cards`, logo: o.logo_url }
}
