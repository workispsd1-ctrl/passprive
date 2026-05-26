import Link from 'next/link'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { MapPin, Clock, Phone, Share2, Navigation, Tag, Heart, Grid2x2, Globe, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

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
type CatalogueCategory = { id: string; title: string; sort_order: number }
type CatalogueItem = { id: string; category_id: string; title: string | null; price: number | null; description: string | null; image_url: string | null; is_available: boolean }
type Tag = { tag_value: string }
type Offer = { id: string; title?: string; description?: string; code?: string }
type SocialLink = { platform: string; url: string }

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}${m ? `:${String(m).padStart(2, '0')}` : ''} ${ampm}`
}

function todayHours(hours: OpeningHour[]) {
  const today = new Date().getDay() // 0=Sun
  const h = hours.find(r => r.day_of_week === today)
  if (!h || h.is_closed) return 'Closed today'
  return `${formatTime(h.open_time)} – ${formatTime(h.close_time)}`
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

  const [galleryRes, hoursRes, catRes, itemsRes, tagsRes, offersRes, socialRes] = await Promise.allSettled([
    supabase
      .from('store_media_assets')
      .select('file_url, sort_order')
      .eq('store_id', store.id)
      .eq('asset_type', 'gallery')
      .eq('is_active', true)
      .order('sort_order'),
    supabase
      .from('store_opening_hours')
      .select('day_of_week, open_time, close_time, is_closed')
      .eq('store_id', store.id)
      .order('day_of_week'),
    supabase
      .from('store_catalogue_categories')
      .select('id, title, sort_order')
      .eq('store_id', store.id)
      .eq('enabled', true)
      .order('sort_order'),
    supabase
      .from('store_catalogue_items')
      .select('id, category_id, title, price, description, image_url, is_available')
      .eq('store_id', store.id)
      .eq('is_available', true)
      .order('sort_order'),
    supabase
      .from('store_tags')
      .select('tag_value')
      .eq('store_id', store.id)
      .eq('tag_type', 'tag'),
    supabase
      .from('store_offers')
      .select('id, title, description, code')
      .eq('store_id', store.id),
    supabase
      .from('store_social_links')
      .select('platform, url')
      .eq('store_id', store.id)
      .order('sort_order'),
  ])

  return {
    store: store as Store,
    gallery:   galleryRes.status  === 'fulfilled' ? (galleryRes.value.data  ?? []) as MediaAsset[]       : [] as MediaAsset[],
    hours:     hoursRes.status    === 'fulfilled' ? (hoursRes.value.data    ?? []) as OpeningHour[]       : [] as OpeningHour[],
    categories:catRes.status      === 'fulfilled' ? (catRes.value.data      ?? []) as CatalogueCategory[] : [] as CatalogueCategory[],
    items:     itemsRes.status    === 'fulfilled' ? (itemsRes.value.data    ?? []) as CatalogueItem[]     : [] as CatalogueItem[],
    tags:      tagsRes.status     === 'fulfilled' ? (tagsRes.value.data     ?? []) as Tag[]               : [] as Tag[],
    offers:    offersRes.status   === 'fulfilled' ? (offersRes.value.data   ?? []) as Offer[]             : [] as Offer[],
    socials:   socialRes.status   === 'fulfilled' ? (socialRes.value.data   ?? []) as SocialLink[]        : [] as SocialLink[],
  }
}

export default async function StorePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const data = await getData(id)
  if (!data) notFound()

  const { store, gallery, hours, categories, items, tags, offers, socials } = data

  // Build photo list: cover first, then gallery assets
  const allPhotos = [store.cover_image, ...gallery.map(g => g.file_url)].filter(Boolean) as string[]

  // Group catalogue items by category
  const itemsByCategory = categories.map(cat => ({
    ...cat,
    items: items.filter(i => i.category_id === cat.id),
  })).filter(cat => cat.items.length > 0)

  const categoriesList = [store.category, store.subcategory].filter(Boolean) as string[]
  const hoursToday = hours.length > 0 ? todayHours(hours) : null

  return (
    <main className="min-h-screen bg-white pb-20 md:pb-0">

      {/* ── Photo gallery (desktop) ── */}
      <div className="hidden md:grid grid-cols-[3fr_1fr_1fr] grid-rows-2 gap-1.5 h-80 px-6 pt-4">
        <div className="row-span-2 rounded-2xl overflow-hidden bg-gray-100 relative">
          {allPhotos[0]
            ? <Image src={allPhotos[0]} alt={store.name} fill className="object-cover" priority />
            : <div className="w-full h-full bg-linear-to-br from-brand/20 to-purple-100" />}
        </div>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className={`relative overflow-hidden bg-gray-100 ${i === 1 ? 'rounded-tr-2xl' : i === 4 ? 'rounded-br-2xl' : ''}`}>
            {allPhotos[i]
              ? <Image src={allPhotos[i]} alt="" fill className="object-cover" />
              : <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-200" />}
            {i === 4 && allPhotos.length > 1 && (
              <button type="button" className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/90 text-[12px] font-semibold text-gray-800 shadow backdrop-blur-sm">
                <Grid2x2 className="w-3.5 h-3.5" /> Show all photos
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ── Photo (mobile) ── */}
      <div className="md:hidden relative w-full aspect-video bg-gray-100">
        {allPhotos[0]
          ? <Image src={allPhotos[0]} alt={store.name} fill className="object-cover" priority />
          : <div className="w-full h-full bg-linear-to-br from-brand/20 to-purple-100" />}
        <Link href="/stores" className="absolute top-4 left-4 z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/90 shadow" aria-label="Back">
          <Navigation className="w-4 h-4 text-gray-800 rotate-225" />
        </Link>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-4 md:px-6 pt-4 md:pt-5">

        {/* Breadcrumb */}
        <nav className="hidden md:flex items-center gap-1.5 mb-3 text-[13px] text-gray-400">
          <Link href="/stores" className="hover:text-gray-600 transition-colors">Stores</Link>
          {store.category && <><span>/</span><span className="hover:text-gray-600">{store.category}</span></>}
          <span>/</span>
          <span className="text-gray-700 font-medium">{store.name}</span>
        </nav>

        {/* Logo + name */}
        <div className="flex items-start gap-4 mb-3">
          {store.logo_url && (
            <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 shadow-sm border border-gray-200">
              <Image src={store.logo_url} alt={store.name} fill className="object-contain p-1" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-[36px] font-bold text-gray-900 leading-tight">{store.name}</h1>
            {store.description && <p className="text-[13px] text-gray-400 mt-0.5 line-clamp-2">{store.description}</p>}
          </div>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-3">
          {categoriesList.length > 0 && (
            <><span className="text-gray-300">|</span><span className="text-[13px] text-gray-500">{categoriesList.join(' · ')}</span></>
          )}
          {hoursToday && (
            <><span className="text-gray-300">|</span>
            <span className="flex items-center gap-1 text-[13px]">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-green-600 font-semibold">Open</span>
              <span className="text-gray-500">· {hoursToday}</span>
            </span></>
          )}
        </div>

        {/* Address */}
        {(store.address_line1 ?? store.location_name) && (
          <div className="flex items-start gap-1.5 mb-4">
            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <span className="text-[13px] text-gray-600">
              {store.address_line1 ?? `${store.location_name}, ${store.city}`}
            </span>
          </div>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {tags.map(t => (
              <span key={t.tag_value} className="px-2.5 py-0.5 rounded-full bg-gray-100 text-[11px] font-medium text-gray-600 capitalize">
                {t.tag_value}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 mb-8">
          <button type="button" className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <Navigation className="w-3.5 h-3.5" /> Directions
          </button>
          <button type="button" className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          {store.phone && (
            <a href={`tel:${store.phone}`} className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <Phone className="w-3.5 h-3.5" /> Call
            </a>
          )}
          {store.whatsapp && (
            <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </a>
          )}
          {store.website && (
            <a href={store.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              <Globe className="w-3.5 h-3.5" /> Website
            </a>
          )}
          <button type="button" className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-200 text-[13px] font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
            <Heart className="w-3.5 h-3.5" /> Save
          </button>
        </div>

        {/* Opening hours table */}
        {hours.length > 0 && (
          <section className="mb-8 border-t border-gray-100 pt-6">
            <h2 className="text-[18px] font-bold text-gray-900 mb-3">Opening Hours</h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {hours.map(h => (
                <div key={h.day_of_week} className="flex justify-between text-[13px]">
                  <span className="font-medium text-gray-700">{DAY_NAMES[h.day_of_week]}</span>
                  {h.is_closed
                    ? <span className="text-red-500">Closed</span>
                    : <span className="text-gray-500">{formatTime(h.open_time)} – {formatTime(h.close_time)}</span>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Offers */}
        {offers.length > 0 && (
          <section className="mb-8 border-t border-gray-100 pt-6">
            <h2 className="text-[18px] font-bold text-gray-900 mb-4">Offers</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 pb-1">
              {offers.map(offer => (
                <div key={offer.id} className="shrink-0 w-64 flex items-start gap-3 p-3.5 rounded-2xl border border-gray-200">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                    <Tag className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-900 leading-tight">{offer.title}</p>
                    {offer.description && <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{offer.description}</p>}
                    {offer.code && (
                      <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-gray-100 text-[10px] font-bold text-gray-600 tracking-widest">{offer.code}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Catalogue */}
        {itemsByCategory.length > 0 && (
          <section className="mb-8 border-t border-gray-100 pt-6">
            <h2 className="text-[18px] font-bold text-gray-900 mb-1">Catalogue</h2>
            {itemsByCategory.map(cat => (
              <div key={cat.id} className="mt-6">
                <h3 className="text-[15px] font-bold text-gray-800 mb-3">{cat.title}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {cat.items.map(item => (
                    <div key={item.id} className="rounded-2xl border border-gray-100 overflow-hidden bg-white shadow-sm">
                      <div className="relative w-full aspect-square bg-gray-100">
                        {item.image_url
                          ? <Image src={item.image_url} alt={item.title ?? ''} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                          : <div className="w-full h-full bg-linear-to-br from-gray-100 to-gray-200" />}
                      </div>
                      {(item.title ?? item.price) && (
                        <div className="p-2.5">
                          {item.title && <p className="text-[12px] font-bold text-gray-900 truncate">{item.title}</p>}
                          {item.description && <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{item.description}</p>}
                          {item.price != null && (
                            <p className="text-[13px] font-bold text-gray-900 mt-1">₹{item.price.toLocaleString()}</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}

      </div>
    </main>
  )
}
