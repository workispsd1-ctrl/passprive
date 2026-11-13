import { describe, expect, it } from 'vitest'
import { buildStoreCatalogue } from './storeCatalogue'

const ids = (list: { id: string }[]) => list.map((i) => i.id).join(',')

describe('buildStoreCatalogue', () => {
  const categories = [
    { id: 'shoes', title: 'Shoes', sort_order: 2 },
    { id: 'bags', title: 'Bags', sort_order: 1 },
  ]
  const items = [
    { id: 's2', category_id: 'shoes', title: 'B', image_url: 'x', sort_order: 1 },
    { id: 's1', category_id: 'shoes', title: 'A', image_url: 'x', sort_order: 1 },
    { id: 'b1', category_id: 'bags', image_url: 'x', sort_order: 5 },
    { id: 'nophoto', category_id: 'bags', image_url: '  ', sort_order: 0 },
    // its category is switched off, so it isn't in `categories`
    { id: 'off', category_id: 'hats', image_url: 'x', sort_order: 0 },
    { id: 'loose', category_id: null, image_url: 'x', sort_order: 0 },
  ]

  it('groups by enabled category in order, drops photo-less and switched-off items', () => {
    expect(ids(buildStoreCatalogue(categories, items))).toBe('b1,s1,s2')
  })

  it('falls back to every item with a photo when no enabled category has items', () => {
    expect(ids(buildStoreCatalogue([], items))).toBe('s2,s1,b1,off,loose')
  })
})
