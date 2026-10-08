'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import { HScroll } from '@/components/sections/home/HScroll'
import {
  WEATHER_SUBTITLE,
  buildDayPlans,
  scopeNearby,
  classifyWeather,
  pickAdPlace,
  pickCuratedPlaces,
  pickPackages,
  pickWeatherPlaces,
  placeMatchesCategory,
  primaryCategoryLabel,
  type DayPlan,
  type PlaceWithDistance,
  type TouristCategory,
  type Weather,
} from '@/lib/touristCatalog'
import { ACCENT, CompactPlaceCard, CuratedCard, DayPlanCard, TouristAdBanner } from './TouristCards'

// Mauritius centre — the app's weather fallback when the visitor has no location.
const MAURITIUS_CENTRE = { lat: -20.25, lng: 57.55 }
const round1 = (n: number) => Math.round(n * 10) / 10

function useWeather(coords: { lat: number; lng: number } | null): Weather {
  const [kind, setKind] = useState<Weather>('unknown')
  const lat = round1(coords?.lat ?? MAURITIUS_CENTRE.lat)
  const lng = round1(coords?.lng ?? MAURITIUS_CENTRE.lng)
  useEffect(() => {
    const ctrl = new AbortController()
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=weather_code,precipitation&timezone=auto`,
      { signal: ctrl.signal },
    )
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setKind(classifyWeather(json?.current)))
      .catch(() => {})
    return () => ctrl.abort()
  }, [lat, lng])
  return kind
}

type Filter = { key: string; label: string; test: (p: PlaceWithDistance) => boolean }

/**
 * Tourist home body — app parity: components/Home/TouristHome.jsx (krittika
 * branch). Every rail picks from the same distance-annotated place list.
 * `nearMe` is the server-rendered "Near me now" restaurant rail, slotted in
 * the app's position between the ad and the weather picks. `houseAd` fills
 * the ad slot when no tourist place is currently advertised.
 */
export function TouristHomeClient({
  places,
  categories,
  coords,
  nearMe,
  exploreArea,
  houseAd,
}: {
  places: PlaceWithDistance[]
  categories: TouristCategory[]
  coords: { lat: number; lng: number } | null
  nearMe: React.ReactNode
  exploreArea: React.ReactNode
  houseAd?: React.ReactNode
}) {
  const weather = useWeather(coords)
  const [filter, setFilter] = useState<Filter | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const curated = useMemo(() => pickCuratedPlaces(places), [places])
  const ad = useMemo(() => pickAdPlace(places), [places])
  const weatherPicks = useMemo(() => pickWeatherPlaces(places, weather), [places, weather])
  const plans = useMemo(() => buildDayPlans(places), [places])
  const packages = useMemo(() => pickPackages(places), [places])
  const results = useMemo(
    () => (filter ? scopeNearby(places.filter(filter.test)) : []),
    [places, filter],
  )

  const applyFilter = useCallback((next: Filter) => {
    setFilter((cur) => (cur?.key === next.key ? null : next))
    requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [])

  const onCategory = useCallback(
    (c: TouristCategory) => applyFilter({ key: c.key, label: c.label, test: (p) => placeMatchesCategory(p, c) }),
    [applyFilter],
  )

  const onPlan = useCallback(
    (plan: DayPlan) => {
      const ids = new Set(plan.stopIds)
      applyFilter({ key: `plan:${plan.key}`, label: plan.title, test: (p) => ids.has(p.id) })
    },
    [applyFilter],
  )

  const categoryOf = (p: PlaceWithDistance) => primaryCategoryLabel(p, categories)

  return (
    <>
      <HScroll title="Browse by Category" gapClassName="gap-3 md:gap-4">
        {categories.map((c) => {
          const selected = filter?.key === c.key
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => onCategory(c)}
              aria-pressed={selected}
              className={`flex w-28 shrink-0 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] ring-2 transition md:w-32 ${
                selected ? 'ring-[#F0592A]' : 'ring-transparent hover:shadow-md'
              }`}
            >
              <div className="relative h-24 w-full md:h-28">
                {c.imageUrl ? (
                  <Image src={c.imageUrl} alt="" fill sizes="128px" className="object-contain p-2" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <MapPin className="h-8 w-8" style={{ color: ACCENT }} />
                  </div>
                )}
              </div>
              <span
                className="flex min-h-10 items-center justify-center px-1.5 py-1.5 text-center text-[12px] font-semibold leading-tight text-white"
                style={{ backgroundColor: ACCENT }}
              >
                {c.label}
              </span>
            </button>
          )
        })}
      </HScroll>

      <div ref={resultsRef} className="scroll-mt-24">
        {filter && (
          <section className="mx-auto max-w-7xl px-4 py-4 md:px-8">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="truncate font-(family-name:--font-dm-sans) text-[19px] font-bold text-[#0D141C] md:text-[20px]">
                {filter.label}
              </h3>
              <button
                type="button"
                onClick={() => setFilter(null)}
                className="shrink-0 rounded-full border border-[#F0592A] px-3 py-1 text-[12px] font-semibold"
                style={{ color: ACCENT }}
              >
                Clear
              </button>
            </div>
            {results.length ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] justify-items-center gap-4">
                {results.map((p) => (
                  <CompactPlaceCard key={p.id} place={p} category={categoryOf(p)} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-14 text-center">
                <p className="font-semibold text-gray-800">No tourist places found</p>
                <p className="mt-1 text-[13px] text-gray-500">Try another category or clear the filter.</p>
              </div>
            )}
          </section>
        )}
      </div>

      {curated.length > 0 && (
        <HScroll title="Curated Local Experiences" subtitle="Avoid inflated tourist traps. Vetted operators only.">
          {curated.map((p) => (
            <CuratedCard key={p.id} place={p} />
          ))}
        </HScroll>
      )}

      {ad ? <TouristAdBanner place={ad} /> : houseAd}

      {nearMe}

      {weatherPicks.length > 0 && (
        <HScroll title="Perfect for today’s weather" subtitle={WEATHER_SUBTITLE[weather]}>
          {weatherPicks.map((p) => (
            <CompactPlaceCard key={p.id} place={p} category={categoryOf(p)} />
          ))}
        </HScroll>
      )}

      {plans.length > 0 && (
        <HScroll
          title="Plan one full day"
          subtitle="Stops close together • Top-rated in each region • Low travel friction"
          gapClassName="gap-5"
        >
          {plans.map((plan, i) => (
            <DayPlanCard
              key={plan.key}
              plan={plan}
              trending={i === 0}
              selected={filter?.key === `plan:${plan.key}`}
              onSelect={onPlan}
            />
          ))}
        </HScroll>
      )}

      {exploreArea}

      {packages.length > 0 && (
        <HScroll title="Packages and tours">
          {packages.map((p) => (
            <CompactPlaceCard key={p.id} place={p} category={categoryOf(p)} />
          ))}
        </HScroll>
      )}
    </>
  )
}
