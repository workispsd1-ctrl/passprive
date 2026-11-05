/**
 * Review config shared by the pages and the API — one shape for the three
 * review tables. `steps` are the aspects the app's LeaveReviewModal asks about;
 * the website's single-rating dialog doesn't set them, so they're only read
 * back for reviews written in the app.
 */
export type ReviewKind = 'restaurant' | 'store' | 'tourist'

export interface ReviewStep {
  key: string
  /** names the aspect on reviews that have one */
  label: string
  /** rating column it was saved to; null = it is the overall rating */
  column: string | null
}

export interface ReviewConfig {
  table: string
  entityColumn: string
  steps: ReviewStep[]
  /** page pattern to revalidate after a change */
  path: string
}

export const REVIEW_CONFIG: Record<ReviewKind, ReviewConfig> = {
  restaurant: {
    table: 'restaurant_reviews',
    entityColumn: 'restaurant_id',
    steps: [
      { key: 'food', label: 'Food', column: 'food_rating' },
      { key: 'service', label: 'Service', column: 'service_rating' },
      { key: 'ambience', label: 'Ambience', column: 'ambience_rating' },
    ],
    path: '/dining/[id]',
  },
  store: {
    table: 'store_reviews',
    entityColumn: 'store_id',
    steps: [
      { key: 'overall', label: 'overall experience', column: null },
      { key: 'service', label: 'Service', column: 'service_rating' },
      { key: 'ambience', label: 'Ambience', column: 'ambience_rating' },
    ],
    path: '/stores/[id]',
  },
  tourist: {
    table: 'tourist_place_reviews',
    entityColumn: 'tourist_place_id',
    steps: [
      { key: 'guide', label: 'Guide', column: 'guide_rating' },
      { key: 'safety', label: 'Safety', column: 'safety_rating' },
      { key: 'value', label: 'Value for money', column: 'value_rating' },
    ],
    path: '/tourist/[id]',
  },
}

export function isReviewKind(v: unknown): v is ReviewKind {
  return v === 'restaurant' || v === 'store' || v === 'tourist'
}

export const REVIEW_MAX_TEXT = 1000
