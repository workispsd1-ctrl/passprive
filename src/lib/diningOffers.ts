import type { OfferBody } from '@/components/shared/detail/OffersForToday'
import type { DiningOffer } from '@/lib/types/dining'

/** app parity: RestaurantDetails.jsx restaurantOfferBody — "Flat 40% OFF" over its condition. */
export function exclusiveOffer(o: DiningOffer): OfferBody {
  const v = Number(o.discount_value);
  const pct = String(o.offer_type ?? '').toLowerCase().startsWith('percent');
  const main = Number.isFinite(v) && v > 0 ? (pct ? `Flat ${v}% OFF` : `Flat MUR ${v.toLocaleString('en-US')} OFF`) : o.badge_text || o.title;
  const sub = o.min_spend != null
    ? `on bills above MUR ${Number(o.min_spend).toLocaleString('en-US')}`
    : o.description || (main === o.title ? null : o.title);
  return { id: o.id, main, sub };
}

/** app parity: bankOfferBody */
export function bankOffer(o: DiningOffer): OfferBody {
  return { id: o.id, main: o.title, sub: o.description || 'using eligible bank cards' };
}

/** A restaurant's offers split into the "Offers for today" cards — exclusive and bank / card. */
export function splitDiningOffers(offers: DiningOffer[]) {
  const isBank = (o: DiningOffer) => o.offer_type === 'bank_card' || o.offer_type === 'credit_card'
  return {
    exclusive: offers.filter(o => !isBank(o)).map(exclusiveOffer),
    bank: offers.filter(isBank).map(bankOffer),
  }
}
