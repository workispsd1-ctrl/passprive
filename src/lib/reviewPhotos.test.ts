import { describe, expect, it } from 'vitest'
import { fitPhoto } from './reviewPhotos'

describe('fitPhoto', () => {
  it('shrinks the longest edge to 1600', () => {
    expect(fitPhoto(4000, 3000)).toEqual({ width: 1600, height: 1200 })
    expect(fitPhoto(3000, 4000)).toEqual({ width: 1200, height: 1600 })
  })
  it('never scales up', () => {
    expect(fitPhoto(800, 600)).toEqual({ width: 800, height: 600 })
  })
})
