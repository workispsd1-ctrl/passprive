import Link from 'next/link'
import Image from 'next/image'
import { MapPin, ShieldCheck, Star, Building2, Flame } from 'lucide-react'
import {
  driveMinutes,
  formatRs,
  getTouristPricing,
  placeImageUrl,
  prettyTag,
  priceBand,
  type DayPlan,
  type PlaceWithDistance,
} from '@/lib/touristCatalog'

// App parity: components/Home/TouristExperiences.jsx (krittika branch).
export const ACCENT = '#F0592A'

export const placeHref = (p: PlaceWithDistance) => `/tourist/${p.slug ?? p.id}`

const metaLine = (p: PlaceWithDistance) =>
  [String(p.area || p.city || '').trim(), driveMinutes(p._distanceKm)].filter(Boolean).join(' • ')

function Photo({ src, alt, sizes }: { src: string | null; alt: string; sizes: string }) {
  return src ? (
    <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-gray-100">
      <MapPin className="h-7 w-7 text-[#9B969D]" />
    </div>
  )
}

function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute left-2.5 top-2.5 z-10 max-w-[70%] truncate rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[#1F1F1F] shadow-sm">
      {children}
    </span>
  )
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 truncate rounded-full bg-brand-tint px-2 py-0.5 text-[11px] font-medium text-[#C2410C]">
      {children}
    </span>
  )
}

function RatingPill({ rating }: { rating: number | null | undefined }) {
  const r = Number(rating)
  if (!r) return null
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-[#1E8A3E] px-1.5 py-0.5 text-[11px] font-semibold text-white">
      {r.toFixed(1)}
      <Star className="h-2.5 w-2.5 fill-white text-white" />
    </span>
  )
}

/** "Curated Local Experiences" card — local price vs tourist price. */
export function CuratedCard({ place }: { place: PlaceWithDistance }) {
  const { price, was } = getTouristPricing(place)
  const meta = metaLine(place)
  const chips = (place.tags ?? []).slice(0, 2).map(prettyTag)

  return (
    <Link
      href={placeHref(place)}
      className="flex w-62.5 shrink-0 flex-col overflow-hidden rounded-[18px] bg-white p-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-md"
    >
      <div className="relative h-44 overflow-hidden rounded-xl">
        <Photo src={placeImageUrl(place)} alt={place.place_name} sizes="250px" />
        {place.ad_badge_text && <TagPill>{place.ad_badge_text}</TagPill>}
        <span className="absolute bottom-2.5 left-2.5 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-[#1E8A3E]">
          <ShieldCheck className="h-3 w-3" />
          Verified Local Price
        </span>
      </div>

      <div className="flex flex-1 flex-col px-1.5 pt-2.5 pb-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[15px] font-bold text-[#0D141C]">{place.place_name}</p>
          <RatingPill rating={place.rating} />
        </div>
        {meta && <p className="mt-0.5 truncate text-[12px] text-gray-500">{meta}</p>}
        {place.description && (
          <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-gray-600">{place.description.trim()}</p>
        )}

        <div className="mt-2">
          {price > 0 ? (
            <>
              <p className="flex items-baseline gap-1.5">
                <span className="text-[15px] font-bold" style={{ color: ACCENT }}>{formatRs(price)}</span>
                {was && <span className="text-[12px] text-gray-400 line-through">{formatRs(was)}</span>}
              </p>
              {was && <p className="text-[11px] text-gray-500">You save with PassPrivé</p>}
            </>
          ) : (
            <p className="text-[15px] font-bold text-[#1E8A3E]">Free Entry</p>
          )}
        </div>

        {chips.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {chips.map((c) => <Chip key={c}>{c}</Chip>)}
          </div>
        )}
      </div>
    </Link>
  )
}

/** Weather picks / Packages and tours card. */
export function CompactPlaceCard({ place, category }: { place: PlaceWithDistance; category: string | null }) {
  const meta = metaLine(place)

  return (
    <Link
      href={placeHref(place)}
      className="flex w-62.5 shrink-0 flex-col overflow-hidden rounded-[18px] bg-white p-2 shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-md"
    >
      <div className="relative h-44 overflow-hidden rounded-xl">
        <Photo src={placeImageUrl(place)} alt={place.place_name} sizes="250px" />
        {place.ad_badge_text && <TagPill>{place.ad_badge_text}</TagPill>}
      </div>
      <div className="px-1.5 pt-2.5 pb-1">
        <p className="truncate text-[15px] font-bold text-[#0D141C]">{place.place_name}</p>
        {meta && <p className="mt-0.5 truncate text-[13px] text-gray-500">{meta}</p>}
        {place.description && (
          <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-gray-600">{place.description.trim()}</p>
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {category && (
            <Chip>
              <Building2 className="h-3 w-3 shrink-0" style={{ color: ACCENT }} />
              {category}
            </Chip>
          )}
          <Chip>
            <Flame className="h-3 w-3 shrink-0" style={{ color: ACCENT }} />
            {priceBand(place)}
          </Chip>
        </div>
      </div>
    </Link>
  )
}

/** "Plan one full day" circle card — tapping filters the page to its stops. */
export function DayPlanCard({
  plan,
  trending,
  selected,
  onSelect,
}: {
  plan: DayPlan
  trending: boolean
  selected: boolean
  onSelect: (plan: DayPlan) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(plan)}
      aria-pressed={selected}
      className="flex w-40 shrink-0 flex-col items-center text-center md:w-44"
    >
      <div
        className={`relative h-40 w-40 overflow-hidden rounded-full border-4 shadow-[0_4px_10px_rgba(0,0,0,0.12)] md:h-44 md:w-44 ${
          selected ? 'border-[#F0592A]' : 'border-white'
        }`}
      >
        <Photo src={plan.coverImage} alt={plan.title} sizes="176px" />
      </div>
      <p className="mt-3 w-full truncate text-[14px] font-bold text-[#0D141C]">{plan.title}</p>
      <p className="mt-0.5 w-full truncate text-[12px] text-gray-500">
        {plan.entryTotal > 0 ? `From ${formatRs(plan.entryTotal)} / guest` : 'Free entry at every stop'}
      </p>
      <p className="mt-0.5 line-clamp-2 w-full text-[11px] text-gray-400">{plan.stopNames.join(', ')}</p>
      {trending && (
        <span className="mt-1.5 rounded-full bg-brand-tint px-2 py-0.5 text-[10px] font-semibold" style={{ color: ACCENT }}>
          Trending
        </span>
      )}
    </button>
  )
}

/** Full-width live ad for one advertised place. */
export function TouristAdBanner({ place }: { place: PlaceWithDistance }) {
  const { price } = getTouristPricing(place)
  const subtitle = [place.ad_badge_text, price > 0 ? `Book Now from ${formatRs(price)}` : 'Book Now']
    .filter(Boolean)
    .join(' • ')

  return (
    <div className="mx-auto max-w-7xl px-4 py-4 md:px-8">
      <Link
        href={placeHref(place)}
        aria-label={`Advertisement: ${place.place_name}`}
        className="relative block h-32 overflow-hidden rounded-2xl md:h-40"
      >
        <Photo src={placeImageUrl(place)} alt={place.place_name} sizes="(max-width: 1280px) 100vw, 1280px" />
        <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/35 to-transparent" />
        <span className="absolute left-3 top-2.5 rounded bg-black/40 px-1.5 py-0.5 text-[9px] font-bold tracking-wider text-white">
          AD
        </span>
        <div className="absolute inset-y-0 left-6 flex flex-col justify-center text-white md:left-10">
          <p className="truncate text-[18px] font-bold tracking-wide uppercase md:text-[24px]">{place.place_name}</p>
          <p className="mt-1 truncate text-[12px] text-white/85 md:text-[14px]">{subtitle}</p>
        </div>
      </Link>
    </div>
  )
}
