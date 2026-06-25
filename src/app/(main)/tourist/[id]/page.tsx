import { cache } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  MapPin,
  Star,
  Phone,
  Share2,
  Navigation,
  BadgeCheck,
  ThumbsUp,
  Info,
  Calendar,
} from 'lucide-react';
import { getTouristPlaceBySlugOrId } from '@/lib/services/touristPlaces';
import { createClient } from '@/lib/supabase/server';
import type { TouristPlaceReview } from '@/lib/types/touristPlaces';

const fetchTouristPlace = cache((id: string) => getTouristPlaceBySlugOrId(id));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const { place } = await fetchTouristPlace(id);
  if (!place) return {};

  const location = [place.area, place.city].filter(Boolean).join(', ');
  const description = [
    place.description,
    location && `Located in ${location}`,
    place.price && `MUR ${place.price} per person`,
  ].filter(Boolean).join('. ');

  return {
    title: place.place_name,
    description: `${description || `Discover ${place.place_name}`}. Plan your visit and book activities on PassPrivé.`,
    openGraph: {
      title: `${place.place_name} | PassPrivé`,
      description: description || `Discover ${place.place_name} on PassPrivé`,
      url: `/tourist/${place.slug ?? id}`,
      images: place.cover_image ? [{ url: place.cover_image, alt: place.place_name }] : [],
    },
    alternates: {
      canonical: `/tourist/${place.slug ?? id}`,
    },
  };
}

import {
  PhotoGalleryProvider,
  PhotoGrid,
  PhotoStrip,
} from '@/components/sections/dining/PhotoGalleryClient';
import { HoursPopover } from '@/components/sections/dining/HoursPopover';

function getOpenStatus(hours: import('@/lib/types/touristPlaces').TouristPlaceHours | null) {
  if (!hours) return null;
  if (hours.is_closed || !hours.open_time || !hours.close_time)
    return { isOpen: false, statusText: 'Closed today', label: null };
  const now = new Date();
  const [oh, om] = hours.open_time.split(':').map(Number);
  const [ch, cm] = hours.close_time.split(':').map(Number);
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;
  const isOpen = closeMins > openMins
    ? nowMins >= openMins && nowMins < closeMins
    : nowMins >= openMins || nowMins < closeMins;
  const fmt = (h: number, m: number) =>
    `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  return {
    isOpen,
    statusText: isOpen ? `Open until ${fmt(ch, cm)}` : `Opens at ${fmt(oh, om)}`,
    label: null,
  };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return 'Today';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export default async function TouristPlaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { place, activities, reviews, reviewSummary, galleryPhotos, todayHours, allHours } =
    await fetchTouristPlace(id);

  if (!place) notFound();

  const breadcrumbCity = place.city ?? place.area ?? 'Mauritius';

  return (
    <PhotoGalleryProvider photos={galleryPhotos}>
      <main className='min-h-screen bg-white pb-24 md:pb-0'>
        <PhotoGrid
          photos={galleryPhotos}
          restaurantName={place.place_name}
        />

        <div className='max-w-7xl mx-auto px-4 md:px-6'>
          <nav className='pt-3 pb-2 text-[12px] text-gray-400 hidden md:flex items-center gap-1.5'>
            <Link
              href='/'
              className='hover:text-gray-600 transition-colors'
            >
              Home page
            </Link>
            <span>/</span>
            <Link
              href='/tourist'
              className='hover:text-gray-600 transition-colors'
            >
              {breadcrumbCity}
            </Link>
            <span>/</span>
            <span className='text-gray-600'>{place.place_name}</span>
          </nav>

          <div className='md:grid md:grid-cols-[1fr_340px] md:gap-10 md:items-start md:pt-2'>
            <div className='min-w-0'>
              <div className='mt-4 md:mt-0'>
                <div className='flex items-start gap-2 flex-wrap'>
                  <h1 className='text-[28px] md:text-[36px] font-bold text-gray-900 leading-tight'>
                    {place.place_name}
                  </h1>
                  {place.booking_enabled && (
                    <span className='shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 border border-green-200 text-[11px] font-semibold text-green-700 mt-1.5'>
                      <BadgeCheck className='w-3 h-3' /> Bookable Spot
                    </span>
                  )}
                  {place.ad_badge_text && (
                    <span className='shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand/10 border border-brand/20 text-[11px] font-semibold text-brand mt-1.5'>
                      {place.ad_badge_text}
                    </span>
                  )}
                </div>

                <div className='flex flex-wrap items-center gap-x-2 gap-y-1 mt-2 text-[14px]'>
                  {reviewSummary.avg > 0 && (
                    <span className='inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-brand text-white text-[13px] font-bold'>
                      {reviewSummary.avg}
                      <Star className='w-3 h-3 fill-white' />
                    </span>
                  )}
                  <span className='text-gray-300 font-light'>|</span>
                  <span className='text-gray-800 font-medium'>
                    {Number(place.price) === 0 ? 'Free' : `MUR ${place.price} per person`}
                  </span>
                  {(() => {
                    const status = getOpenStatus(todayHours);
                    if (!status) return null;
                    return (
                      <>
                        <span className='text-gray-300 font-light'>|</span>
                        <span className={status.isOpen ? 'text-green-600 font-semibold' : 'text-orange-500 font-semibold'}>
                          {status.isOpen ? 'Open' : 'Closed'}
                        </span>
                        <span className='text-gray-400'>•</span>
                        <HoursPopover
                          todayHours={todayHours}
                          allHours={allHours}
                          statusText={status.statusText}
                          isOpen={status.isOpen}
                        />
                      </>
                    );
                  })()}
                </div>

                {(place.full_address ?? place.area) && (
                  <div className='flex items-start gap-1.5 mt-3'>
                    <MapPin className='w-4 h-4 text-gray-400 mt-0.5 shrink-0' />
                    <span className='text-[13px] text-gray-500 leading-snug'>
                      {place.full_address ??
                        `${place.area}, ${place.city}`}
                    </span>
                  </div>
                )}

                <div className='flex flex-wrap gap-3 mt-5'>
                  <button
                    type='button'
                    className='flex items-center gap-2 px-7 py-3 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-800 hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors'
                  >
                    <Navigation className='w-4 h-4' /> Direction
                  </button>
                  <button
                    type='button'
                    className='flex items-center gap-2 px-7 py-3 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-800 hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors'
                  >
                    <Share2 className='w-4 h-4' /> Share
                  </button>
                  {place.phone && (
                    <a
                      href={`tel:${place.phone}`}
                      className='flex items-center gap-2 px-7 py-3 rounded-2xl border border-gray-200 text-[14px] font-semibold text-gray-800 hover:border-brand hover:text-brand hover:bg-brand/5 transition-colors'
                    >
                      <Phone className='w-4 h-4' /> Call
                    </a>
                  )}
                </div>
              </div>

              {place.description && (
                <section className='mt-8 border-t border-gray-100 pt-6'>
                  <h2 className='text-[18px] font-bold text-gray-900 mb-3'>About the Attraction</h2>
                  <p className='text-sm text-gray-600 leading-relaxed'>{place.description}</p>
                </section>
              )}

              {activities.length > 0 && (
                <section className='mt-8 border-t border-gray-100 pt-6'>
                  <h2 className='text-[22px] font-bold text-gray-900 mb-4'>
                    Activities &amp; Tours
                  </h2>

                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                    {activities.map((activity) => (
                      <div
                        key={activity.id}
                        className='border border-gray-200 rounded-2xl p-4 bg-gray-50 flex flex-col justify-between hover:border-brand hover:shadow-sm transition-all'
                      >
                        <div>
                          <p className='text-[15px] font-bold text-gray-900 capitalize'>
                            {activity.activity_type.replace(/_/g, ' ')}
                          </p>
                          {activity.child_special_offer && (
                            <p className='text-[11px] text-brand font-semibold mt-1 bg-brand/5 px-2 py-0.5 rounded w-fit'>
                              {activity.child_special_offer}
                            </p>
                          )}
                        </div>
                        <div className='mt-4 flex items-baseline justify-between gap-2 border-t border-gray-200/60 pt-3'>
                          <div>
                            <p className='text-[12px] text-gray-400'>Adult Price</p>
                            <p className='text-[15px] font-bold text-gray-900'>MUR {activity.price_adult}</p>
                          </div>
                          {activity.price_child !== null && (
                            <div>
                              <p className='text-[12px] text-gray-400 text-right'>Child Price</p>
                              <p className='text-[15px] font-bold text-gray-900 text-right'>MUR {activity.price_child}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <PhotoStrip photos={galleryPhotos} />

              {reviews.length > 0 && (
                <section className='mt-8 border-t border-gray-100 pt-6'>
                  <h2 className='text-[22px] font-bold text-gray-900 mb-5'>
                    Ratings &amp; reviews
                  </h2>

                  <div className='rounded-3xl bg-gray-50 border border-gray-200 p-6 md:p-8'>
                    <div className='text-center'>
                      <div className='flex items-center justify-center gap-2'>
                        <span className='text-[52px] font-bold text-brand leading-none'>
                          {reviewSummary.avg}
                        </span>
                        <Star className='w-9 h-9 fill-brand text-brand' />
                      </div>
                      <p className='text-[16px] font-bold text-gray-900 mt-3'>
                        Based on {reviewSummary.count.toLocaleString()} ratings
                      </p>
                    </div>

                    {(reviewSummary.guideAvg != null ||
                      reviewSummary.safetyAvg != null ||
                      reviewSummary.cleanlinessAvg != null ||
                      reviewSummary.valueAvg != null ||
                      reviewSummary.crowdAvg != null) && (
                      <div className='flex justify-center mt-6'>
                        <div className='grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-4 rounded-2xl bg-gray-100 border border-gray-200 p-4 w-full'>
                          {reviewSummary.guideAvg != null && (
                            <div className='flex flex-col items-center'>
                              <span className='text-[15px] font-bold text-gray-900'>{reviewSummary.guideAvg}</span>
                              <span className='text-[11px] text-gray-500 mt-0.5 text-center'>Guide</span>
                            </div>
                          )}
                          {reviewSummary.safetyAvg != null && (
                            <div className='flex flex-col items-center'>
                              <span className='text-[15px] font-bold text-gray-900'>{reviewSummary.safetyAvg}</span>
                              <span className='text-[11px] text-gray-500 mt-0.5 text-center'>Safety</span>
                            </div>
                          )}
                          {reviewSummary.cleanlinessAvg != null && (
                            <div className='flex flex-col items-center'>
                              <span className='text-[15px] font-bold text-gray-900'>{reviewSummary.cleanlinessAvg}</span>
                              <span className='text-[11px] text-gray-500 mt-0.5 text-center'>Cleanliness</span>
                            </div>
                          )}
                          {reviewSummary.valueAvg != null && (
                            <div className='flex flex-col items-center'>
                              <span className='text-[15px] font-bold text-gray-900'>{reviewSummary.valueAvg}</span>
                              <span className='text-[11px] text-gray-500 mt-0.5 text-center'>Value</span>
                            </div>
                          )}
                          {reviewSummary.crowdAvg != null && (
                            <div className='flex flex-col items-center'>
                              <span className='text-[15px] font-bold text-gray-900'>{reviewSummary.crowdAvg}</span>
                              <span className='text-[11px] text-gray-500 mt-0.5 text-center'>Crowd</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <p className='text-center text-[20px] font-bold text-gray-900 mt-7 mb-5'>
                      {reviewSummary.count.toLocaleString()} reviews
                    </p>

                    <div className='flex gap-4 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-1'>
                      {reviews.map((review) => (
                        <div
                          key={review.id}
                          className='shrink-0 w-72 bg-white border border-gray-100 rounded-2xl p-4 hover:border-brand/30 hover:shadow-sm transition-all'
                        >
                          <div className='flex items-center justify-between gap-2'>
                            <div className='flex items-center gap-2.5'>
                              <div className='w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0'>
                                <span className='text-[14px] font-bold text-gray-600'>
                                  {(review.username_snapshot ?? 'A')[0].toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className='text-[14px] font-bold text-gray-900 leading-tight'>
                                  {review.username_snapshot ?? 'Anonymous'}
                                </p>
                                <p className='text-[12px] text-gray-400'>
                                  {timeAgo(review.created_at)}
                                </p>
                              </div>
                            </div>
                            <span className='inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand text-white text-[13px] font-bold shrink-0'>
                              {review.rating}
                              <Star className='w-3 h-3 fill-white' />
                            </span>
                          </div>

                          {review.review_text && (
                            <p className='mt-3 text-[13px] text-gray-600 leading-relaxed line-clamp-3'>
                              {review.review_text}
                            </p>
                          )}

                          {(review.liked_tags ?? []).length > 0 && (
                            <div className='flex flex-wrap gap-1.5 mt-2.5'>
                              <ThumbsUp className='w-3 h-3 text-green-500 shrink-0 mt-0.5' />
                              {review.liked_tags.map((tag) => (
                                <span
                                  key={tag}
                                  className='px-1.5 py-0.5 rounded-full bg-green-50 border border-green-100 text-[10px] font-medium text-green-700'
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {(place.full_address ?? place.area) && (
                <section className='mt-8 border-t border-gray-200 pt-6 pb-8'>
                  <h2 className='text-[18px] font-bold text-gray-900 mb-4'>
                    Location
                  </h2>

                  <div className='border border-gray-200 rounded-2xl hover:border-brand/30 transition-colors'>
                    <div className='w-full h-52 rounded-t-2xl overflow-hidden mb-4 bg-gray-100'>
                      {place.latitude && place.longitude ? (
                        <iframe
                          title='Attraction location'
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${Number(place.longitude) - 0.006},${Number(place.latitude) - 0.004},${Number(place.longitude) + 0.006},${Number(place.latitude) + 0.004}&layer=mapnik&marker=${place.latitude},${place.longitude}`}
                          className='w-full h-full border-0'
                        />
                      ) : (
                        <div className='w-full h-full bg-gray-200 flex items-center justify-center'>
                          <p className='text-[13px] text-gray-400'>
                            Map not available
                          </p>
                        </div>
                      )}
                    </div>

                    <div className='px-4 pb-4'>
                      <p className='font-bold text-gray-900'>
                        {place.place_name}
                      </p>
                      <p className='text-sm text-gray-500 mt-0.5 leading-relaxed'>
                        {place.full_address ??
                          `${place.area}, ${place.city}`}
                      </p>
                      <a
                        href={
                          place.latitude && place.longitude
                            ? `https://www.google.com/maps/dir/?api=1&destination=${place.latitude},${place.longitude}`
                            : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(place.full_address ?? `${place.area}, ${place.city}`)}`
                        }
                        target='_blank'
                        rel='noopener noreferrer'
                        className='inline-flex items-center gap-1 mt-2.5 text-[12px] font-semibold text-brand hover:underline'
                      >
                        <Navigation className='w-3.5 h-3.5' /> Get Directions
                      </a>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Desktop sidebar — Book visits CTA */}
            {place.booking_enabled && (
              <div className='hidden md:block sticky top-20 pt-4'>
                <div className='rounded-2xl border border-gray-200 bg-white shadow-sm p-6 flex flex-col gap-4'>
                  <div>
                    <h2 className='text-[17px] font-extrabold text-gray-900'>Book visits</h2>
                    <p className='text-sm text-gray-500 mt-1'>Plan your tour at {place.place_name}</p>
                  </div>
                  <Link
                    href={`/tourist/${place.slug ?? place.id}/book`}
                    className='block w-full py-3.5 rounded-xl bg-gray-900 text-white font-bold text-[14px] text-center hover:bg-black hover:shadow-md transition-all'
                  >
                    Book ticket
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Mobile sticky bottom CTA */}
        {place.booking_enabled && (
          <div className='md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-4 z-20 shadow-lg'>
            <Link
              href={`/tourist/${place.slug ?? place.id}/book`}
              className='block w-full py-3.5 rounded-2xl bg-gray-900 text-white font-bold text-[15px] text-center hover:bg-black transition-colors'
            >
              Book visits
            </Link>
          </div>
        )}
      </main>
    </PhotoGalleryProvider>
  );
}
