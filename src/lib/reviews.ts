/**
 * Review config shared by the pages and the API — one shape for the three
 * review tables. `steps` are the aspects rated on top of the overall score —
 * app parity: LeaveReviewModal.jsx (three star ratings; the overall `rating`
 * is their average, saved alongside each one).
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
    // app parity: LeaveReviewModal STEP_LABELS.store (wellness stores relabel — see REVIEW_ASPECT_LABELS)
    steps: [
      { key: 'food', label: 'Products', column: 'food_rating' },
      { key: 'service', label: 'Staff', column: 'service_rating' },
      { key: 'ambience', label: 'Store', column: 'ambience_rating' },
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

/**
 * What the three ratings are called — app parity: LeaveReviewModal STEP_LABELS.
 * Every kind saves them to food_rating / service_rating / ambience_rating.
 */
export type ReviewAspect = 'restaurant' | 'wellness' | 'store'
export const REVIEW_ASPECT_LABELS: Record<ReviewAspect, [string, string, string]> = {
  restaurant: ['Food', 'Service', 'Ambience'],
  wellness: ['Treatment', 'Staff', 'Ambience'],
  store: ['Products', 'Staff', 'Store'],
}

/** The rated aspects for a review — restaurants and stores (wellness relabelled); tourist places keep their config. */
export function reviewSteps(kind: ReviewKind, aspect?: ReviewAspect): ReviewStep[] {
  const steps = REVIEW_CONFIG[kind].steps
  if (kind === 'tourist') return steps
  const labels = REVIEW_ASPECT_LABELS[aspect ?? (kind === 'restaurant' ? 'restaurant' : 'store')]
  return steps.map((step, i) => ({ ...step, label: labels[i] }))
}

/** Kinds whose dialog asks for the three aspect ratings (tourist places rate once — the app has no tourist sheet). */
export const usesAspectRatings = (kind: ReviewKind) => kind !== 'tourist'

/** app parity: overall = average of the aspects, one decimal. */
export const overallRating = (values: number[]) => Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))

export function isReviewKind(v: unknown): v is ReviewKind {
  return v === 'restaurant' || v === 'store' || v === 'tourist'
}

export const REVIEW_MAX_TEXT = 1000
