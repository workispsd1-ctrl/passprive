import { respondToProposal } from '@/lib/booking/respondProposal'

/** Accept or decline a new time from a store / salon — app parity (b2ff80a): `respond_store_proposal`. */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return respondToProposal(request, 'store', id)
}
