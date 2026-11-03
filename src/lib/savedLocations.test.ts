import { describe, expect, it } from 'vitest'
import { dedupeLocations, resolveLabel } from './savedLocations'

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
