import { MAX_NEARBY_KM, NEARBY_KM as SHARED_NEARBY_KM } from '@/lib/nearby'
// Pure helpers for the tourist home: category matching, distance scoping,
// curated / ad / weather / package picks and day-plan grouping.
// Ported from the app's utils/touristCatalog.js (krittika branch) — keep the
// two in step; the app's __tests__/touristCatalog.test.js covers the rules.

import type { TouristPlace } from '@/lib/types/touristPlaces'

export type PlaceWithDistance = TouristPlace & { _distanceKm: number | null }

export type TouristCategory = {
  key: string
  slug: string
  label: string
  imageUrl: string | null
  tags: string[]
  keywords: string[]
}

export type TouristMoodCategoryRow = {
  key: string
  slug: string
  title: string
  light_theme_image_url: string | null
  dark_theme_image_url: string | null
  sort_order: number | null
}

export type Weather = 'rainy' | 'sunny' | 'cloudy' | 'unknown'

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const norm = (v: unknown) =>
  String(v || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()

const placeTags = (place: TouristPlace) =>
  (Array.isArray(place?.tags) ? place.tags : []).map((t) => norm(t).trim()).filter(Boolean)

const nameText = (place: TouristPlace) => norm(place?.place_name)

const matchesAny = (haystack: string, keywords: string[]) =>
  keywords.some((k) => haystack.includes(norm(k)))

// ---- Images ----------------------------------------------------------------

// `picture_id` / `cover_image` hold either a full URL or a path inside the
// public `tourist-images` bucket (e.g. "cover/<id>/<file>.jpg").
export function touristImageUrl(path: string | null | undefined): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tourist-images/${path}`
}

export const placeImageUrl = (p: TouristPlace) => touristImageUrl(p.cover_image || p.picture_id)

const hasImage = (p: TouristPlace) => !!(p?.picture_id || p?.cover_image)

// ---- Categories ------------------------------------------------------------

// Fallback list when tourist_mood_categories is unreachable, and the source of
// each row's tag/keyword matching rules (matched by slug). Admin tags are
// authoritative, typos included ('thrills & advantures', 'teaste mauritius').
export const DEFAULT_TOURIST_CATEGORIES: TouristCategory[] = [
  { key: 'wild', slug: 'wild-mauritius', label: 'Wild Mauritius', imageUrl: null, tags: ['wild mauritius'], keywords: ['nature park', 'forest', 'reserve', 'gorges', 'aigrettes', 'safari', 'dolphin'] },
  { key: 'thrills', slug: 'thrills-adventure', label: 'Thrills & Adventure', imageUrl: null, tags: ['thrills & advantures', 'thrills & adventures', 'thrills & adventure'], keywords: ['skydive', 'zipline', 'kite', 'adventure', 'advenature', 'loisirs', 'aquaventure'] },
  { key: 'ocean', slug: 'ocean-islands', label: 'Ocean & Islands', imageUrl: null, tags: ['ocean & islands'], keywords: ['catamaran', 'cruise', 'croisiere', 'island', 'ile aux', 'marine', 'oceanarium', 'blue safari', 'sirena'] },
  { key: 'beach', slug: 'beach-finder', label: 'Beach Finder', imageUrl: null, tags: ['beach finder'], keywords: ['beach', 'plage'] },
  { key: 'peaks', slug: 'peaks-parks-falls', label: 'Peaks, Parks & Falls', imageUrl: null, tags: ['natural wonder'], keywords: ['falls', 'cascade', 'waterfall', 'viewpoint', 'national park', 'garden', 'geopark'] },
  { key: 'stories', slug: 'mauritius-stories', label: 'Mauritius Stories', imageUrl: null, tags: ['mauritius stories', 'museum finder'], keywords: ['museum', 'heritage', 'cultural', 'citadelle', 'slavery'] },
  { key: 'taste', slug: 'taste-mauritius', label: 'Taste Mauritius', imageUrl: null, tags: ['teaste mauritius', 'taste mauritius', 'winery'], keywords: ['rum', 'rhumerie', 'distiller', 'tea factory', 'winery', 'sucre'] },
  { key: 'golf', slug: 'golf-premium-play', label: 'Golf & Premium Play', imageUrl: null, tags: ['golf and leisure', 'golf & leisure'], keywords: ['golf'] },
  { key: 'markets', slug: 'markets-local-finds', label: 'Markets & Local Finds', imageUrl: null, tags: ['local finders', 'local finds'], keywords: ['market', 'waterfront', 'boulevard', 'croisette', 'mall', 'craft'] },
]

const DEFAULT_BY_SLUG = new Map(DEFAULT_TOURIST_CATEGORIES.map((c) => [c.slug, c]))
const DEFAULT_BY_TITLE = new Map(DEFAULT_TOURIST_CATEGORIES.map((c) => [norm(c.label).trim(), c]))

export function categoryFromRow(row: TouristMoodCategoryRow): TouristCategory | null {
  const slug = String(row?.slug || '').trim().toLowerCase()
  const label = String(row?.title || '').trim()
  if (!slug || !label) return null
  const builtIn = DEFAULT_BY_SLUG.get(slug) || DEFAULT_BY_TITLE.get(norm(label).trim()) || null
  const titleTag = norm(label).trim()
  const tags = builtIn?.tags ?? []
  return {
    key: builtIn?.key || slug,
    slug,
    label,
    imageUrl: row.light_theme_image_url || row.dark_theme_image_url || null,
    // a category added later matches places tagged with its own title
    tags: tags.includes(titleTag) ? tags : [...tags, titleTag],
    keywords: builtIn?.keywords ?? [],
  }
}

export function categoriesFromRows(rows: TouristMoodCategoryRow[] | null | undefined) {
  const list = (rows ?? []).map(categoryFromRow).filter((c): c is TouristCategory => c != null)
  return list.length ? list : DEFAULT_TOURIST_CATEGORIES
}

export function placeMatchesCategory(place: TouristPlace, category: TouristCategory | null) {
  if (!category) return true
  const tags = placeTags(place)
  if (tags.length) return category.tags.some((t) => tags.includes(norm(t)))
  return matchesAny(nameText(place), category.keywords)
}

export function primaryCategoryLabel(place: TouristPlace, categories: TouristCategory[]) {
  return categories.find((c) => placeMatchesCategory(place, c))?.label ?? null
}

// ---- Price -----------------------------------------------------------------

export const formatRs = (value: number) => `Rs. ${Math.round(value).toLocaleString('en-US')}`

// Local (resident) price is what PassPrivé guarantees; the tourist price is
// shown struck through only when it is genuinely higher.
export function getTouristPricing(place: TouristPlace): { price: number; was: number | null } {
  const tourist = toNum(place?.price)
  const local = toNum(place?.price_local_adult)
  if (local != null && tourist != null && local > 0 && local < tourist) return { price: local, was: tourist }
  if (tourist != null && tourist > 0) return { price: tourist, was: null }
  return { price: 0, was: null }
}

export function priceBand(place: TouristPlace) {
  const price = toNum(place?.price_local_adult) ?? toNum(place?.price)
  if (!price) return 'Free'
  if (price < 1000) return 'Under Rs. 1k'
  if (price <= 2000) return 'Rs. 1-2k'
  if (price <= 5000) return 'Rs. 2-5k'
  return 'Rs. 5k+'
}

// Admin-entered tags carry a known typo; fixed for display only.
const TAG_FIXES: Record<string, string> = { 'thrills & advantures': 'thrills & adventures' }

export function prettyTag(tag: string) {
  const raw = String(tag || '').trim().toLowerCase()
  return (TAG_FIXES[raw] || raw).replace(/\b\w/g, (c) => c.toUpperCase())
}

const AVG_DRIVE_KMH = 40

export function driveMinutes(km: number | null) {
  if (km == null) return null
  const mins = Math.max(5, Math.round(((km / AVG_DRIVE_KMH) * 60) / 5) * 5)
  return mins >= 60 ? `~${Math.round((mins / 60) * 10) / 10} hr` : `~${mins} min`
}

// ---- Weather (Open-Meteo WMO codes) ----------------------------------------

export function classifyWeather(current: { weather_code?: unknown; precipitation?: unknown } | null | undefined): Weather {
  const code = toNum(current?.weather_code)
  const rain = toNum(current?.precipitation) || 0
  if (code == null) return 'unknown'
  if (rain > 0.2 || (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return 'rainy'
  if (code <= 1) return 'sunny'
  return 'cloudy'
}

export const WEATHER_SUBTITLE: Record<Weather, string> = {
  rainy: 'Rainy-day ideas',
  sunny: 'Sunny-day ideas',
  cloudy: 'Cloudy-day ideas',
  unknown: 'Ideas for today',
}

type Rule = { tags: string[]; keywords: string[] }

const WEATHER_RULES: Record<Exclude<Weather, 'unknown'>, Rule> = {
  rainy: {
    tags: ['museum finder', 'teaste mauritius', 'winery'],
    keywords: ['museum', 'oceanarium', 'sucre', 'rhumerie', 'distiller', 'tea factory', 'winery', 'mall', 'market', 'waterfront', 'citadelle', 'aapravasi'],
  },
  sunny: {
    tags: ['beach finder', 'ocean & islands'],
    keywords: ['beach', 'island', 'ile aux', 'catamaran', 'cruise', 'croisiere', 'marine', 'dolphin', 'kite', 'blue safari'],
  },
  cloudy: {
    tags: ['natural wonder', 'wild mauritius', 'thrills & advantures'],
    keywords: ['falls', 'cascade', 'garden', 'nature park', 'forest', 'gorges', 'viewpoint', 'geopark', 'adventure', 'advenature', 'zipline'],
  },
}

const ruleFor = (weather: Weather): Rule =>
  weather === 'unknown'
    ? {
        tags: [...WEATHER_RULES.cloudy.tags, ...WEATHER_RULES.sunny.tags],
        keywords: [...WEATHER_RULES.cloudy.keywords, ...WEATHER_RULES.sunny.keywords],
      }
    : WEATHER_RULES[weather]

const matchesRule = (place: TouristPlace, rule: Rule) =>
  placeTags(place).some((t) => rule.tags.includes(t)) || matchesAny(nameText(place), rule.keywords)

// ---- Distance scoping -------------------------------------------------------
// The tourist page trims its place list to the shared 3–5 km radius
// (lib/nearby) before any rail sees it; these helpers re-apply the same rule
// to each rail's subset. Live ads within reach go first.

export const NEARBY_KM = SHARED_NEARBY_KM
export const MAX_KM = MAX_NEARBY_KM
export const PROMOTED_KM = MAX_KM

const byRating = (a: TouristPlace, b: TouristPlace) =>
  (toNum(b?.rating) || 0) - (toNum(a?.rating) || 0) ||
  (toNum(b?.reviews_count) || 0) - (toNum(a?.reviews_count) || 0)

export function withDistances(
  places: TouristPlace[],
  coords: { lat: number; lng: number } | null,
  distanceKm: (lat1: number, lng1: number, lat2: number, lng2: number) => number,
): PlaceWithDistance[] {
  return places.map((p) => {
    const lat = toNum(p.latitude)
    const lng = toNum(p.longitude)
    return {
      ...p,
      _distanceKm: coords && lat != null && lng != null ? distanceKm(coords.lat, coords.lng, lat, lng) : null,
    }
  })
}

export const byNearest = (a: PlaceWithDistance, b: PlaceWithDistance) => {
  const da = a._distanceKm
  const db = b._distanceKm
  if (da != null && db != null) return da - db || byRating(a, b)
  if (da != null) return -1
  if (db != null) return 1
  return byRating(a, b)
}

export function scopeNearby(list: PlaceWithDistance[], radiusKm = NEARBY_KM, maxKm = MAX_KM) {
  const sorted = [...list].sort(byNearest)
  if (!sorted.some((p) => p._distanceKm != null)) return sorted
  const within = (km: number) => sorted.filter((p) => p._distanceKm != null && p._distanceKm <= km)
  const near = within(radiusKm)
  return near.length ? near : within(maxKm)
}

export function isAdLive(place: TouristPlace, now = Date.now()) {
  if (!place?.is_advertised) return false
  const starts = place.ad_starts_at ? Date.parse(place.ad_starts_at) : null
  const ends = place.ad_ends_at ? Date.parse(place.ad_ends_at) : null
  if (starts && now < starts) return false
  if (ends && now > ends) return false
  return true
}

function promotedNearbyFirst(list: PlaceWithDistance[], km = PROMOTED_KM) {
  const promoted: PlaceWithDistance[] = []
  const rest: PlaceWithDistance[] = []
  list.forEach((p) => {
    const d = p._distanceKm
    ;(isAdLive(p) && d != null && d <= km ? promoted : rest).push(p)
  })
  return [...promoted, ...rest]
}

export function pickCuratedPlaces(places: PlaceWithDistance[], limit = 10) {
  return promotedNearbyFirst(scopeNearby(places.filter(hasImage))).slice(0, limit)
}

// Live ads within MAX_KM (any distance when the location is unknown), by
// ad_priority, then nearest.
export function pickAdPlace(places: PlaceWithDistance[]) {
  const prio = (p: TouristPlace) => toNum(p?.ad_priority) ?? 999
  return (
    scopeNearby(places.filter((p) => hasImage(p) && isAdLive(p)), MAX_KM)
      .sort((a, b) => prio(a) - prio(b) || byNearest(a, b))[0] ?? null
  )
}

export function pickWeatherPlaces(places: PlaceWithDistance[], weather: Weather = 'unknown', limit = 10) {
  const rule = ruleFor(weather)
  return scopeNearby(places.filter((p) => matchesRule(p, rule))).slice(0, limit)
}

export function pickPackages(places: PlaceWithDistance[], limit = 10) {
  return scopeNearby(places.filter((p) => p?.booking_enabled && (toNum(p?.price) || 0) > 0)).slice(0, limit)
}

// ---- One-day plans ---------------------------------------------------------

// Coarse island regions by coordinates; `area` in the data is too inconsistent
// (street names, villages, districts) to group on.
const DAY_PLAN_REGIONS: { key: string; title: string; test: (lat: number, lng: number) => boolean }[] = [
  { key: 'north', title: 'North Coast Day', test: (lat) => lat > -20.1 },
  { key: 'south-west', title: 'South-West Icons', test: (lat, lng) => lat <= -20.35 && lng < 57.5 },
  { key: 'south-east', title: 'South-East Heritage Trail', test: (lat, lng) => lat <= -20.3 && lng >= 57.5 },
  { key: 'west', title: 'West Coast Sunsets', test: (_lat, lng) => lng < 57.45 },
  { key: 'east', title: 'East-Coast Island Day', test: (_lat, lng) => lng >= 57.65 },
  { key: 'central', title: 'Port Louis & Highlands', test: () => true },
]

function regionForPlace(place: TouristPlace) {
  const lat = toNum(place?.latitude)
  const lng = toNum(place?.longitude)
  if (lat == null || lng == null) return null
  return DAY_PLAN_REGIONS.find((r) => r.test(lat, lng)) || null
}

const STOP_LABEL_MAX = 28
const shortName = (name: string) => {
  const clean = String(name || '').replace(/[​-‍﻿]/g, '').trim()
  const first = clean.split(/\s[—|–-]\s|\s\/\s|\s\|\s/)[0].trim()
  return first.length > STOP_LABEL_MAX ? `${first.slice(0, STOP_LABEL_MAX - 1)}…` : first
}

export type DayPlan = {
  key: string
  title: string
  stopIds: string[]
  stopNames: string[]
  entryTotal: number
  coverImage: string | null
  nearestKm: number | null
}

export function buildDayPlans(places: PlaceWithDistance[], stopsPerPlan = 4, minStops = 3): DayPlan[] {
  const groups = new Map<string, PlaceWithDistance[]>()
  places.forEach((p) => {
    const region = regionForPlace(p)
    if (!region) return
    if (!groups.has(region.key)) groups.set(region.key, [])
    groups.get(region.key)!.push(p)
  })

  return DAY_PLAN_REGIONS.flatMap((region) => {
    const regionPlaces = groups.get(region.key)
    if (!regionPlaces) return []
    const stops = [...regionPlaces].sort(byRating).slice(0, stopsPerPlan)
    if (stops.length < minStops) return []
    const cover = stops.find(hasImage) ?? null
    const dists = stops.map((p) => p._distanceKm).filter((d): d is number => d != null)
    return [
      {
        key: region.key,
        title: region.title,
        stopIds: stops.map((p) => p.id),
        stopNames: stops.map((p) => shortName(p.place_name)),
        entryTotal: stops.reduce((sum, p) => sum + (toNum(p.price_local_adult) ?? toNum(p.price) ?? 0), 0),
        coverImage: cover ? placeImageUrl(cover) : null,
        nearestKm: dists.length ? Math.min(...dists) : null,
      },
    ]
  }).sort((a, b) => {
    if (a.nearestKm != null && b.nearestKm != null) return a.nearestKm - b.nearestKm
    if (a.nearestKm != null) return -1
    if (b.nearestKm != null) return 1
    return 0
  })
}
