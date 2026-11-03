'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { ChevronDown, MapPin, Navigation, Phone } from 'lucide-react'
import { HScroll } from '@/components/sections/home/HScroll'
import { MerchantCard } from '@/components/sections/home/MerchantCard'
import { FeedRestaurantCard } from '@/components/sections/dining/FeedRestaurantCard'
import { useUserPlan } from '@/lib/context/PlanContext'
import { getCardBadge } from '@/lib/cashback'
import { MALL_AMENITY_LABELS, mallAmenityKeys, mallOpenStatus, weeklyHours, type Mall } from '@/lib/malls'
import type { MallPlaces, MallStore } from '@/lib/services/malls'
import { cn, formatDistanceKm } from '@/lib/utils'
import { AMENITY_ICONS } from './amenityIcons'

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'dining', label: 'Dining' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'wellness', label: 'Wellness' },
] as const
type Category = (typeof CATEGORIES)[number]['key']

const chip = (active: boolean) =>
  cn('shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors', active ? 'border-brand bg-brand text-white' : 'border-gray-200 text-gray-700 hover:bg-gray-50')

function StoreCard({ store, base }: { store: MallStore; base: 'stores' | 'wellness' }) {
  const plan = useUserPlan()
  const meta = [store.floor ? `Floor ${store.floor}` : null, store.location_name ?? store.city].filter(Boolean).join(' • ')
  return (
    <MerchantCard
      href={`/${base}/${store.slug ?? store.id}`}
      saveId={store.id}
      saveType='STORE'
      image={store.cover_image ?? store.logo_url}
      name={store.name}
      meta={meta || undefined}
      tagline={[store.category, store.subcategory].filter(Boolean).join(', ') || undefined}
      offerLabel={store.store_offers?.[0]?.badge_text ?? undefined}
      cardBadge={getCardBadge(store, plan)}
    />
  )
}

function StoreRail({ title, stores, base }: { title: string; stores: MallStore[]; base: 'stores' | 'wellness' }) {
  if (!stores.length) return null
  return <HScroll title={title}>{stores.map(s => <StoreCard key={s.id} store={s} base={base} />)}</HScroll>
}

function Grid({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className='mx-auto max-w-7xl px-4 py-6 md:px-8'>
      <h2 className='mb-4 text-[19px] font-bold text-[#0D141C] md:text-[22px] 2xl:text-[26px]'>{title}</h2>
      <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>{children}</div>
    </section>
  )
}

/** One mall and what's inside it — app parity: screens/MallDetails.jsx. */
export function MallDetailClient({ mall, places }: { mall: Mall; places: MallPlaces }) {
  const [category, setCategory] = useState<Category>('all')
  const [floor, setFloor] = useState('All')
  const [showHours, setShowHours] = useState(false)
  const status = useMemo(() => mallOpenStatus(mall.opening_hours), [mall.opening_hours])
  const hours = weeklyHours(mall.opening_hours)
  const amenities = mallAmenityKeys(mall)

  const floors = useMemo(() => {
    const set = new Set([...places.shopping, ...places.wellness].map(s => s.floor).filter((f): f is string => !!f))
    return set.size ? ['All', ...set] : []
  }, [places])

  const byFloor = (list: MallStore[]) => (floor === 'All' ? list : list.filter(s => s.floor === floor))
  const shopping = byFloor(places.shopping)
  const wellness = byFloor(places.wellness)
  const dining = floor === 'All' ? places.dining : []
  const tabs = CATEGORIES.filter(c => c.key === 'all' || places[c.key].length)
  const meta = [formatDistanceKm(mall.distance), mall.location_name ?? mall.city].filter(Boolean).join(' • ')

  const query = mall.lat != null && mall.lng != null ? `${mall.lat},${mall.lng}` : mall.name
  const placeId = mall.google_place_id ? `&query_place_id=${encodeURIComponent(mall.google_place_id)}` : ''
  const directions = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}${placeId}`
  const image = mall.cover_image ?? mall.logo_url
  const nothing = !places.dining.length && !places.shopping.length && !places.wellness.length

  return (
    <main className='min-h-screen bg-white pb-16'>
      <div className='relative left-1/2 h-64 w-screen -translate-x-1/2 bg-gray-100 md:h-96'>
        {image && <Image src={image} alt={mall.name} fill priority className='object-cover' sizes='100vw' />}
      </div>

      <div className='mx-auto max-w-7xl px-4 pt-6 md:px-8'>
        <h1 className='text-2xl font-bold text-[#2C2D32] md:text-3xl'>{mall.name}</h1>
        {meta && (
          <p className='mt-1.5 flex items-center gap-1.5 text-sm text-[#6B6B6B]'>
            <MapPin className='size-4 shrink-0 text-brand' /> {meta}
          </p>
        )}
        {status && (
          <button type='button' onClick={() => setShowHours(o => !o)} aria-expanded={showHours} className='mt-2 flex items-center gap-1.5 text-sm'>
            <span className={cn('font-semibold', status.open ? 'text-green-600' : 'text-red-600')}>{status.open ? 'Open' : 'Closed'}</span>
            <span className='text-[#6B6B6B]'>{status.label}</span>
            <ChevronDown className={cn('size-4 text-[#6B6B6B] transition-transform', showHours && 'rotate-180')} />
          </button>
        )}
        {showHours && (
          <dl className='mt-2 max-w-xs text-sm'>
            {hours.map(row => (
              <div key={row.day} className='flex justify-between py-1'>
                <dt className='text-[#6B6B6B]'>{row.day}</dt>
                <dd className='font-medium text-[#2C2D32]'>{row.text}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className='mt-4 flex flex-wrap gap-3'>
          <a href={directions} target='_blank' rel='noreferrer' className='flex h-10 items-center gap-2 rounded-full border border-gray-200 px-4 text-sm font-semibold text-[#2C2D32] hover:bg-gray-50'>
            <Navigation className='size-4 text-brand' /> Directions
          </a>
          {mall.phone && (
            <a href={`tel:${mall.phone}`} className='flex h-10 items-center gap-2 rounded-full border border-gray-200 px-4 text-sm font-semibold text-[#2C2D32] hover:bg-gray-50'>
              <Phone className='size-4 text-brand' /> Call
            </a>
          )}
        </div>
        {mall.description && <p className='mt-4 max-w-3xl text-sm leading-6 text-[#424144]'>{mall.description}</p>}
        {amenities.length > 0 && (
          <div className='mt-4 flex flex-wrap gap-x-5 gap-y-2'>
            {amenities.map(key => {
              const Icon = AMENITY_ICONS[key]
              return (
                <span key={key} className='flex items-center gap-1.5 text-sm text-[#424144]'>
                  <Icon className='size-4 text-brand' /> {MALL_AMENITY_LABELS[key]}
                </span>
              )
            })}
          </div>
        )}

        {!nothing && (
          <div className='scrollbar-hide mt-6 flex gap-2 overflow-x-auto'>
            {tabs.map(tab => (
              <button key={tab.key} type='button' onClick={() => setCategory(tab.key)} className={chip(tab.key === category)}>
                {tab.key === 'all' ? tab.label : `${tab.label} (${places[tab.key].length})`}
              </button>
            ))}
          </div>
        )}
        {floors.length > 0 && (
          <div className='scrollbar-hide mt-3 flex items-center gap-2 overflow-x-auto'>
            <span className='shrink-0 text-sm font-medium text-[#6B6B6B]'>Floor</span>
            {floors.map(f => (
              <button key={f} type='button' onClick={() => setFloor(f)} className={chip(f === floor)}>{f}</button>
            ))}
          </div>
        )}
      </div>

      {nothing && <p className='mx-auto max-w-7xl px-4 py-10 text-sm text-[#6B6B6B] md:px-8'>No places listed at this mall yet.</p>}

      {category === 'all' ? (
        <>
          {dining.length > 0 && <HScroll title='New Eateries'>{dining.map(r => <FeedRestaurantCard key={r.id} r={r} />)}</HScroll>}
          <StoreRail title='Spa near you' stores={wellness} base='wellness' />
          <StoreRail title='Discover top brands' stores={shopping.filter(s => s.is_top_brand)} base='stores' />
          {shopping.length > 0 && <Grid title='Shop and shine'>{shopping.map(s => <StoreCard key={s.id} store={s} base='stores' />)}</Grid>}
        </>
      ) : category === 'dining' ? (
        dining.length > 0 && <Grid title={`All in dining at ${mall.name}`}>{dining.map(r => <FeedRestaurantCard key={r.id} r={r} />)}</Grid>
      ) : (
        <Grid title={`All in ${category} at ${mall.name}`}>
          {(category === 'shopping' ? shopping : wellness).map(s => <StoreCard key={s.id} store={s} base={category === 'shopping' ? 'stores' : 'wellness'} />)}
        </Grid>
      )}
    </main>
  )
}
