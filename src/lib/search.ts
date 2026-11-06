/**
 * Global search ranking — app parity: screens/GlobalSearchScreen.jsx
 * (`indexItem`, `matchesQuery`, `computeQueryScore`, `rankQueryResults`).
 * Accent- and punctuation-insensitive, matches substrings, and forgives a typo
 * or two in a name / area word. Names weigh most, then area / city /
 * category, then address / description / cuisines; rating and popularity
 * break ties.
 */

export type SearchEntity = 'RESTAURANT' | 'STORE'

type Indexed = {
  primary: string[]
  secondary: string[]
  tertiary: string[]
  search: string
  words: string[]
  primaryWords: string[]
  fuzzyWords: string[]
}

export type Searchable = {
  name: string
  rating?: number | null
  rating_count?: number | null
}

/** Same as the app's `compactSearchText`: lowercase, strip accents and apostrophes, punctuation → spaces. */
export function compactSearchText(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['‘’`]/g, '')
    .replace(/[-_/.,]+/g, ' ')
    .replace(/\s+/g, ' ')
}

const compact = (values: unknown[]) => values.flat().map(compactSearchText).filter(Boolean)

const cache = new WeakMap<object, Indexed>()

/** The app's `indexItem`, kept off the object in a WeakMap. `fields` gives each bucket's raw values. */
function indexOf(item: object, fields: { primary: unknown[]; secondary: unknown[]; tertiary: unknown[]; extra?: unknown[] }): Indexed {
  const hit = cache.get(item)
  if (hit) return hit
  const primary = compact(fields.primary)
  const secondary = compact(fields.secondary)
  const tertiary = compact(fields.tertiary)
  const search = [...primary, ...secondary, ...tertiary, ...compact(fields.extra ?? [])].join(' ')
  const indexed: Indexed = {
    primary,
    secondary,
    tertiary,
    search,
    words: [...new Set(search.split(' ').filter(Boolean))],
    primaryWords: primary.join(' ').split(' ').filter(Boolean),
    fuzzyWords: [...new Set([...primary, ...secondary].join(' ').split(' ').filter(Boolean))],
  }
  cache.set(item, indexed)
  return indexed
}

function boundedLevenshtein(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let rowMin = i
    for (let j = 1; j <= b.length; j++) {
      const d = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
      cur[j] = d
      if (d < rowMin) rowMin = d
    }
    if (rowMin > max) return max + 1
    prev = cur
  }
  return prev[b.length]
}

function tokenMatchesWords(token: string, words: string[], fuzzyWords?: string[]): boolean {
  if (words.some(w => w.includes(token))) return true
  if (token.length <= 2) return false
  const maxDist = token.length <= 4 ? 1 : 2
  return (fuzzyWords ?? words).some(w => Math.abs(w.length - token.length) <= maxDist && boundedLevenshtein(token, w, maxDist) <= maxDist)
}

function matches(ix: Indexed, q: string, tokens: string[]): boolean {
  if (!q) return true
  if (ix.search.includes(q)) return true
  return tokens.every(t => tokenMatchesWords(t, ix.words, ix.fuzzyWords))
}

function score(ix: Indexed, item: Searchable, q: string, tokens: string[]): number {
  if (!q) return 0
  const bucket = (values: string[], base: number) =>
    values.reduce((best, v) => (v === q ? Math.max(best, base + 40) : v.startsWith(q) ? Math.max(best, base + 25) : v.includes(q) ? Math.max(best, base + 12) : best), 0)
  const p = bucket(ix.primary, 80)
  const s = bucket(ix.secondary, 45)
  const t = bucket(ix.tertiary, 20)
  const fuzzy = p === 0 && tokens.length && ix.primaryWords.length && tokens.every(tok => tokenMatchesWords(tok, ix.primaryWords)) ? 50 : 0
  return p + s + t + fuzzy + (Number(item.rating) || 0) * 2 + Math.min(20, (Number(item.rating_count) || 0) / 25)
}

export type Fields<T> = (item: T) => { primary: unknown[]; secondary: unknown[]; tertiary: unknown[]; extra?: unknown[] }

/** The app's `rankQueryResults`: matching items, best score first, then rating, popularity and name. */
export function rankResults<T extends Searchable & object>(items: T[], query: string, fields: Fields<T>): { item: T; score: number }[] {
  const q = compactSearchText(query)
  if (!q) return items.map(item => ({ item, score: 0 }))
  const tokens = q.split(' ').filter(Boolean)
  const out: { item: T; score: number }[] = []
  for (const item of items) {
    const ix = indexOf(item, fields(item))
    if (matches(ix, q, tokens)) out.push({ item, score: score(ix, item, q, tokens) })
  }
  return out.sort(
    (a, b) =>
      b.score - a.score ||
      (Number(b.item.rating) || 0) - (Number(a.item.rating) || 0) ||
      (Number(b.item.rating_count) || 0) - (Number(a.item.rating_count) || 0) ||
      a.item.name.localeCompare(b.item.name),
  )
}
