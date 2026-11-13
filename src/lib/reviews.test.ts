import { describe, expect, it } from 'vitest'
import { overallRating, reviewSteps, usesAspectRatings } from './reviews'

// app parity: LeaveReviewModal.jsx STEP_LABELS and its overall-rating average
describe('review ratings', () => {
  it('labels the three aspects per kind, all saved to the same columns', () => {
    const labels = (s: ReturnType<typeof reviewSteps>) => s.map((x) => x.label)
    expect(labels(reviewSteps('restaurant'))).toEqual(['Food', 'Service', 'Ambience'])
    expect(labels(reviewSteps('store'))).toEqual(['Products', 'Staff', 'Store'])
    expect(labels(reviewSteps('store', 'wellness'))).toEqual(['Treatment', 'Staff', 'Ambience'])
    expect(reviewSteps('store', 'wellness').map((x) => x.column)).toEqual(['food_rating', 'service_rating', 'ambience_rating'])
  })

  it('overall is the average to one decimal', () => {
    expect(overallRating([5, 4, 4])).toBe(4.3)
    expect(overallRating([3, 4, 5])).toBe(4)
  })

  it('tourist places keep a single rating', () => {
    expect(usesAspectRatings('tourist')).toBe(false)
  })
})
