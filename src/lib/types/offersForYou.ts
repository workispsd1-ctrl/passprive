/**
 * A row of `offers_for_you_cards` — mirrors the app's `OffersForYou.jsx`
 * fetch (`components/Home/OffersForYou.jsx`). Each card is just an image; the
 * `type`/target columns decide what a tap does.
 */
export type OfferForYouCard = {
  id: string | number;
  image_url: string;
  /** 'link' → open link_url; 'screen' → navigate; anything else → detail sheet */
  type: 'link' | 'screen' | null;
  link_url: string | null;
  target_kind: 'restaurant' | 'store' | null;
  target_id: string | null;
  target_route: string | null;
  /** detail-sheet content (not rendered on web yet) */
  hero_url: string | null;
  detail_title: string | null;
  detail_body: string | null;
  sort_order: number | null;
  enabled: boolean;
};
