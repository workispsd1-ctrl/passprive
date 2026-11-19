import { describe, expect, it } from 'vitest'
import { hasLiveProposal, isBlockingBooking, isBookingRejected, proposalCoverAmount, proposalLabel, proposalPayNow } from './status'

const NOW = Date.parse('2026-11-03T08:00:00Z')
const proposal = { status: 'pending', proposed_at: '2026-11-03T07:00:00Z', proposed_date: '2026-11-05', proposed_time: '19:30:00' }

describe('hasLiveProposal', () => {
  it('is live while pending and still ahead', () => {
    expect(hasLiveProposal(proposal, NOW)).toBe(true)
  })
  it('ends once the booking moves on, the time passes, or nothing was proposed', () => {
    expect(hasLiveProposal({ ...proposal, status: 'confirmed' }, NOW)).toBe(false)
    expect(hasLiveProposal({ ...proposal, proposed_date: '2026-11-01' }, NOW)).toBe(false)
    expect(hasLiveProposal({ status: 'pending' }, NOW)).toBe(false)
  })
})

describe('proposalLabel', () => {
  it('reads like the app', () => {
    expect(proposalLabel(proposal)).toBe('Thu 5 Nov, 7:30 PM')
    expect(proposalLabel({ ...proposal, proposed_time: '00:05' })).toBe('Thu 5 Nov, 12:05 AM')
  })
})

describe('isBlockingBooking', () => {
  it('blocks confirmed and paid bookings', () => {
    expect(isBlockingBooking({ status: 'confirmed' })).toBe(true)
    expect(isBlockingBooking({ status: 'pending', payment_required: true, payment_status: 'paid', cover_charge_amount: 100 })).toBe(true)
  })
  it('blocks a free request but not one still waiting for its payment', () => {
    expect(isBlockingBooking({ status: 'pending', payment_required: false })).toBe(true)
    expect(isBlockingBooking({ status: 'requested', payment_required: true })).toBe(false)
  })
  it('never blocks on a cancelled booking', () => {
    expect(isBlockingBooking({ status: 'cancelled' })).toBe(false)
    expect(isBookingRejected({ status: 'Declined' })).toBe(true)
  })
})

describe('store proposals and cover asks (app b2ff80a)', () => {
  it('a store appointment proposal is live while new / placed', () => {
    expect(hasLiveProposal({ ...proposal, status: 'new' }, NOW, 'store')).toBe(true)
    expect(hasLiveProposal({ ...proposal, status: 'PLACED' }, NOW, 'store')).toBe(true)
    expect(hasLiveProposal({ ...proposal, status: 'pending' }, NOW, 'store')).toBe(false)
  })
  it('counts the cover ask only above what the booking already carries', () => {
    expect(proposalCoverAmount({ proposed_cover_amount: 500, cover_charge_amount: 200 })).toBe(500)
    expect(proposalPayNow({ proposed_cover_amount: 500, cover_charge_amount: 200 })).toBe(300)
    expect(proposalCoverAmount({ proposed_cover_amount: 200, cover_charge_amount: 200 })).toBe(0)
    expect(proposalPayNow({ proposed_cover_amount: null })).toBe(0)
  })
})
