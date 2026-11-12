import { describe, expect, it } from 'vitest'
import { dedupeLocations, resolveLabel, sameSpot, splitLocations, type SavedLocationRow } from './savedLocations'

describe('dedupeLocations', () => {
  it('keeps the newest copy, matching on place id and then address', () => {
    const rows = [
      { id: '1', address_text: 'Grand Baie', place_id: null },
      { id: '2', address_text: '  grand   baie ', place_id: null },
      { id: '3', address_text: 'Moka', place_id: 'p1' },
      { id: '4', address_text: 'Moka, Mauritius', place_id: 'P1' },
    ]
    expect(dedupeLocations(rows).map(r => r.id)).toEqual(['1', '3'])
  })
})

describe('resolveLabel', () => {
  it('uses the chip, or the typed name for Others', () => {
    expect(resolveLabel('hotel', 'ignored')).toBe('Stay/Hotel')
    expect(resolveLabel('others', ' Gym ')).toBe('Gym')
    expect(resolveLabel('others', '  ')).toBe('Others')
  })
})

describe('splitLocations', () => {
  const row = (id: string, is_recent: boolean, is_default = false) =>
    ({ id, address_text: id, place_id: null, is_recent, is_default }) as SavedLocationRow

  it('keeps the default in saved and leaves the current one out of recent', () => {
    const rows = [row('a', true, true), row('b', true), row('c', false), row('d', true)]
    const { saved, recent } = splitLocations(rows, r => r.id === 'a')
    expect(saved.map(r => r.id)).toEqual(['a', 'c'])
    expect(recent.map(r => r.id)).toEqual(['b', 'd'])
  })
})

describe('sameSpot', () => {
  it('matches coordinates rounded to 3 decimals', () => {
    expect(sameSpot({ lat: -20.161, lng: 57.501 }, { latitude: -20.16123, longitude: 57.50088 })).toBe(true)
    expect(sameSpot({ lat: -20.161, lng: 57.501 }, { latitude: -20.17, longitude: 57.50088 })).toBe(false)
    expect(sameSpot({ lat: null, lng: null }, { latitude: -20.16, longitude: 57.5 })).toBe(false)
  })
})
