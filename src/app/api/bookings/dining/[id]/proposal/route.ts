import { respondToProposal } from '@/lib/booking/respondProposal'

/** Accept or decline a new time from the restaurant — app parity: BookingProposalBanner.jsx. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return respondToProposal(request, 'restaurant', id)
}
