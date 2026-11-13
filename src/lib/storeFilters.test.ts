import { describe, expect, it } from 'vitest'
import { EMPTY_STORE_FILTERS, applyStoreFilters, applyStoreQuickFilter, storeCategoryOptions, type StoreFilters } from './storeFilters'

// same fixtures and expectations as the app's utils/__tests__/storeFilters.test.js
const past = '2020-01-01T00:00:00Z'
const future = '2099-01-01T00:00:00Z'
const stores = [
  { id: 'a', category: 'Apparel, Accessories', distance_km: 2, store_offers: [{ offer_type: 'percentage', discount_value: 25, is_active: true, end_at: future }] },
  { id: 'b', category: 'Apparel', distance_km: 8, store_offers: [{ offer_type: 'flat', discount_value: 200, is_active: true }] },
  { id: 'c', category: 'Footwear, All Stores', distance_km: null, store_offers: [{ offer_type: 'percentage', discount_value: 50, is_active: true, end_at: past }] },
  { id: 'd', category: 'Jewellery', subcategory: 'Accessories', distance_km: 0.5, store_offers: [] },
]
const ids = (list: { id: string }[]) => list.map((s) => s.id).join(',')
const run = (f: Partial<StoreFilters>) => ids(applyStoreFilters(stores, { ...EMPTY_STORE_FILTERS, ...f }))

describe('applyStoreFilters', () => {
  it('matches categories from category + subcategory', () => {
    expect(run({ more: ['Apparel'] })).toBe('a,b')
    expect(run({ more: ['Accessories'] })).toBe('a,d')
  })
  it('matches only live offers', () => {
    expect(run({ more: ['Any Offer'] })).toBe('a,b')
    expect(run({ more: ['20% Off & Above'] })).toBe('a')
    expect(run({ more: ['50% Off & Above'] })).toBe('')
    expect(run({ more: ['Flat Amount Off'] })).toBe('b')
  })
  it('limits and sorts by distance', () => {
    expect(run({ distance: 'Within 3 km' })).toBe('a,d')
    expect(run({ distance: 'Nearby (< 1 km)' })).toBe('d')
    expect(run({ sort: 'Distance: Nearby to Far' })).toBe('d,a,b,c')
  })
  it('combines sections', () => {
    expect(run({ more: ['Apparel', 'Any Offer'], distance: 'Within 5 km' })).toBe('a')
  })
})

describe('quick filters and options', () => {
  it('Near Me sorts, other chips filter by category', () => {
    expect(ids(applyStoreQuickFilter(stores, 'Near Me'))).toBe('d,a,b,c')
    expect(ids(applyStoreQuickFilter(stores, 'Footwear'))).toBe('c')
  })
  it('lists categories by count then name', () => {
    expect(storeCategoryOptions(stores)).toEqual(['Accessories', 'Apparel', 'Footwear', 'Jewellery'])
  })
})
