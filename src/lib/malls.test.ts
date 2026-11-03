import { describe, expect, it } from 'vitest'
import { floorLabel, isInMall, mallAmenityKeys, mallKeyword, mallOpenStatus, sortMalls, weeklyHours } from './malls'

const week = Object.fromEntries(
  ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(d => [d, { open: '09:00', close: '21:00' }]),
)
// Tue 3 Nov 2026, Mauritius time (UTC+4)
const at = (hhmm: string) => new Date(`2026-11-03T${hhmm}:00+04:00`)

describe('mallOpenStatus', () => {
  it('reads open, opening later and opening tomorrow', () => {
    expect(mallOpenStatus(week, at('12:00'))).toEqual({ open: true, label: 'till 9:00PM' })
    expect(mallOpenStatus(week, at('07:00'))).toEqual({ open: false, label: 'Opens 9:00AM' })
    expect(mallOpenStatus(week, at('22:00'))).toEqual({ open: false, label: 'Opens tomorrow 9:00AM' })
  })
  it('carries an overnight close into the next morning', () => {
    const late = { ...week, Monday: { open: '18:00', close: '02:00' } }
    expect(mallOpenStatus(late, at('01:00'))).toEqual({ open: true, label: 'till 2:00AM' })
  })
  it('is null with no hours', () => {
    expect(mallOpenStatus(null)).toBeNull()
    expect(mallOpenStatus({})).toBeNull()
  })
})

describe('weeklyHours', () => {
  it('starts on Monday and marks closed days', () => {
    const rows = weeklyHours({ ...week, Sunday: { closed: true } })
    expect(rows[0]).toEqual({ day: 'Monday', text: '9:00AM – 9:00PM' })
    expect(rows[6]).toEqual({ day: 'Sunday', text: 'Closed' })
  })
})

describe('isInMall', () => {
  const mall = { name: 'Bagatelle Mall by Ascencia', lat: -20.2223, lng: 57.4984 }
  it('drops the owner from the name it searches for', () => {
    expect(mallKeyword(mall)).toBe('bagatelle mall')
  })
  it('matches the address or a spot within 150 m', () => {
    expect(isInMall({ address: ['Shop 4, Bagatelle Mall, Moka'], lat: null, lng: null }, mall)).toBe(true)
    expect(isInMall({ address: [], lat: -20.2224, lng: 57.4985 }, mall)).toBe(true)
    expect(isInMall({ address: ['Port Louis'], lat: -20.16, lng: 57.5 }, mall)).toBe(false)
  })
})

describe('floorLabel', () => {
  it('reads like the app', () => {
    expect(floorLabel('ground')).toBe('G')
    expect(floorLabel(0)).toBe('G')
    expect(floorLabel(1)).toBe('1st')
    expect(floorLabel(12)).toBe('12th')
    expect(floorLabel('Mezzanine')).toBe('Mezzanine')
    expect(floorLabel(null)).toBeNull()
  })
})

describe('lists', () => {
  it('sorts nearest first, then the curated order', () => {
    const rows = [
      { name: 'B', sort_order: 1 },
      { name: 'C', sort_order: 2, distance: 9 },
      { name: 'A', sort_order: 3, distance: 2 },
    ]
    expect(sortMalls(rows).map(m => m.name)).toEqual(['A', 'C', 'B'])
  })
  it('falls back to free parking and skips unknown amenities', () => {
    expect(mallAmenityKeys({ amenities: null, parking_available: true })).toEqual(['parking'])
    expect(mallAmenityKeys({ amenities: ['wifi', 'nope'], parking_available: false })).toEqual(['wifi'])
  })
})
