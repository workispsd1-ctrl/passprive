/** The All reviews page's rules — app parity for sort: AllReviewsScreen.jsx. */
export type ReviewRow = {
  id: string
  rating: number
  text: string
  name: string
  avatar: string | null
  tags: string[]
  createdAt: string | null
}
export type ReviewSort = 'Latest' | 'High Rating'

const DAY = 86400000

export function timeAgo(iso: string | null, now = Date.now()) {
  const at = Date.parse(iso ?? '')
  if (!Number.isFinite(at)) return ''
  const days = Math.max(0, Math.floor((now - at) / DAY))
  if (days === 0) return 'Today'
  if (days < 7) return days === 1 ? '1 day ago' : `${days} days ago`
  if (days < 30) { const w = Math.floor(days / 7); return w === 1 ? '1 week ago' : `${w} weeks ago` }
  if (days < 365) { const m = Math.floor(days / 30); return m === 1 ? '1 month ago' : `${m} months ago` }
  const y = Math.floor(days / 365)
  return y === 1 ? '1 year ago' : `${y} years ago`
}

/** The tags reviewers use most here, most used first. */
export function topTags(reviews: Pick<ReviewRow, 'tags'>[], limit = 4) {
  const counts = new Map<string, number>()
  for (const r of reviews) for (const tag of new Set(r.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([tag]) => tag)
}

export function visibleReviews(reviews: ReviewRow[], { sort, tag, query }: { sort: ReviewSort; tag: string | null; query: string }) {
  const q = query.trim().toLowerCase()
  const list = reviews.filter(r =>
    (!tag || r.tags.includes(tag)) &&
    (!q || r.text.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || r.tags.some(t => t.toLowerCase().includes(q))),
  )
  return list.sort((a, b) =>
    sort === 'High Rating'
      ? b.rating - a.rating
      : (Date.parse(b.createdAt ?? '') || 0) - (Date.parse(a.createdAt ?? '') || 0),
  )
}
