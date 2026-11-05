import { describe, expect, it } from 'vitest'
import { timeAgo, topTags, visibleReviews, type ReviewRow } from './allReviews'

const NOW = Date.parse('2026-11-05T12:00:00Z')
const ago = (days: number) => new Date(NOW - days * 86400000).toISOString()

describe('timeAgo', () => {
  it('reads like the design', () => {
    expect(timeAgo(ago(0), NOW)).toBe('Today')
    expect(timeAgo(ago(2), NOW)).toBe('2 days ago')
    expect(timeAgo(ago(7), NOW)).toBe('1 week ago')
    expect(timeAgo(ago(14), NOW)).toBe('2 weeks ago')
    expect(timeAgo(ago(30), NOW)).toBe('1 month ago')
    expect(timeAgo(ago(800), NOW)).toBe('2 years ago')
    expect(timeAgo(null, NOW)).toBe('')
  })
})

const row = (o: Partial<ReviewRow>): ReviewRow => ({ id: 'x', rating: 4, text: '', name: 'A', avatar: null, tags: [], createdAt: ago(1), ...o })

describe('topTags', () => {
  it('ranks by how many reviews use a tag', () => {
    const reviews = [row({ tags: ['Coffee', 'Dessert'] }), row({ tags: ['Coffee', 'Coffee'] }), row({ tags: ['Ambience'] })]
    expect(topTags(reviews, 2)).toEqual(['Coffee', 'Ambience'])
  })
})

describe('visibleReviews', () => {
  const reviews = [
    row({ id: 'old', rating: 5, text: 'Great coffee', createdAt: ago(9), tags: ['Coffee'] }),
    row({ id: 'new', rating: 2, text: 'Too noisy', name: 'Meera', createdAt: ago(1) }),
  ]
  const ids = (o: Partial<Parameters<typeof visibleReviews>[1]>) => visibleReviews(reviews, { sort: 'Latest', tag: null, query: '', ...o }).map(r => r.id)
  it('sorts latest or by rating', () => {
    expect(ids({})).toEqual(['new', 'old'])
    expect(ids({ sort: 'High Rating' })).toEqual(['old', 'new'])
  })
  it('filters by tag and searches text and names', () => {
    expect(ids({ tag: 'Coffee' })).toEqual(['old'])
    expect(ids({ query: 'NOISY' })).toEqual(['new'])
    expect(ids({ query: 'meera' })).toEqual(['new'])
    expect(ids({ query: 'nothing' })).toEqual([])
  })
})
