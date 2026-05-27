import Link from 'next/link'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { MapPin, Phone, Share2, Navigation, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PhotoGalleryProvider, PhotoGrid } from '@/components/sections/dining/PhotoGalleryClient'
import { MenuGalleryProvider, MenuGalleryImageButton } from '@/components/sections/dining/MenuGalleryClient'

type Store = {
  id: string
  name: string
  slug: string | null
  description: string | null
  category: string | null
  subcategory: string | null
  location_name: string | null
  address_line1: string | null
  city: string | null
  logo_url: string | null
  cover_image: string | null
  phone: string | null
  whatsapp: string | null
  website: string | null
}

type MediaAsset = { file_url: string; sort_order: number }
type OpeningHour = { day_of_week: number; open_time: string; close_time: string; is_closed: boolean }
type CatalogueItem = {
  id: string
  category_id: string
  title: string | null
  price: number | null
  description: string | null
  image_url: string | null
  is_available: boolean
  updated_at: string | null
}
type StoreTag = { tag_value: string }
type Offer = { id: string; title?: string; description?: string; code?: string }
type SocialLink = { platform: string; url: string }

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}${m ? `:${String(m).padStart(2, '0')}` : ''} ${ampm}`
}

function todayStatus(hours: OpeningHour[]): { isOpen: boolean; closeTime: string | null } {
  const today = new Date().getDay()
  const h = hours.find(r => r.day_of_week === today)
  if (!h || h.is_closed) return { isOpen: false, closeTime: null }
  return { isOpen: true, closeTime: formatTime(h.close_time) }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'Today'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

async function getData(slugOrId: string) {
  const supabase = await createClient()

  let { data: store } = await supabase
    .from('stores')
    .select('id,name,slug,description,category,subcategory,location_name,address_line1,city,logo_url,cover_image,phone,whatsapp,website')
    .eq('slug', slugOrId)
    .eq('is_active', true)
    .maybeSingle()

  if (!store) {
    const res = await supabase
      .from('stores')
      .select('id,name,slug,description,category,subcategory,location_name,address_line1,city,logo_url,cover_image,phone,whatsapp,website')
      .eq('id', slugOrId)
      .eq('is_active', true)
      .maybeSingle()
    store = res.data
  }

  if (!store) return null

  const [galleryRes, hoursRes, itemsRes, tagsRes, offersRes, socialRes] = await Promise.allSettled([
    supabase.from('store_media_assets').select('file_url, sort_order').eq('store_id', store.id).eq('asset_type', 'gallery').eq('is_active', true).order('sort_order'),
    supabase.from('store_opening_hours').select('day_of_week, open_time, close_time, is_closed').eq('store_id', store.id).order('day_of_week'),
    supabase.from('store_catalogue_items').select('id, category_id, title, price, description, image_url, is_available, updated_at').eq('store_id', store.id).eq('is_available', true).order('sort_order'),
    supabase.from('store_tags').select('tag_value').eq('store_id', store.id).eq('tag_type', 'tag'),
    supabase.from('store_offers').select('id, title, description, code').eq('store_id', store.id),
    supabase.from('store_social_links').select('platform, url').eq('store_id', store.id).order('sort_order'),
  ])

  return {
    store: store as Store,
    gallery:  galleryRes.status  === 'fulfilled' ? (galleryRes.value.data  ?? []) as MediaAsset[]   : [] as MediaAsset[],
    hours:    hoursRes.status    === 'fulfilled' ? (hoursRes.value.data    ?? []) as OpeningHour[]   : [] as OpeningHour[],
    items:    itemsRes.status    === 'fulfilled' ? (itemsRes.value.data    ?? []) as CatalogueItem[] : [] as CatalogueItem[],
    tags:     tagsRes.status     === 'fulfilled' ? (tagsRes.value.data     ?? []) as StoreTag[]      : [] as StoreTag[],
    offers:   offersRes.status   === 'fulfilled' ? (offersRes.value.data   ?? []) as Offer[]         : [] as Offer[],
    socials:  socialRes.status   === 'fulfilled' ? (socialRes.value.data   ?? []) as SocialLink[]    : [] as SocialLink[],
  }
}

function QrCodeSvg() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <rect width="100" height="100" fill="white" />
      <rect x="5" y="5" width="30" height="30" fill="none" stroke="#111" strokeWidth="5" />
      <rect x="14" y="14" width="12" height="12" fill="#111" />
      <rect x="65" y="5" width="30" height="30" fill="none" stroke="#111" strokeWidth="5" />
      <rect x="74" y="14" width="12" height="12" fill="#111" />
      <rect x="5" y="65" width="30" height="30" fill="none" stroke="#111" strokeWidth="5" />
      <rect x="14" y="74" width="12" height="12" fill="#111" />
      <rect x="42" y="5"  width="7" height="7" fill="#111" />
      <rect x="54" y="5"  width="7" height="7" fill="#111" />
      <rect x="42" y="17" width="7" height="7" fill="#111" />
      <rect x="54" y="17" width="7" height="7" fill="#111" />
      <rect x="42" y="42" width="7" height="7" fill="#111" />
      <rect x="54" y="42" width="7" height="7" fill="#111" />
      <rect x="65" y="42" width="7" height="7" fill="#111" />
      <rect x="82" y="42" width="7" height="7" fill="#111" />
      <rect x="42" y="54" width="7" height="7" fill="#111" />
      <rect x="65" y="54" width="7" height="7" fill="#111" />
      <rect x="82" y="54" width="7" height="7" fill="#111" />
      <rect x="42" y="65" width="7" height="7" fill="#111" />
      <rect x="54" y="65" width="7" height="7" fill="#111" />
      <rect x="82" y="65" width="7" height="7" fill="#111" />
      <rect x="42" y="82" width="7" height="7" fill="#111" />
      <rect x="65" y="82" width="7" height="7" fill="#111" />
      <rect x="82" y="82" width="7" height="7" fill="#111" />
    </svg>
  )
}

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getData(id)
  if (!data) notFound()

  const { store, gallery, hours, items, tags, offers } = data

  const allPhotos = [store.cover_image, ...gallery.map(g => g.file_url)].filter(Boolean) as string[]
  const { isOpen, closeTime } = hours.length > 0 ? todayStatus(hours) : { isOpen: false, closeTime: null }
  const categoriesList = [store.category, store.subcategory].filter(Boolean) as string[]
  const breadcrumbCity = store.city ?? store.location_name ?? 'Stores'

  const latestItemUpdate = items.reduce<string | null>((latest, item) => {
    if (!item.updated_at) return latest
    if (!latest) return item.updated_at
    return item.updated_at > latest ? item.updated_at : latest
  }, null)

  const catalogueImages = items.map(i => i.image_url).filter(Boolean) as string[]
  const itemGalleryIndices = (() => {
    let idx = 0
    return items.map(item => item.image_url ? idx++ : -1)
  })()

  return (
    <PhotoGalleryProvider photos={allPhotos}>
      <main className='min-h-screen bg-white pb-20 md:pb-0'>
        <PhotoGrid
          photos={allPhotos}
          restaurantName={store.name}
          backHref='/stores'
        />

        {/* ── Content wrapper ── */}
        <div className=' mx-auto px-4 md:px-6'>
          {/* Breadcrumb */}
          <nav className='hidden md:flex items-center gap-1.5 pt-2 pb-1 text-[11px] text-gray-400'>
            <Link
              href='/'
              className='hover:text-gray-600 transition-colors'
            >
              Home page
            </Link>
            <span>/</span>
            <Link
              href='/stores'
              className='hover:text-gray-600 transition-colors'
            >
              {breadcrumbCity}
            </Link>
            <span>/</span>
            <span className='text-gray-600'>{store.name}</span>
          </nav>

          {/* ── Store info row: left info + right QR ── */}
          <div className='flex items-start justify-between gap-6 mt-3'>
            {/* Left block */}
            <div className='min-w-0 flex-1'>
              {/* Logo + name */}
              <div className='flex items-center gap-2.5'>
                {store.logo_url && (
                  <div className='relative w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200'>
                    <Image
                      src={store.logo_url}
                      alt={store.name}
                      fill
                      className='object-contain p-0.5'
                    />
                  </div>
                )}
                <h1 className='text-[22px] md:text-[24px] font-bold text-gray-900 leading-tight'>
                  {store.name}
                </h1>
              </div>

              {/* Categories + open status */}
              <div className='flex flex-wrap items-center gap-x-1 mt-1 text-[13px] text-gray-500'>
                {categoriesList.map((cat, i) => (
                  <span
                    key={cat}
                    className='flex items-center gap-1'
                  >
                    {i > 0 && <span className='text-gray-300 mx-0.5'>|</span>}
                    <span>{cat}</span>
                  </span>
                ))}
                {(isOpen || closeTime) && (
                  <>
                    {categoriesList.length > 0 && (
                      <span className='text-gray-300 mx-0.5'>|</span>
                    )}
                    <span className='text-green-600 font-semibold'>Open</span>
                    {closeTime && (
                      <>
                        <span className='text-gray-400 mx-0.5'>•</span>
                        <span>Closes {closeTime}</span>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Address */}
              {(store.address_line1 ?? store.location_name) && (
                <div className='flex items-start gap-1 mt-1.5'>
                  <MapPin className='w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0' />
                  <span className='text-[12px] text-gray-500 leading-snug'>
                    {store.address_line1 ??
                      `${store.location_name}, ${store.city}`}
                  </span>
                </div>
              )}
              <div className='flex flex-wrap gap-2 mt-4'>
                <button
                  type='button'
                  className='flex items-center gap-1.5 px-5 py-1.5 rounded-full border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors'
                >
                  <Navigation className='w-3.5 h-3.5' /> Direction
                </button>
                <button
                  type='button'
                  className='flex items-center gap-1.5 px-5 py-1.5 rounded-full border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors'
                >
                  <Share2 className='w-3.5 h-3.5' /> Share
                </button>
                {store.phone && (
                  <a
                    href={`tel:${store.phone}`}
                    className='flex items-center gap-1.5 px-5 py-1.5 rounded-full border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors'
                  >
                    <Phone className='w-3.5 h-3.5' /> Call
                  </a>
                )}
                {store.website && (
                  <a
                    href={store.website}
                    target='_blank'
                    rel='noreferrer'
                    className='flex items-center gap-1.5 px-5 py-1.5 rounded-full border border-gray-200 text-[12px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors'
                  >
                    <Globe className='w-3.5 h-3.5' /> Website
                  </a>
                )}
              </div>

              {/* ── PassPrivé pay offers ── */}
              {offers.length > 0 && (
                <section className='mt-6 border-t border-gray-100 pt-5'>
                  <p className='text-[16px] font-bold text-gray-900'>
                    PassPrivé pay offers
                  </p>
                  <p className='text-[12px] text-gray-400 mt-0.5'>
                    Unlock when you pay via District.
                  </p>

                  <div className='flex gap-2 mt-3 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1'>
                    {offers.map((offer) => (
                      <div
                        key={offer.id}
                        className='shrink-0 w-52 flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100'
                      >
                        <div className='w-8 h-8 rounded-lg bg-gray-200 shrink-0' />
                        <div className='min-w-0'>
                          <p className='text-[12px] font-semibold text-gray-900 leading-snug'>
                            {offer.title}
                          </p>
                          {offer.description && (
                            <p className='text-[11px] text-gray-400 mt-0.5 line-clamp-2'>
                              {offer.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {/* ── Catalouge ── */}
              {items.length > 0 && (
                <section className='mt-6 border-t border-gray-100 pt-5 w-full'>
                  <div className='flex items-start justify-between mb-1'>
                    <div>
                      <h2 className='text-[18px] font-bold text-gray-900'>
                        Catalouge
                      </h2>
                      {latestItemUpdate && (
                        <p className='text-[11px] text-brand mt-0.5'>
                          Updated {timeAgo(latestItemUpdate)}
                        </p>
                      )}
                    </div>
                    <button
                      type='button'
                      className='text-[12px] text-brand font-semibold hover:underline mt-1'
                    >
                      See more →
                    </button>
                  </div>

                  <MenuGalleryProvider images={catalogueImages}>
                    {/* Top mosaic: 4 columns — col 1+2 are portrait (row-span-2), col 3+4 are 2×2 */}
                    <div className='grid grid-cols-4 grid-rows-2 gap-1 h-44 mt-3'>
                      <MenuGalleryImageButton
                        src={items[0]?.image_url ?? null}
                        alt={items[0]?.title ?? ''}
                        index={itemGalleryIndices[0]}
                        className='row-span-2 rounded-lg'
                        sizes='25vw'
                      />
                      <MenuGalleryImageButton
                        src={items[1]?.image_url ?? null}
                        alt={items[1]?.title ?? ''}
                        index={itemGalleryIndices[1]}
                        className='row-span-2 rounded-lg'
                        sizes='25vw'
                      />
                      {[2, 3, 4, 5].map((i) => (
                        <MenuGalleryImageButton
                          key={items[i]?.id ?? i}
                          src={items[i]?.image_url ?? null}
                          alt={items[i]?.title ?? ''}
                          index={itemGalleryIndices[i] ?? -1}
                          className='rounded-lg'
                          sizes='12vw'
                        />
                      ))}
                    </div>

                    {/* Bottom row: 3 images */}
                    {items.length > 6 && (
                      <div className='grid grid-cols-3 gap-1 mt-1 h-28'>
                        {items.slice(6, 9).map((item, j) => (
                          <MenuGalleryImageButton
                            key={item.id}
                            src={item.image_url}
                            alt={item.title ?? ''}
                            index={itemGalleryIndices[6 + j] ?? -1}
                            className='rounded-lg'
                            sizes='33vw'
                          />
                        ))}
                      </div>
                    )}
                  </MenuGalleryProvider>
                </section>
              )}

              {/* ── About the brand ── */}
              {store.description && (
                <section className='mt-6 border-t border-gray-100 pt-5 pb-10'>
                  <h2 className='text-[18px] font-bold text-gray-900 mb-2'>
                    About the brand
                  </h2>
                  <p className='text-[13px] text-gray-600 leading-relaxed'>
                    {store.description}
                  </p>
                  <button
                    type='button'
                    className='flex items-center gap-1 mt-1.5 text-[13px] text-gray-500 hover:text-gray-700 transition-colors'
                  >
                    See more <span className='text-[11px]'>↓</span>
                  </button>

                  {tags.length > 0 && (
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-y-1.5 gap-x-4 mt-4'>
                      {tags.map((t) => (
                        <div
                          key={t.tag_value}
                          className='flex items-center gap-1.5'
                        >
                          <span className='w-1 h-1 rounded-full bg-gray-400 shrink-0' />
                          <span className='text-[13px] text-gray-600'>
                            {t.tag_value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              )}
            </div>

            {/* Right: QR code (desktop) */}
            <div className='hidden md:flex items-center gap-3 px-4 py-3 border border-gray-200 rounded-xl shrink-0'>
              <div className='w-14 h-14 shrink-0'>
                <QrCodeSvg />
              </div>
              <div>
                <p className='text-[13px] font-bold text-gray-900 whitespace-nowrap'>
                  Download PassPrivé
                </p>
                <p className='text-[11px] text-gray-500 mt-1'>
                  • Exclusive offers and deals
                </p>
                <p className='text-[11px] text-gray-500 mt-0.5'>
                  • Pay via District
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </PhotoGalleryProvider>
  );
}
