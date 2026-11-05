import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getOrderCollect, getRestaurantBySlugOrId } from '@/lib/services/dining';
import {
  PhotoGalleryProvider,
  PhotoGrid,
  PhotoStrip,
} from '@/components/sections/dining/PhotoGalleryClient';
import { RestaurantMenuSection } from '@/components/sections/dining/RestaurantMenuSection';
import { MerchantRewardsSection } from '@/components/shared/MerchantRewardsSection';
import { DetailSectionTabs, type DetailTab } from '@/components/shared/detail/DetailSectionTabs';
import { CtaMobileBar, type CtaAction } from '@/components/shared/detail/DetailCtaBar';
import { OffersForToday, type OfferBody } from '@/components/shared/detail/OffersForToday';
import { RestaurantCtaCard, RestaurantDesktopHero, RestaurantTitleCard } from '@/components/sections/dining/RestaurantDesktopHero';
import { RestaurantDesktopSections } from '@/components/sections/dining/RestaurantDesktopSections';
import { HelpSideCard, SavingsReceipt, StampSideCard } from '@/components/sections/dining/RestaurantSidebar';
import { getRestaurantStampCard } from '@/lib/services/visitRewards';
import { billOffers, type RestaurantOfferRow } from '@/lib/payBill';
import { DetailReviews } from '@/components/shared/detail/DetailReviews';
import { DetailAbout, type Fact } from '@/components/shared/detail/DetailAbout';
import { DetailLocation } from '@/components/shared/detail/DetailLocation';
import { HelpCard } from '@/components/shared/detail/HelpCard';
import { MobileTitleCard } from '@/components/shared/detail/MobileTitleCard';
import { UpsellBannerPager } from '@/components/shared/detail/UpsellBannerPager';
import { getDiscountCaps } from '@/lib/services/membershipCaps';
import { canPayBill } from '@/lib/cashback';
import { OrderCollectBanner } from '@/components/sections/dining/order/OrderCollectBanner';
import { cn } from '@/lib/utils';
import { DESIGN_UNIT, TYPE_SCALE, tMin, t } from '@/components/sections/dining/designUnit';
import type { DiningOffer } from '@/lib/types/dining';

const fetchRestaurant = cache((id: string) => getRestaurantBySlugOrId(id));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { restaurant, tags } = await fetchRestaurant(id);
  if (!restaurant) return {};

  const cuisineTags = tags
    .filter((t) => t.tag_type === 'cuisine')
    .map((t) => t.tag_value);
  const location = [restaurant.area, restaurant.city]
    .filter(Boolean)
    .join(', ');
  const cuisineStr = cuisineTags.length ? cuisineTags.join(', ') : null;
  const description = [
    restaurant.description,
    cuisineStr && `Cuisine: ${cuisineStr}`,
    location && `Located in ${location}`,
    restaurant.cost_for_two && `MUR ${restaurant.cost_for_two} for two`,
  ]
    .filter(Boolean)
    .join('. ');

  return {
    title: restaurant.name,
    description: `${description || `Discover ${restaurant.name}`}. Book a table and unlock exclusive dining deals on PassPrivé.`,
    openGraph: {
      title: `${restaurant.name} | PassPrivé`,
      description: description || `Discover ${restaurant.name} on PassPrivé`,
      url: `/dining/${restaurant.slug ?? id}`,
      images: restaurant.cover_image
        ? [{ url: restaurant.cover_image, alt: restaurant.name }]
        : [],
    },
    alternates: { canonical: `/dining/${restaurant.slug ?? id}` },
  };
}

/** app parity: RestaurantDetails.jsx restaurantOfferBody — "Flat 40% OFF" over its condition. */
function exclusiveOffer(o: DiningOffer): OfferBody {
  const v = Number(o.discount_value);
  const pct = String(o.offer_type ?? '').toLowerCase().startsWith('percent');
  const main = Number.isFinite(v) && v > 0 ? (pct ? `Flat ${v}% OFF` : `Flat MUR ${v.toLocaleString('en-US')} OFF`) : o.badge_text || o.title;
  const sub = o.min_spend != null
    ? `on bills above MUR ${Number(o.min_spend).toLocaleString('en-US')}`
    : o.description || (main === o.title ? null : o.title);
  return { id: o.id, main, sub };
}

/** app parity: bankOfferBody */
function bankOffer(o: DiningOffer): OfferBody {
  return { id: o.id, main: o.title, sub: o.description || 'using eligible bank cards' };
}

/** Restaurant detail — app parity: screens/RestaurantDetails.jsx. */
export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [{ restaurant, offers, tags, reviews, reviewSummary, galleryPhotos, menuImages, allHours }, caps] =
    await Promise.all([fetchRestaurant(id), getDiscountCaps()]);
  if (!restaurant) notFound();
  const [orderCollect, stampCard] = await Promise.all([getOrderCollect(restaurant.id), getRestaurantStampCard(restaurant.id)]);
  const printedAt = new Date().toLocaleString('en-US', { timeZone: 'Indian/Mauritius', weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

  const tagsOf = (type: string) => tags.filter((t) => t.tag_type === type).map((t) => t.tag_value);
  const cuisineTags = tagsOf('cuisine');
  const facilityTags = tagsOf('facility');
  const highlightTags = tagsOf('highlight');
  const worthVisitTags = tagsOf('worth_visit');
  const fullMenuImages: string[] =
    menuImages.length > 0 ? menuImages : (restaurant.menu_json?.full_menu_image_urls ?? []);
  const isBank = (o: DiningOffer) => o.offer_type === 'bank_card' || o.offer_type === 'credit_card';
  const exclusiveOffers = offers.filter((o) => !isBank(o)).map(exclusiveOffer);
  const bankOffers = offers.filter(isBank).map(bankOffer);
  const address = restaurant.full_address ?? [restaurant.area, restaurant.city].filter(Boolean).join(', ');
  const costForTwo =
    restaurant.cost_for_two != null ? `MUR ${restaurant.cost_for_two.toLocaleString('en-US')} for two` : null;

  const hasMenu = (restaurant.menu_json?.sections?.length ?? 0) > 0 || fullMenuImages.length > 0;
  const facts: Fact[] = [];
  if (costForTwo) facts.push({ icon: 'cost', label: 'Average cost', value: costForTwo });
  if (cuisineTags.length) facts.push({ icon: 'cuisine', label: 'Cuisines', value: cuisineTags.join(', ') });
  if (restaurant.is_pure_veg) facts.push({ icon: 'veg', label: 'Dietary', value: 'Pure vegetarian' });
  const hasAbout = !!restaurant.description || facts.length > 0 || highlightTags.length > 0 || worthVisitTags.length > 0 || facilityTags.length > 0;

  // app parity: RestaurantDetails visibleTabs — a tab only for a section with content
  const tabs = [
    // the tab drops out on its own when the section isn't on the page
    { id: 'offers', label: 'Offers' },
    { id: 'deals', label: 'Deals' },
    hasMenu && { id: 'menu', label: 'Menu' },
    galleryPhotos.length > 1 && { id: 'gallery', label: 'Photos' },
    { id: 'reviews', label: 'Reviews' },
    hasAbout && { id: 'about', label: 'About' },
    facilityTags.length > 0 && { id: 'amenities', label: 'Amenities' },
    !!address && { id: 'location', label: 'Location' },
  ].filter((t): t is DetailTab => !!t);

  const slug = restaurant.slug ?? restaurant.id;
  // app parity: the bottom "Book a table" / "Pay bill" actions
  const actions: CtaAction[] = [
    restaurant.booking_enabled && { label: 'Book a table', href: `/dining/${slug}/book` },
    canPayBill(restaurant) && {
      label: 'Pay bill',
      href: `/pay-bill?restaurant_id=${restaurant.id}&restaurant_name=${encodeURIComponent(restaurant.name)}`,
      primary: !restaurant.booking_enabled,
    },
  ].filter((a): a is CtaAction => !!a);

  // app parity: upsellOfferPct — the first percentage offer is what the tiers share
  const offerPct = Number(offers.find((o) => String(o.offer_type ?? '').toLowerCase().startsWith('percent') && Number(o.discount_value) > 0)?.discount_value) || 0;
  const bookHref = restaurant.booking_enabled ? `/dining/${slug}/book` : null;
  const payHref = canPayBill(restaurant)
    ? `/pay-bill?restaurant_id=${restaurant.id}&restaurant_name=${encodeURIComponent(restaurant.name)}`
    : null;
  const stampSheet = tagsOf('mood').some((m) => m.toLowerCase().includes('stamp'));
  const exclusive = String(restaurant.merchant_type ?? '').toLowerCase() === 'preferred';
  // the first section after the tabs sits right under them (no divider)
  const firstUnderTabs = '[&>section:first-of-type]:mt-2 [&>section:first-of-type]:border-t-0 [&>section:first-of-type]:pt-5';

  return (
    <PhotoGalleryProvider photos={galleryPhotos}>
      {/* desktop: Figma "Dining - Pay Bill" — a full 1920 frame (breaks out of the site's 1280px
          column): layout in --u (fluid with the screen), type in --t (stepped per breakpoint) */}
      <main
        className={cn('min-h-screen bg-white md:mx-[calc(50%-50vw)] md:-mt-9.5 md:w-screen md:pb-0', TYPE_SCALE, actions.length ? 'pb-36' : 'pb-16')}
        style={{ ['--u' as string]: DESIGN_UNIT }}
      >
        {/* phones: the app's cover hero; desktop: the photo-beside-details header */}
        <PhotoGrid
          photos={galleryPhotos}
          restaurantName={restaurant.name}
          save={{ id: restaurant.id, type: 'RESTAURANT' }}
          cover={restaurant.cover_image}
          desktop={false}
        />

        <div
          className='relative z-10 mx-auto flex max-w-7xl flex-col rounded-t-[20px] bg-white px-4 md:max-w-[calc(1920*var(--u))] md:rounded-none md:bg-transparent md:px-[calc(172*var(--u))]'
        >
          <RestaurantDesktopHero id={restaurant.id} name={restaurant.name} cover={restaurant.cover_image ?? galleryPhotos[0] ?? null} />

          {/* phones: `contents` leaves these children in the page's ordered column */}
          <div
            className='contents md:block lg:grid lg:grid-cols-[minmax(0,1128fr)_minmax(270px,390fr)] lg:items-start lg:gap-x-[calc(58*var(--u))]'
          >
          <div className='contents md:block md:min-w-0'>
          <RestaurantTitleCard
            name={restaurant.name}
            cuisines={cuisineTags}
            costForTwo={restaurant.cost_for_two}
            area={restaurant.area}
            city={restaurant.city}
            lat={restaurant.latitude}
            lng={restaurant.longitude}
            address={address}
            phone={restaurant.phone}
            rating={reviewSummary}
            hours={allHours}
            stampSheet={stampSheet}
            trending={restaurant.is_advertised}
            exclusive={exclusive}
          />
          {/* small tablets have no sidebar beside the card, so the actions come straight after it */}
          <RestaurantCtaCard merchant={restaurant} bookHref={bookHref} payHref={payHref} className='mt-4 hidden md:block lg:hidden' />

          <MobileTitleCard
            name={restaurant.name}
            subtitle={[cuisineTags.slice(0, 2).join(', '), costForTwo].filter(Boolean).join(' • ')}
            area={restaurant.area}
            city={restaurant.city}
            lat={restaurant.latitude}
            lng={restaurant.longitude}
            address={address}
            phone={restaurant.phone}
            rating={reviewSummary}
            hours={allHours}
            trending={restaurant.is_advertised}
            offerZone={exclusiveOffers.length > 0}
          />

          {/* phones follow the app (deals → banners → tabs → sections); desktop reads top-down */}
          <DetailSectionTabs
            tabs={tabs}
            title={restaurant.name}
            cta={actions[0] ? { label: actions[0].label, href: actions[0].href } : null}
            className='mt-6'
            orderClassName='max-md:order-2'
            variant='figma'
          />
          <div className={`max-md:order-3 md:hidden ${firstUnderTabs}`}>
            <OffersForToday restaurantOffers={exclusiveOffers} bankOffers={bankOffers} merchant={restaurant} />
          </div>
          {orderCollect.items.length > 0 && (
            <OrderCollectBanner
              href={`/dining/${slug}/order`}
              orderEnabled={orderCollect.enabled}
              count={orderCollect.items.length}
              className='mt-4 max-md:order-1 md:hidden'
            />
          )}
          {/* phones: the app's deals stack; desktop draws Deals & cashback as offer cards in RestaurantDesktopSections */}
          <MerchantRewardsSection merchant={restaurant} kind='restaurant' name={restaurant.name} className='max-md:order-1 md:hidden' />
          <UpsellBannerPager
            merchantType={restaurant.merchant_type}
            merchantId={restaurant.id}
            kind='restaurant'
            offerPct={offerPct}
            caps={caps}
            className='mt-4 max-md:order-1 md:hidden'
          />
          <RestaurantDesktopSections
            restaurantId={restaurant.id}
            slug={slug}
            name={restaurant.name}
            restaurantOffers={exclusiveOffers}
            bankOffers={bankOffers}
            merchant={restaurant}
            menuImages={fullMenuImages}
            photos={galleryPhotos}
            reviews={reviews}
            summary={reviewSummary}
            description={restaurant.description}
            highlights={highlightTags.join(', ') || null}
            worthIt={worthVisitTags.join('. ') || null}
            amenities={facilityTags}
          />
          {/* phones: the app-style sections (desktop draws its own above) */}
          <div className='max-md:order-3 md:hidden'>
            {hasMenu && <RestaurantMenuSection sections={restaurant.menu_json?.sections ?? []} fullMenuImages={fullMenuImages} />}
            <PhotoStrip photos={galleryPhotos} />
            <DetailReviews
              kind='restaurant'
              entityId={restaurant.id}
              entityName={restaurant.name}
              reviews={reviews}
              summary={reviewSummary}
            />
            <DetailAbout
              title={`About ${restaurant.name}`}
              description={restaurant.description}
              facts={facts}
              highlights={highlightTags.join(', ') || null}
              worthIt={worthVisitTags.join('. ') || null}
              chips={facilityTags}
              chipsTitle='Facilities'
            />
            <DetailLocation
              name={restaurant.name}
              address={address}
              lat={restaurant.latitude}
              lng={restaurant.longitude}
              phone={restaurant.phone}
              hours={allHours}
            />
            <HelpCard className='mt-10' />
          </div>
          </div>

          <aside className='hidden flex-col font-(family-name:--font-dm-sans) md:flex lg:mt-[calc(24*var(--t))]' style={{ gap: tMin(24, 14), paddingBottom: t(90) }}>
            <RestaurantCtaCard merchant={restaurant} bookHref={bookHref} payHref={payHref} className='hidden lg:block' />
            <UpsellBannerPager
              merchantType={restaurant.merchant_type}
              merchantId={restaurant.id}
              kind='restaurant'
              offerPct={offerPct}
              caps={caps}
            />
            {orderCollect.items.length > 0 && (
              <OrderCollectBanner href={`/dining/${slug}/order`} orderEnabled={orderCollect.enabled} count={orderCollect.items.length} />
            )}
            {stampCard && (
              <StampSideCard
                href={`/visit-rewards/restaurant/${restaurant.id}`}
                image={restaurant.cover_image ?? galleryPhotos[0] ?? null}
                visits={stampCard.visits}
                total={stampCard.total}
              />
            )}
            <SavingsReceipt
              costForTwo={restaurant.cost_for_two}
              offers={billOffers(restaurant.id, offers as RestaurantOfferRow[], [])}
              caps={caps}
              merchant={restaurant}
              printedAt={printedAt}
              calculateHref={payHref}
            />
            <HelpSideCard />
          </aside>
          </div>
        </div>

        <CtaMobileBar actions={actions} merchant={restaurant} />
      </main>
    </PhotoGalleryProvider>
  );
}
